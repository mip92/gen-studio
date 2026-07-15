import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { spawn } from 'child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

const APP_ROOT             = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..', '..');
const KOHYA_PYTHON         = process.env.KOHYA_PYTHON ?? 'E:\\kohya_ss\\venv\\Scripts\\python.exe';
const VISION_RESIZE_SCRIPT = path.join(APP_ROOT, 'scripts', 'vision_resize.py');

const OLLAMA_URL         = process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434';
const VALIDATION_MODEL   = process.env.OLLAMA_VALIDATION_MODEL ?? 'qwen3-vl:8b';
const VISION_MAX_DIM     = Number(process.env.VISION_MAX_DIM ?? 768);
const KEEP_ALIVE         = process.env.OLLAMA_KEEP_ALIVE ?? '5m';
const REQUEST_TIMEOUT_MS = Number(process.env.VALIDATION_TIMEOUT_MS ?? 180_000);

/** Where anchor render drops its N candidate portraits, per profile. */
export const anchorCandidateDir = (slug: string, profileCode: string) =>
  path.join(APP_ROOT, 'data', slug, 'reference', '_candidates', profileCode);

/** One candidate portrait's verdict from the vision model. */
export interface AnchorVerdict {
  filename:      string;
  score:         number;   // 0-100 (identity match + clean single portrait); -1 = scoring error
  matchesPrompt: boolean;  // is this the right character, single clean subject?
  severe:        boolean;  // unusable: ANIME, multiple/extra faces, wrong person, deformed
  issues:        string[];
  error?:        string;
}

/**
 * Neural validation of character ANCHOR portraits — the identity source every
 * scene draws the character from, so a bad anchor poisons every shot. Mirrors
 * ImageValidationService but scores against the character's identity spec
 * (promptBase) with a HARD anti-anime rule: this pipeline is western graphic
 * novel, so an anime/manga/chibi face is an automatic reject. Picks the best
 * clean single-subject portrait out of the N candidates and installs it as the
 * profile's <profileCode>_anchor.png; if none is acceptable, sets no anchor and
 * proposes an improved promptBase.
 */
