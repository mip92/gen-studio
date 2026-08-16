import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import { google } from 'googleapis';

// Derive the auth types from the exact google-auth-library instance that
// `googleapis` bundles (there's a second copy nested under googleapis-common;
// importing straight from 'google-auth-library' resolves the wrong one and the
// OAuth2Client classes then don't unify — TS2322).
type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;
type Credentials  = Parameters<OAuth2Client['setCredentials']>[0];

const APP_ROOT = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..', '..');

/** Where the channel's OAuth tokens live. Single channel → single file, no DB
 *  migration needed. Contains a refresh_token → must stay out of git (data/ is
 *  already gitignored) and off any shared disk. */
const TOKEN_PATH = path.join(APP_ROOT, 'data', 'youtube-auth.json');

/** Scopes: upload a video + set its thumbnail + read the channel's own analytics.
 *  `force-ssl` is what `thumbnails.set` requires; `upload` is what `videos.insert`
 *  requires; `yt-analytics.readonly` is what `youtubeAnalytics.reports.query` and
 *  the Reporting API (CTR / thumbnail impressions) require. The analytics scope
 *  MUST stay in this list — re-authorising without it silently strips it from the
 *  stored token and every reports.query starts failing with
 *  `insufficient authentication scopes`. */
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
];

export interface YoutubeAuthStatus {
  connected:    boolean;
  /** Present once connected — the authorised channel's title, for the UI. */
  channelTitle: string | null;
  /** True when env is missing YT_CLIENT_ID/SECRET — nothing can work yet. */
  configured:   boolean;
  /** False when the stored token predates the analytics scope: uploads still
   *  work, every reports.query fails. Fix = re-run the consent flow. */
  analytics:    boolean;
}

/**
 * Owns the OAuth2 handshake and token persistence for the single YouTube channel
 * we upload to. Everything runs on localhost:
 *   1. `getAuthUrl()`  → user visits, consents, Google redirects to the callback.
 *   2. `handleCallback(code)` → exchange code for tokens, persist them.
 *   3. `getClient()`   → an authorised OAuth2 client (auto-refreshes access token
 *                        from the stored refresh_token), or null if not connected.
 *
 * The refresh_token is long-lived ONLY if the OAuth app is in "In production"
 * publishing status (see project notes). In "Testing" it expires after 7 days and
 * the user must re-run the consent flow.
 */
@Injectable()
export class YoutubeAuthService {
  private readonly logger = new Logger(YoutubeAuthService.name);

  /** Raw OAuth2 client built from env. Null when env is not configured. */
  private buildOAuthClient(): OAuth2Client | null {
    const clientId     = process.env.YT_CLIENT_ID;
    const clientSecret = process.env.YT_CLIENT_SECRET;
    const redirectUri  = process.env.YT_REDIRECT_URI
      ?? 'http://localhost:4000/youtube/oauth/callback';
    if (!clientId || !clientSecret) return null;

    const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    // Persist rotated tokens (Google returns a fresh access_token on refresh, and
    // sometimes a new refresh_token — merge so we never lose the refresh_token).
    client.on('tokens', (tokens) => {
      const merged = { ...this.loadTokens(), ...tokens };
      this.saveTokens(merged);
    });
    return client;
  }

  isConfigured(): boolean {
    return Boolean(process.env.YT_CLIENT_ID && process.env.YT_CLIENT_SECRET);
  }

  private loadTokens(): Credentials {
    if (!existsSync(TOKEN_PATH)) return {};
    try {
      return JSON.parse(readFileSync(TOKEN_PATH, 'utf8')) as Credentials;
    } catch (e) {
      this.logger.warn(`Corrupt token file ${TOKEN_PATH}: ${(e as Error).message}`);
      return {};
    }
  }

  private saveTokens(tokens: Credentials): void {
    mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
    writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), 'utf8');
  }

  /** Build the Google consent URL. `offline` + `consent` guarantees a
   *  refresh_token is issued on first authorisation. */
  getAuthUrl(): string {
    const client = this.buildOAuthClient();
    if (!client) {
      throw new InternalServerErrorException(
        'YouTube OAuth is not configured — set YT_CLIENT_ID and YT_CLIENT_SECRET in .env',
      );
    }
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt:      'consent',
      scope:       SCOPES,
    });
  }

  /** Exchange the callback `code` for tokens and persist them. Returns the
   *  authorised channel title for the success page. */
  async handleCallback(code: string): Promise<{ channelTitle: string | null }> {
    const client = this.buildOAuthClient();
    if (!client) {
      throw new InternalServerErrorException('YouTube OAuth is not configured');
    }
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token && !this.loadTokens().refresh_token) {
      // Without a refresh_token we can't upload later. Happens if the user has
      // consented before without `prompt=consent`; revoke access and retry.
      this.logger.warn('No refresh_token returned — re-consent with prompt=consent');
    }
    this.saveTokens({ ...this.loadTokens(), ...tokens });
    client.setCredentials(this.loadTokens());
    return { channelTitle: await this.fetchChannelTitle(client) };
  }

  /** An authorised OAuth2 client, or null when not connected yet. */
  getClient(): OAuth2Client | null {
    const client = this.buildOAuthClient();
    if (!client) return null;
    const tokens = this.loadTokens();
    if (!tokens.refresh_token && !tokens.access_token) return null;
    client.setCredentials(tokens);
    return client;
  }

  /** Does the stored token actually carry the analytics scope? Google echoes the
   *  granted scopes back in the token as a space-separated `scope` string. */
  hasAnalyticsScope(): boolean {
    const granted = (this.loadTokens() as Credentials & { scope?: string }).scope ?? '';
    return granted.split(/\s+/).includes('https://www.googleapis.com/auth/yt-analytics.readonly');
  }

  async getStatus(): Promise<YoutubeAuthStatus> {
    const configured = this.isConfigured();
    const client = configured ? this.getClient() : null;
    const analytics = this.hasAnalyticsScope();
    if (!client) return { connected: false, channelTitle: null, configured, analytics };
    try {
      return { connected: true, channelTitle: await this.fetchChannelTitle(client), configured, analytics };
    } catch (e) {
      this.logger.warn(`Auth status check failed: ${(e as Error).message}`);
      return { connected: false, channelTitle: null, configured, analytics };
    }
  }

  private async fetchChannelTitle(client: OAuth2Client): Promise<string | null> {
    const youtube = google.youtube({ version: 'v3', auth: client });
    const res = await youtube.channels.list({ part: ['snippet'], mine: true });
    return res.data.items?.[0]?.snippet?.title ?? null;
  }
}
