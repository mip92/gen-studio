import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { spawn } from 'child_process';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';
import { QueueLedgerService } from '../pipeline/queue-ledger.service';
import { YoutubeAuthService } from './youtube-auth.service';

const APP_ROOT   = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..', '..');
const QWEN3_PY   = process.env.QWEN3_PYTHON
                 ?? path.join(APP_ROOT, '.venv-qwen3', 'Scripts', 'python.exe');
const SCRIPT     = path.join(APP_ROOT, 'scripts', 'transcribe_srt.py');
/** faster-whisper model for full-video transcription (override with WHISPER_MODEL). */
const WHISPER_MODEL = process.env.WHISPER_MODEL ?? 'medium';
/** Device: 'cuda' (fast, auto-falls back to CPU in the script) or 'cpu'. */
const WHISPER_DEVICE = process.env.WHISPER_DEVICE ?? 'cuda';
/** Kill a transcription that runs longer than this — it would wedge the single
 *  queue slot and stall all renders. Generous for a ~40-min film on CPU. */
const CAPTION_TIMEOUT_MS = Number(process.env.CAPTION_TIMEOUT_MS ?? 90 * 60 * 1000);

/** Compact vocabulary bias from the known VO text: distinctive Capitalized words
 *  (names/places) + number-bearing tokens, deduped and capped. Whisper's
 *  initial_prompt window is small, so we feed the hard words, not the whole script.
 *  Exported — VoValidationService biases its per-shot transcriptions the same way. */
export function buildGlossary(vo: string): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of vo.split(/\s+/)) {
    const w = raw.replace(/[^\p{L}\p{N}-]/gu, '');
    if (w.length < 2) continue;
    if (!/^\p{Lu}/u.test(w) && !/\d/.test(w)) continue; // keep Capitalized or numeric
    const key = w.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(w);
    if (out.length >= 120) break;
  }
  return out.join(', ').slice(0, 900);
}

/** Where the .srt for a given source mp4 lives: right next to it, so the transcribe
 *  step and the later attach step derive the SAME path purely from videoPath. */
export function srtPathForVideo(videoPath: string, language = 'ru'): string {
  const ext = path.extname(videoPath);
  return videoPath.slice(0, videoPath.length - ext.length) + `.${language}.srt`;
}

export interface CaptionJobView {
  id:           string;
  videoId:      string;
  status:       string;
  uploaded:     boolean;
  srtPath:      string | null;
  errorMessage: string | null;
  queuedAt:     string;
  completedAt:  string | null;
}

/**
 * Generates and uploads YouTube caption tracks for a project's MAIN video:
 * transcribes the final mp4 with faster-whisper (→ .srt) then `captions.insert`s
 * it. Modelled as a queue job (CaptionJob) so the slow transcription runs through
 * PipelineQueueService's single slot rather than blocking an HTTP request.
 */
@Injectable()
export class YoutubeCaptionsService {
  private readonly logger = new Logger(YoutubeCaptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth:   YoutubeAuthService,
    private readonly ledger: QueueLedgerService,
  ) {}

  /** Enqueue a caption job for a project's uploaded video. */
  async enqueue(idOrSlug: string, videoId: string, videoPath: string, language = 'ru'): Promise<CaptionJobView> {
    if (!videoId?.trim())   throw new BadRequestException('videoId is required (upload the video first)');
    if (!videoPath?.trim()) throw new BadRequestException('videoPath is required');
    if (!existsSync(videoPath)) throw new BadRequestException(`Video file not found: ${videoPath}`);
    if (!this.auth.getClient()) throw new BadRequestException('YouTube is not connected.');

    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!project) throw new NotFoundException(`Project "${idOrSlug}" not found`);

