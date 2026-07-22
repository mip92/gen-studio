import { BadRequestException, Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { YoutubeAuthService } from './youtube-auth.service';
import { YoutubeUploadService } from './youtube-upload.service';

/** Minimal self-closing HTML page for the browser-facing OAuth callback. */
const page = (title: string, body: string) => `<!doctype html><html><head>
<meta charset="utf-8"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;background:#0b0b0d;color:#eee;
display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
.card{max-width:520px;padding:32px;text-align:center;line-height:1.5}
h1{font-size:20px}a{color:#7aa2ff}</style></head>
<body><div class="card">${body}</div></body></html>`;

/**
 * Global (not per-project) YouTube OAuth + connection-status endpoints.
 *   GET /youtube/auth/status   → { connected, channelTitle, configured }
 *   GET /youtube/oauth/url     → 302 redirect to Google's consent screen
 *   GET /youtube/oauth/callback→ exchanges the code, stores tokens, shows a page
 */
@ApiTags('YouTube')
@Controller('youtube')
export class YoutubeAuthController {
  constructor(
    private readonly auth:   YoutubeAuthService,
    private readonly upload: YoutubeUploadService,
  ) {}

  @Get('auth/status')
  @ApiOperation({ summary: 'Is the YouTube channel connected?' })
  status() {
    return this.auth.getStatus();
  }

  @Get('playlists')
  @ApiOperation({ summary: 'List the connected channel\'s playlists (upload targets)' })
  playlists() {
    return this.upload.listPlaylists();
  }

  @Get('next-slot')
  @ApiOperation({
    summary: 'Suggest the next Tue/Thu publish slot after the last scheduled video',
    description: 'kind=main → 16:00 Kyiv; kind=short → 16:05. Scans the channel\'s '
      + 'uploads (incl. scheduled private videos) for the latest occupied date.',
  })
  nextSlot(@Query('kind') kind?: string) {
    return this.upload.suggestNextSlot(kind === 'short' ? 'short' : 'main');
  }

  @Get('pick-file')
  @ApiOperation({
    summary: 'Open a native file picker on the server machine, return the chosen path',
    description: 'kind=video|image. Blocks until the user picks or cancels. Localhost '
      + 'tool: the dialog appears on the machine running the backend.',
  })
  pickFile(@Query('kind') kind?: string) {
    return this.upload.pickFile(kind === 'image' ? 'image' : 'video');
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Poll a background upload job (status/result/error)' })
  job(@Param('jobId') jobId: string) {
    return this.upload.getJob(jobId);
  }

  @Get('oauth/url')
  @ApiOperation({ summary: 'Redirect to the Google OAuth consent screen' })
  start(@Res() res: Response) {
    res.redirect(this.auth.getAuthUrl());
  }

  @Get('oauth/callback')
  @ApiOperation({ summary: 'OAuth redirect target — stores the channel tokens' })
  async callback(
    @Res() res: Response,
    @Query('code') code?: string,
    @Query('error') error?: string,
  ) {
    if (error) {
      res.status(400).send(page('YouTube — ошибка',
        `<h1>Авторизация отклонена</h1><p>${error}</p>`));
      return;
    }
    if (!code) {
      res.status(400).send(page('YouTube — ошибка',
        `<h1>Нет кода авторизации</h1><p>Попробуй ещё раз с /youtube/oauth/url</p>`));
      return;
    }
    try {
      const { channelTitle } = await this.auth.handleCallback(code);
      res.send(page('YouTube подключён',
        `<h1>✅ YouTube подключён</h1>
         <p>Канал: <b>${channelTitle ?? 'неизвестно'}</b></p>
         <p>Можно закрыть вкладку и вернуться в gen-studio.</p>`));
    } catch (e) {
      throw new BadRequestException(`OAuth exchange failed: ${(e as Error).message}`);
    }
  }
}