@Injectable()
export class AnchorValidationService {
  private readonly logger = new Logger(AnchorValidationService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get db(): any { return this.prisma as any; }

  // ── Queue-aware API (used by PipelineQueueService) ──────────────────────────

  async findNextPending() {
    return this.db.anchorValidationJob.findFirst({
      where:   { status: 'pending' },
      orderBy: { queuedAt: 'asc' },
    });
  }

  /** Recent anchor-validation jobs for a profile (newest first) — UI polls this. */
  list(profileId: string) {
    return this.db.anchorValidationJob.findMany({
      where:   { profileId },
      orderBy: { queuedAt: 'desc' },
      take:    50,
    });
  }

  /**
   * Manually re-run validation over the candidate portraits still on disk for
   * this profile (the "re-check" button). No-op with a clear reason if there are
   * no candidates — the user must render an anchor first.
   */
  async revalidate(profileId: string): Promise<{ queued: boolean; jobId: string | null; reason?: string }> {
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: { include: { projectLinks: { include: { project: true } } } } },
    });
    const project = profile?.character.projectLinks[0]?.project;
    if (!profile || !project) throw new NotFoundException(`Profile ${profileId} not found or not attached to a project`);
    const candDir = anchorCandidateDir(project.slug, profile.profileCode);
    const files = existsSync(candDir)
      ? readdirSync(candDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
      : [];
    if (files.length === 0) {
      return { queued: false, jobId: null, reason: 'no candidate portraits on disk — generate an anchor first' };
    }
    const job = await this.enqueue(profileId, files, profile.promptBase ?? null);
    return { queued: !!job, jobId: job?.id ?? null, reason: job ? undefined : 'a validation is already pending/running' };
  }

  /**
   * Enqueue an anchor-validation pass. Snapshots the candidate filenames and the
   * identity spec (promptBase) so the queue worker can score them later. No-op
   * (null) with fewer than 1 candidate or if one is already pending/running.
   */
  async enqueue(profileId: string, candidates: string[], expectedPrompt: string | null) {
    const clean = (candidates ?? []).filter(Boolean);
    if (clean.length < 1) return null;
    const inflight = await this.db.anchorValidationJob.count({
      where: { profileId, status: { in: ['pending', 'running'] } },
    });
    if (inflight > 0) return null;
    return this.db.anchorValidationJob.create({
      data: {
        profileId,
        status:         'pending',
        expectedPrompt: expectedPrompt ?? undefined,
        candidates:     clean as any,
      },
    });
  }

  /**
   * Score every candidate portrait and install the winner as the profile's
   * anchor.png. Caller (PipelineQueueService.dispatchAnchorValidation) has
   * already marked the job `running` and stopped ComfyUI. Sets the job
   * completed/failed on the way out.
   */
  async run(jobId: string): Promise<void> {
    const job = await this.db.anchorValidationJob.findUnique({ where: { id: jobId } });
    if (!job) return;
    try {
      const profile = await this.prisma.characterProfile.findUnique({
        where:   { id: job.profileId },
        include: { character: { include: { projectLinks: { include: { project: true } } } } },
      });
      const project = profile?.character.projectLinks[0]?.project;
      if (!profile || !project) throw new Error(`profile ${job.profileId} or its project not found`);

      const characterName = profile.character.displayName?.trim() || null;
      const identitySpec  = (job.expectedPrompt?.trim() || profile.promptBase?.trim() || '') || null;

      const candDir = anchorCandidateDir(project.slug, profile.profileCode);
      const pool = ((job.candidates as string[] | null) ?? [])
        .filter((f) => f && existsSync(path.join(candDir, f)));
      if (pool.length === 0) throw new Error('no candidate anchor files on disk to validate');

      const verdicts = await this.scoreCandidates(candDir, pool, identitySpec, characterName);

      // Acceptable = scored cleanly, no severe defect (incl. ANIME), matches the
      // character. Never settle for the least-bad — if none acceptable, set no
      // anchor and propose a better promptBase.
      const acceptable = verdicts
        .filter((v) => !v.error && !v.severe && v.matchesPrompt)
        .sort((a, b) => b.score - a.score);
      const winner = acceptable[0] ?? null;

      let suggestedPrompt: string | null = null;
      if (winner) {
        // Install the winning candidate as the profile's canonical anchor.
        const destDir  = path.join(APP_ROOT, 'data', project.slug, 'reference');
        const destPath = path.join(destDir, `${profile.profileCode}_anchor.png`);
        mkdirSync(destDir, { recursive: true });
        copyFileSync(path.join(candDir, winner.filename), destPath);
      } else {
        suggestedPrompt = await this.suggestPrompt(identitySpec, verdicts).catch((e) => {
          this.logger.warn(`suggestPrompt failed: ${e?.message ?? e}`);
          return null;
        });
      }

      await this.db.anchorValidationJob.update({
        where: { id: jobId },
        data:  {
          status:          'completed',
          result:          verdicts as any,
          chosenFilename:  winner?.filename ?? null,
          suggestedPrompt: suggestedPrompt ?? null,
          completedAt:     new Date(),
        },
      });
      if (winner) {
        this.logger.log(`Anchor validation ${jobId}: picked ${winner.filename} (score ${winner.score}) for ${profile.profileCode} out of ${pool.length}`);
      } else {
        this.logger.warn(`Anchor validation ${jobId}: NO acceptable portrait for ${profile.profileCode} (${pool.length} scored) — no anchor set, ${suggestedPrompt ? 'suggested a new promptBase' : 'no suggestion'}`);
      }
    } catch (e: any) {
      this.logger.error(`Anchor validation ${jobId} failed: ${e?.message ?? e}`);
      await this.db.anchorValidationJob.update({
        where: { id: jobId },
        data:  { status: 'failed', errorMessage: String(e?.message ?? e), completedAt: new Date() },
      }).catch(() => {});
    }
  }

  // ── Scoring internals ───────────────────────────────────────────────────────

  private async scoreCandidates(
    candDir: string,
    filenames: string[],
    identitySpec: string | null,
    characterName: string | null,
  ): Promise<AnchorVerdict[]> {
    const tmpDir = path.join(os.tmpdir(), 'gen-studio-vision', `anchor-${Date.now()}-${Math.floor(Math.random() * 1e6)}`);
    mkdirSync(tmpDir, { recursive: true });
    const pairs = filenames.map((f) => ({ filename: f, small: path.join(tmpDir, f) }));
    try {
      await this.resize(pairs.map((p) => [path.join(candDir, p.filename), p.small] as [string, string]));
      const instruction = this.buildScoringInstruction(identitySpec, characterName);
      const verdicts: AnchorVerdict[] = [];
      for (const p of pairs) {
        const imgPath = existsSync(p.small) ? p.small : path.join(candDir, p.filename);
        verdicts.push(await this.scoreOne(p.filename, imgPath, instruction));
      }
      return verdicts;
    } finally {
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* best effort */ }
    }
  }

  /** The QC rubric for a character anchor portrait. HARD anti-anime. */
  private buildScoringInstruction(identitySpec: string | null, characterName: string | null): string {
    const parts: string[] = [
      'You are a ruthless art director doing QC on ONE AI-generated CHARACTER REFERENCE PORTRAIT (an "anchor" — the single canonical face used to draw this character in every later scene, so it must be clean and correct). Examine the ENTIRE frame.',
    ];
    if (identitySpec && identitySpec.trim()) {
      parts.push(`REQUIRED CHARACTER — the portrait must depict this exact person: "${identitySpec.trim()}"${characterName ? ` (character: ${characterName})` : ''}. This text may include art-style tokens (e.g. "graphic novel", "cell-shaded", "ink outline") — IGNORE the style words and judge only the PERSON: their age, sex, face, hair, build, and any named identity features. A portrait that clearly shows a different kind of person than described is a mismatch.`);
    }
    parts.push(
      // HARD anti-anime — the user's explicit requirement. Western graphic novel only.
      'STYLE HARD-REJECT — this project is WESTERN GRAPHIC-NOVEL / American comic art. ANIME, MANGA, CHIBI or "cute" styling is FORBIDDEN and makes the portrait UNUSABLE. If the face reads as anime/manga in ANY way — oversized glossy sparkly eyes, tiny nose/mouth, chibi or childlike proportions, flat anime cel shading, kawaii look — set "anime" true, "severe_defect" true and "matches_prompt" false. A correct anchor has grounded semi-realistic adult comic proportions and a naturalistic inked face.',
      'COMPOSITION — a single character, head-and-shoulders (three-quarter) portrait. Flag as severe: MORE THAN ONE person / an extra face anywhere (background, mirror, duplicate), a full-body or tiny-in-frame figure instead of a head-and-shoulders portrait, or no clear face at all.',
      'ANATOMY — the face and any visible hands/neck/shoulders must be clean and natural. Flag melted/distorted/asymmetric faces, extra or missing facial features, malformed hands, wrong or impossible proportions, garbled text or watermarks.',
      'Return JSON: "anime" (true if the portrait reads as anime/manga/chibi in any way); ' +
      '"matches_prompt" (true ONLY if it is the right character AND a single clean head-and-shoulders portrait AND not anime); ' +
      '"severe_defect" (true if UNUSABLE — anime, multiple/extra faces, wrong person, no face, or a badly deformed face); ' +
      '"score" (integer 0-100: start at 100 and subtract hard for every defect; any anime or severe_defect forces score <= 15); ' +
      '"issues" (array of short concrete strings for what you see; empty only if the portrait is truly clean).',
    );
    return parts.join(' ');
  }

  private async scoreOne(filename: string, imgPath: string, instruction: string): Promise<AnchorVerdict> {
    const b64 = readFileSync(imgPath).toString('base64');
    let lastErr = '';
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(`${OLLAMA_URL}/api/chat`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            model:      VALIDATION_MODEL,
            stream:     false,
            format:     'json',
            keep_alive: KEEP_ALIVE,
            messages:   [{ role: 'user', content: instruction, images: [b64] }],
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
        const data = (await res.json()) as { message?: { content?: string } };
        const content = (data.message?.content ?? '').trim();
        if (!content) throw new Error('empty content from model');
        const parsed = JSON.parse(content);
        // Anime is a severe defect regardless of what the model put in severe_defect.
        const severe = parsed.severe_defect === true || parsed.anime === true;
        let score = clampScore(parsed.score);
        if (severe && score > 15) score = 15;
        return {
          filename,
          score,
          matchesPrompt: parsed.matches_prompt === true && !severe,
          severe,
          issues: [
            ...(parsed.anime === true ? ['anime/manga style — reject'] : []),
            ...(Array.isArray(parsed.issues) ? parsed.issues.map(String) : []),
          ],
        };
      } catch (e: any) {
        lastErr = String(e?.message ?? e);
        this.logger.warn(`scoreOne ${filename} attempt ${attempt} failed: ${lastErr}`);
      }
    }
    return { filename, score: -1, matchesPrompt: false, severe: false, issues: [], error: lastErr };
  }

  /**
   * When no candidate passed, ask the model to rewrite the character's promptBase
   * so a re-render fixes the failures (especially anime). Text-only → fast.
   */
  private async suggestPrompt(identitySpec: string | null, verdicts: AnchorVerdict[]): Promise<string | null> {
    const issues = Array.from(new Set(verdicts.flatMap((v) => v.issues))).slice(0, 12);
    if (!identitySpec?.trim() && issues.length === 0) return null;
    const anime = verdicts.some((v) => v.severe && v.issues.some((i) => /anime|manga|chibi/i.test(i)));
    const ask = [
      'An image generator produced several candidate CHARACTER PORTRAITS (anchors) and ALL of them failed quality control.',
      identitySpec?.trim() ? `The intended character identity description ("promptBase") was: "${identitySpec.trim()}".` : '',
      issues.length ? `The recurring problems were: ${issues.join('; ')}.` : '',
      anime ? 'CRITICAL: the portraits kept coming out in ANIME/MANGA style, which is forbidden — the target is grounded semi-realistic WESTERN GRAPHIC-NOVEL / American comic art with a naturalistic inked adult face. Add explicit steering toward that and against anime.' : '',
      'Rewrite the promptBase (the character identity description ONLY — physical appearance, age, build, face, hair, distinctive features) so a re-render fixes these specific problems while keeping the same person. Be concrete and visual. Return ONLY the rewritten promptBase as plain text — no preamble, no quotes, no explanation.',
    ].filter(Boolean).join(' ');

    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ model: VALIDATION_MODEL, prompt: ask, stream: false, think: false, keep_alive: KEEP_ALIVE }),
      signal:  AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { response?: string };
    const text = (data.response ?? '').trim().replace(/^["'`]+|["'`]+$/g, '').trim();
    return text.length > 0 ? text : null;
  }

  private resize(pairs: Array<[string, string]>): Promise<void> {
    return new Promise((resolve) => {
      if (pairs.length === 0) return resolve();
      if (!existsSync(KOHYA_PYTHON) || !existsSync(VISION_RESIZE_SCRIPT)) {
        this.logger.warn('resize: python or vision_resize.py missing — scoring full-res');
        return resolve();
      }
      const argv = [VISION_RESIZE_SCRIPT, String(VISION_MAX_DIM)];
      for (const [s, d] of pairs) { argv.push(s, d); }
      const proc = spawn(KOHYA_PYTHON, argv, { stdio: ['ignore', 'ignore', 'pipe'] });
      let err = '';
      proc.stderr.on('data', (c: Buffer) => { err += c.toString(); });
      proc.on('close', (code) => {
        if (code !== 0 && err.trim()) this.logger.warn(`vision_resize rc=${code}: ${err.trim().slice(0, 300)}`);
        resolve();
      });
      proc.on('error', (e) => { this.logger.warn(`vision_resize spawn error: ${e.message}`); resolve(); });
    });
  }
}

function clampScore(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}