    const job = await (this.prisma as any).captionJob.create({
      data: { projectId: project.id, videoId, videoPath, language },
    });
    await this.ledger.enqueue('caption', job.id, { paramsSnapshot: { videoId, videoPath, language } });
    this.logger.log(`Enqueued caption job ${job.id} for video ${videoId}`);
    return this.view(job);
  }

  /** Enqueue a TRANSCRIBE-ONLY job (no upload yet): whisper → .srt next to the
   *  mp4, no captions.insert. Used by the launch stepper, which generates subs
   *  from the local file BEFORE the video is uploaded; the SRT is attached later
   *  at upload time. videoId='' is the transcribe-only sentinel. */
  async enqueueTranscribe(idOrSlug: string, videoPath: string, language = 'ru'): Promise<CaptionJobView> {
    if (!videoPath?.trim()) throw new BadRequestException('videoPath is required');
    if (!existsSync(videoPath)) throw new BadRequestException(`Video file not found: ${videoPath}`);
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!project) throw new NotFoundException(`Project "${idOrSlug}" not found`);
    const job = await (this.prisma as any).captionJob.create({
      data: { projectId: project.id, videoId: '', videoPath, language },
    });
    await this.ledger.enqueue('caption', job.id, { paramsSnapshot: { videoPath, language, transcribeOnly: true } });
    this.logger.log(`Enqueued TRANSCRIBE-only caption job ${job.id} for ${videoPath}`);
    return this.view(job);
  }

  /** Latest caption job for a specific mp4 path (launch tracks subs per file,
   *  before videoIds exist). */
  async latestForVideoPath(videoPath: string): Promise<CaptionJobView | null> {
    const job = await (this.prisma as any).captionJob.findFirst({
      where: { videoPath }, orderBy: { queuedAt: 'desc' },
    });
    return job ? this.view(job) : null;
  }

  /** Attach an already-transcribed SRT (sitting next to the mp4) to a just-uploaded
   *  video. Returns true if a track was attached, false if no SRT exists yet. */
  async attachExisting(videoId: string, videoPath: string, language = 'ru'): Promise<boolean> {
    const srtPath = srtPathForVideo(videoPath, language);
    if (!existsSync(srtPath)) return false;
    const client = this.auth.getClient();
    if (!client) return false;
    const youtube = google.youtube({ version: 'v3', auth: client });
    await youtube.captions.insert({
      part: ['snippet'],
      requestBody: { snippet: { videoId, language, name: 'Русские субтитры', isDraft: false } },
      media: { mimeType: 'application/octet-stream', body: createReadStream(srtPath) },
    });
    return true;
  }


  /** Latest caption job for a project (for the UI to poll). */
  async latestForProject(idOrSlug: string): Promise<CaptionJobView | null> {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!project) return null;
    const job = await (this.prisma as any).captionJob.findFirst({
      where: { projectId: project.id }, orderBy: { queuedAt: 'desc' },
    });
    return job ? this.view(job) : null;
  }

  /**
   * Run a caption job: transcribe → captions.insert. The dispatcher has already
   * marked it `running`. Self-updates the row to completed/failed. Never throws
   * to the caller (fire-and-forget from the queue).
   */
  async run(jobId: string): Promise<void> {
    const job = await (this.prisma as any).captionJob.findUnique({ where: { id: jobId } });
    if (!job) { this.logger.warn(`caption job ${jobId} vanished`); return; }

    try {
      const lang    = job.language ?? 'ru';
      const srtPath = srtPathForVideo(job.videoPath, lang);   // next to the mp4
      mkdirSync(path.dirname(srtPath), { recursive: true });

      // ── 0. bias vocabulary from the KNOWN VO text (names/terms/numbers) ─────
      // We already know the script — feed its distinctive vocabulary to whisper
      // as initial_prompt so it spells names/numbers right. Written to a UTF-8
      // file (not argv) so Cyrillic survives the Windows console codepage.
      let promptFile: string | undefined;
      try {
        const shots = await this.prisma.shot.findMany({
          where: { projectId: job.projectId },
          select: { narrationText: true },
        });
        const vo    = shots.map((s) => s.narrationText ?? '').join(' ');
        const gloss = buildGlossary(vo);
        if (gloss) {
          promptFile = srtPath.replace(/\.srt$/, '.prompt.txt');
          writeFileSync(promptFile, gloss, 'utf8');
          this.logger.log(`caption ${jobId}: glossary ${gloss.length} chars from VO`);
        }
      } catch (e) {
        this.logger.warn(`caption ${jobId}: glossary build failed (${(e as Error).message}) — transcribing without bias`);
      }

      // ── 1. transcribe (faster-whisper subprocess) ──────────────────────────
      await this.transcribe(job.videoPath, srtPath, lang, promptFile);
      if (!existsSync(srtPath)) throw new Error('transcription produced no .srt');

      // ── 2. attach the caption track — ONLY if this job has a videoId. The
      //       launch flow transcribes first (videoId=''), then attaches at upload.
      let uploaded = false;
      if (job.videoId) {
        const client = this.auth.getClient();
        if (!client) throw new Error('YouTube disconnected before caption upload');
        const youtube = google.youtube({ version: 'v3', auth: client });
        await youtube.captions.insert({
          part: ['snippet'],
          requestBody: {
            snippet: { videoId: job.videoId, language: lang, name: 'Русские субтитры', isDraft: false },
          },
          media: { mimeType: 'application/octet-stream', body: createReadStream(srtPath) },
        });
        uploaded = true;
      }

      await (this.prisma as any).captionJob.update({
        where: { id: jobId },
        data:  { status: 'completed', uploaded, srtPath, completedAt: new Date() },
      });
      await this.ledger.close('caption', jobId, { status: 'completed', outputFilename: srtPath });
      this.logger.log(`Caption job ${jobId} done → SRT ${srtPath}${uploaded ? ` (attached to ${job.videoId})` : ' (transcribe-only)'}`);
    } catch (e) {
      const msg = (e as Error).message ?? String(e);
      this.logger.error(`Caption job ${jobId} failed: ${msg}`);
      await (this.prisma as any).captionJob.update({
        where: { id: jobId },
        data:  { status: 'failed', errorMessage: msg.slice(0, 500), completedAt: new Date() },
      });
      await this.ledger.close('caption', jobId, { status: 'failed', errorMessage: msg.slice(0, 500) });
    }
  }

  /** Spawn the whisper subprocess; resolve on exit 0, reject otherwise. A hard
   *  timeout kills a hung transcription so it can't wedge the single queue slot. */
  private transcribe(videoPath: string, srtPath: string, language: string, promptFile?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!existsSync(QWEN3_PY)) {
        reject(new Error(`qwen3 venv python not found: ${QWEN3_PY}`));
        return;
      }
      const args = ['--input', videoPath, '--output', srtPath, '--language', language,
                    '--model', WHISPER_MODEL, '--device', WHISPER_DEVICE];
      if (promptFile) args.push('--initial-prompt-file', promptFile);
      this.logger.log(`whisper: ${QWEN3_PY} ${SCRIPT} ${args.join(' ')}`);
      const proc = spawn(QWEN3_PY, [SCRIPT, ...args], { cwd: APP_ROOT });
      let stderr = '';
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        proc.kill('SIGKILL');
      }, CAPTION_TIMEOUT_MS);
      proc.stderr.on('data', (d) => { stderr += d.toString(); });
      proc.on('error', (e) => { clearTimeout(timer); reject(e); });
      proc.on('close', (code) => {
        clearTimeout(timer);
        if (timedOut) reject(new Error(`whisper timed out after ${CAPTION_TIMEOUT_MS / 60000} min`));
        else if (code === 0) resolve();
        else reject(new Error(`whisper exited ${code}: ${stderr.trim().slice(-400)}`));
      });
    });
  }

  private view(job: any): CaptionJobView {
    return {
      id:           job.id,
      videoId:      job.videoId,
      status:       job.status,
      uploaded:     job.uploaded,
      srtPath:      job.srtPath ?? null,
      errorMessage: job.errorMessage ?? null,
      queuedAt:     job.queuedAt?.toISOString?.() ?? String(job.queuedAt),
      completedAt:  job.completedAt?.toISOString?.() ?? null,
    };
  }
}
