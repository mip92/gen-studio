import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { execFile, spawn } from 'child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'fs';
import { promisify } from 'util';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { QueueLedgerService } from '../pipeline/queue-ledger.service';
import { EngineService } from '../pipeline/engine.service';
import { ENGINE_CLASS, JobType } from '../pipeline/queue-entry.types';
import { ComfyService } from '../comfy/comfy.service';
import { normalizeStyleLora } from '../generation/scenes/scene-render.service';
import { QwenSceneGraphBuilder } from '../generation/scenes/qwen/qwen-scene-graph.builder';
import { composeQwenInstruction, KEEP_REFERENCE_STYLE, REALCOMIC_COVER_STYLE } from '../generation/scenes/qwen/qwen-prompt';
import { describeWorkflowLookup, resolveWorkflowPath } from '../comfy/workflow-path';
import {
  batchDiversityProblems,
  composeCoverPrompt,
  coverPromptProblems,
  sanitizeCoverPrompt,
  type CoverPromptFields,
} from './cover-prompt.gate';

const execFileAsync = promisify(execFile);

const APP_ROOT     = process.env.APP_ROOT     ?? 'E:\\ComfyUI\\gen-studio';
const COMFY_OUTPUT = process.env.COMFY_OUTPUT ?? 'E:\\ComfyUI\\output';
const COMFY_INPUT  = process.env.COMFY_INPUT  ?? 'E:\\ComfyUI\\input';
// The python that has Pillow. Same default as ExportsService/export_shorts.py.
const CAPTION_PYTHON = process.env.EXPORT_PYTHON ?? process.env.PYTHON_BIN
  ?? 'E:\\kohya_ss\\venv\\Scripts\\python.exe';

/**
 * YouTube thumbnail workshop.
 *
 * The operator works a POOL, not a single cover: several concepts are queued at
 * once, each renders a handful of candidates, the pool is topped up whenever
 * nothing convinces, and exactly one frame is finally promoted and captioned.
 *
 *   ideas[] -> enqueueIdeas() -> queue -> pollRunning() -> candidates on disk
 *           -> choose(jobId, filename) -> applyCaption() -> the cover
 *
 * Two deliberate departures from the scene renders, both because a thumbnail is
 * ONE hero image looked at up close rather than 1/350th of a film:
 *
 *   1. NO Lightning LoRA, real steps, cfg above 1. Costs minutes instead of
 *      seconds, and — the part that matters here — a cfg above 1.0 is what makes
 *      the negative prompt live at all, so "no text, no letters" finally bites.
 *   2. reference_latents ON by default (the scenes default OFF): a cover is
 *      judged on likeness, so the anchor's pixel channel is kept even though it
 *      can bleed the studio-grey portrait framing into the composition. Per-idea
 *      override (`referenceLatents: false`) when that bleed shows up.
 *
 * The art comes back with zero lettering by construction; the caption is drawn
 * afterwards by scripts/render_caption.py from a font file (user decision
 * 2026-07-27, after eight Qwen renders proved a diffusion model cannot place
 * typography).
 */

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434';
/**
 * Text model that invents the cover concepts.
 *
 * The 30B, by the user's call (2026-07-28), for one reason: RUSSIAN. The 8B
 * writes usable English art prompts but its Russian captions come out broken
 * («ОНО ТАК ВЕЗЛО», «ПОКОЕТ», «СЛАМЛЯН») — and the caption is the thing that
 * wins the click, so a garbled one makes the whole concept worthless.
 *
 * The cost is speed: 19 GB of weights on a 16 GB card means CPU offload, and
 * this task deliberately budgets 16k tokens (see askModel). The 8B took 389 s;
 * expect the 30B to take substantially longer. That is affordable because this
 * runs once per batch of concepts, not per image. Set OLLAMA_IDEAS_MODEL to
 * `qwen3-vl:8b` to trade the Russian back for speed.
 */
const IDEAS_MODEL = process.env.OLLAMA_IDEAS_MODEL ?? 'qwen3-vl:30b';
/**
 * Screenplay context for the idea model.
 *
 * Preferred source: the project's English short script (settings.scriptShort.en,
 * written by the scenario skill) plus the screenplay's FINALE verbatim. Fallback
 * when the short script is missing yet: opening + finale slices. The old blind
 * slice(0, 8000) showed the model only the setup — and a cover concept is almost
 * always about the reckoning, so it hallucinated one (car_flipper round of
 * 2026-08-07: an invented fire, a broken signature, three contradictory ages).
 */
const SCRIPT_HEAD = 6_000;
const SCRIPT_TAIL = 6_000;

/** Frames per idea. Five gives a real choice inside one concept — at two, a
 *  weak pair kills an idea that was actually fine. */
const DEFAULT_BATCH = 5;

const ACTIVE_JOB_STATUSES = ['pending', 'running'];

/**
 * Exactly YouTube's thumbnail canvas, and exactly what render_caption.py draws
 * on. Rendering larger (it was 1536×864) only bought pixels that the caption
 * pass then threw away on the downscale.
 * Both axes are multiples of 16, which is what the SD3 latent needs.
 */
const THUMB_WIDTH = 1280;
const THUMB_HEIGHT = 720;

/**
 * Real sampling, since the speed LoRA is out of the chain.
 *
 * 26 steps at cfg 3.0. Every step is expensive twice over here: the 20B model
 * does not fit in the 16 GB card, so its weights are streamed per step, and cfg
 * above 1.0 runs the positive and negative branches separately — two passes over
 * those streamed weights.
 *
 * Raised from 15 on 2026-08-08, together with the palette rules and the LoRA
 * strength below, against the complaint that covers come out grey and flat next
 * to ordinary shots. 15 was neither regime: the scenes' 4 steps are what the
 * Lightning distillation was trained for, while this chain drops Lightning and
 * runs the raw base, whose own numbers are 40 steps / cfg 4.0. Undersampling a
 * base model reads exactly as flat, low-contrast colour. 26 is the compromise
 * that keeps one cover under a couple of minutes.
 */
const THUMB_STEPS = 26;
const THUMB_CFG = 3.0;

/**
 * Sampling tiers, because "full" is not always worth its wait.
 *
 * Cost is passes over the streamed weights per frame: steps × (cfg > 1 ? 2 : 1).
 * A cover at `full` costs 52 against an ordinary shot's 4 — and the job renders
 * a whole batch, so five frames is ~15 minutes (user, 2026-08-10).
 *
 *   scene    — exactly the ordinary-shot regime. Lightning is a step-distillation
 *              LoRA trained FOR cfg 1.0, so guidance is baked in and the negative
 *              branch is inert; raising cfg here would only burn the image. Fast,
 *              and the user reports ordinary scenes look right, so this is a
 *              legitimate cover tier, not merely a preview.
 *   balanced — Lightning KEPT at its own cfg 1.0, twice the steps of a scene:
 *              more room for the model to redraw and relight without paying the
 *              double-branch cost of cfg > 1. See the table below for why this
 *              is not "full with fewer steps".
 *   full     — the 2026-08-08 settings, kept as the default so nothing changes
 *              for anyone who does not pick a tier.
 */
export type ThumbQuality = 'scene' | 'balanced' | 'full';

const THUMB_TIERS: Record<ThumbQuality, { lightning: boolean; steps: number; cfg: number }> = {
  scene:    { lightning: true,  steps: 4,           cfg: 1.0 },
  // Lightning STAYS here, and only the step count rises. The 2026-08-10 version
  // of this tier dropped Lightning and ran 14 steps at cfg 2.5, which was the
  // worst cell of the table on both axes at once: 28 passes per frame (7× the
  // scene tier) AND 14 steps on a bare 20B, which is the same undersampling that
  // produced the "covers are grey and flat" complaint of 08-08. Measured on
  // car_flipper «ДВА ОДОМЕТРА», batch 5: it was still running at 17 minutes.
  //
  // Steps and Lightning are independent knobs in QwenSceneGraphBuilder, so the
  // honest middle rung is more room to redraw at the cfg the LoRA was distilled
  // for: 8 passes per frame, ~2× the scene tier instead of 7×. The negative
  // stays inert at cfg 1.0 — acceptable, because the caption is stamped from a
  // font file afterwards and 300+ shots per film render this way without
  // spraying letters. `full` remains one click away when a live negative is
  // genuinely wanted.
  balanced: { lightning: true,  steps: 8,           cfg: 1.0 },
  full:     { lightning: false, steps: THUMB_STEPS, cfg: THUMB_CFG },
};

/**
 * Default tier: the ordinary-shot regime.
 *
 * `full` held this slot until 2026-08-10, when a single car_flipper batch ran 36
 * minutes and the user called it unacceptable — correctly: 5 frames × 52 passes
 * is 260 passes of a 20B model that has to be streamed past a 16 GB card.
 *
 * The 2026-08-08 "covers come out grey and flat" complaint does NOT argue
 * against this. That was 15 steps with Lightning REMOVED — undersampling a base
 * model, which reads as flat, low-contrast colour. Lightning at 4 steps is not
 * undersampling; it is the regime the LoRA was distilled for, and it is what
 * every ordinary shot in every film already renders at. Those look right.
 *
 * `full` stays one click away for a cover worth the wait.
 */
const DEFAULT_QUALITY: ThumbQuality = 'scene';

/** Coerce whatever is on the row (or in a request body) to a known tier. */
export function normalizeThumbQuality(v: unknown): ThumbQuality {
  return v === 'scene' || v === 'balanced' || v === 'full' ? v : DEFAULT_QUALITY;
}

/**
 * Word cap for the cover's scene prompt inside composeQwenInstruction.
 *
 * The scenes cap at 55 because a long positive loses the fight to the anchor's
 * pose (measured, caregiver A0_SH19). A cover is a single hero frame rendered
 * at real steps, and the idea model is asked for 40-90 words of composition —
 * capping that at 55 silently ate exactly the trailing clauses that matter most
 * here: the palette and the quiet lower third the caption is drawn on.
 */
const THUMB_SCENE_BUDGET = 90;

/**
 * The "no lettering" requirement lives HERE, in the negative, and nowhere else.
 *
 * Qwen prompting rule 2 (see qwen-prompt.ts): negations in the positive do not
 * work — "no text in the image" reads to the VL encoder as the word "text" and
 * invites exactly what it forbids. The negative is the right channel, and it is
 * only usable because this graph runs at cfg 3.0; at the scenes' cfg 1.0 it
 * would be completely inert.
 *
 * Live at cfg 3.0 — unlike the scene renders, this actually does something.
 */
const THUMB_NEGATIVE =
  'text, letters, captions, typography, words, numbers, gibberish text, watermark, signature, ' +
  // Small printed props are where lettering actually sneaks back in: tickets,
  // labels and signs get written on even when nothing asked for text.
  'labels, signage, printed words on paper, writing on tickets, handwriting, logos, ' +
  'photograph, photorealistic, 3D render, plastic skin, anime, manga, chibi, ' +
  'deformed hands, extra fingers, two heads, blurry, low contrast, low quality, ' +
  // The "ugly cover" cluster, added 2026-08-08 with the craft block in the idea
  // prompt: flat frontal light and a cluttered single plane are what made earlier
  // covers read as cheap even when the concept was fine.
  'flat lighting, flat single plane, cluttered background, busy background, ' +
  'muddy colours, washed out, dull grey haze over everything, empty grey backdrop, ' +
  'studio portrait backdrop, centred passport-photo framing';

/**
 * Caption gate.
 *
 * `refProfileCodes` have always been validated here, on the reasoning that a
 * hallucinated code "would otherwise fail the render minutes later". The caption
 * had no such gate, and it is the more expensive failure: a bad code stops the
 * pipeline loudly, a bad caption gets DRAWN. Observed live on `announcer`
 * (batch of 2026-07-28 20:21, rendered 2026-07-29 05:00):
 *
 *   «СЛУШАЛ ГОЛОС — СТАНДОР»   «ОДИН СОБЫТИЙ — ТУДЕЛКА»   «ВЕЗДА ОДИН БИЛЕТ»
 *
 * Six covers, ~1 GPU hour, all with unusable lettering — and the caption is the
 * thing that wins the click.
 *
 * What this can and cannot do, stated plainly: it catches *mechanical* damage —
 * Latin letters mixed into Cyrillic, consonant pile-ups, vowel-less words, wrong
 * word counts, an accent word that is not in the lines. It CANNOT tell that
 * «ТУДЕЛКА» is not a Russian word; that needs a lexicon we do not have here. So
 * this gate narrows the failure, it does not close it — the prompt's negative
 * examples do the rest, and the operator still reads the caption before
 * `choose()` burns it in.
 *
 * A rejected caption is DROPPED, not repaired: the picker then opens with an
 * empty caption box, which is honest, instead of pre-filled garbage that looks
 * approved.
 *
 * Since 2026-08-08 the model drafts captions in ENGLISH (user's call): the 30B's
 * free-composed Russian kept slipping agreement errors — «ПИСЬМО НЕ БЫЛО»,
 * «ВИКТОР НЕ УБРАЛ ПУТЬ» — past both gates, every word real, the sentence not.
 * The operator translates the chosen draft into Russian by hand before it is
 * drawn; the lexicon pass below therefore only applies to Cyrillic words.
 */
const CAPTION_MAX_LINES = 2;
const CAPTION_MIN_WORDS = 2;
const CAPTION_MAX_WORDS = 6;
const CAPTION_VOWELS = 'АЕЁИОУЫЭЮЯAEIOUY';
/** Punctuation a caption may legitimately carry, plus digits for the numbers. */
const CAPTION_ALLOWED = /^[А-ЯЁA-Z0-9\s.,!?:;«»"'()\-—–]+$/;

/** Words split off a caption line, punctuation stripped, empties dropped. */
function captionWords(line: string): string[] {
  return line
    .replace(/[.,!?:;«»"'()\-—–]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * @returns null when the caption is usable, else the reason it was refused
 *          (logged, so a systematically bad model shows up in the log instead of
 *          quietly on the covers).
 */
export function captionProblem(lines: string[], accentWord?: string): string | null {
  if (!lines.length) return 'нет строк';
  if (lines.length > CAPTION_MAX_LINES) return `строк ${lines.length}, максимум ${CAPTION_MAX_LINES}`;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) return 'пустая строка';
    // The caption is drawn in capitals; a lowercase reply means the model
    // ignored the format, which correlates with it ignoring the rest.
    if (line !== line.toUpperCase()) return `строка не капсом: «${line}»`;
    if (!CAPTION_ALLOWED.test(line)) return `посторонние символы: «${line}»`;

    const words = captionWords(line);
    if (words.length < CAPTION_MIN_WORDS || words.length > CAPTION_MAX_WORDS) {
      return `в строке ${words.length} слов, нужно ${CAPTION_MIN_WORDS}-${CAPTION_MAX_WORDS}: «${line}»`;
    }
    for (const w of words) {
      if (/^\d+$/.test(w)) continue;                       // a bare number is fine
      const hasVowel = [...w].some((ch) => CAPTION_VOWELS.includes(ch));
      if (!hasVowel && w.length > 2) return `слово без гласных «${w}»`;
      if (/[^АЕЁИОУЫЭЮЯAEIOUY0-9\s]{5,}/.test(w)) return `нечитаемое скопление согласных «${w}»`;
    }
  }

  if (accentWord) {
    const all = lines.flatMap(captionWords).map((w) => w.toUpperCase());
    if (!all.includes(accentWord.trim().toUpperCase())) {
      return `accent_word «${accentWord}» отсутствует в строках — красить нечего`;
    }
  }
  return null;
}

export interface ThumbnailIdea {
  /** Short label for the picker ("птица в золотой клетке"). */
  idea?: string;
  /** The art prompt, prose, no lettering requested. */
  prompt: string;
  negative?: string;
  /** Profile codes whose anchors go in as image1..image3, max 3. */
  refProfileCodes?: string[];
  /** Keep the anchor's pixel channel. Default true — a cover lives or dies on
   *  the likeness. Set false when the anchor's studio framing bleeds through. */
  referenceLatents?: boolean;
  /** Candidates for this idea (default 5). */
  batchSize?: number;
  /** Sampling tier — 'scene' | 'balanced' | 'full'. Omitted = full, so the
   *  operator who does not care keeps the behaviour they already had. */
  quality?: string;
  /** Caption the model proposed alongside the art, so the picker opens with its
   *  wording already filled in. */
  captionSpec?: unknown;
  /** The model's own justification for the chosen faces/age — shown in the
   *  picker so the operator can disagree on sight. Not persisted. */
  refReason?: string;
}

@Injectable()
export class ThumbnailRenderService {
  private readonly logger = new Logger(ThumbnailRenderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: QueueLedgerService,
    private readonly comfy: ComfyService,
    private readonly engine: EngineService,
  ) {}

  private get jobs() {
    return (this.prisma as any).thumbnailJob;
  }

  /**
   * Let a model-written caption through only if it passes {@link captionProblem}.
   * Returns undefined for a refused one, so the picker shows an empty caption
   * box the operator has to fill — see the gate's own comment for why dropping
   * beats repairing.
   */
  private acceptCaption(idea: any, projectSlug: string): { lines: string[]; accent_word?: string } | undefined {
    if (!Array.isArray(idea?.caption_lines) || idea.caption_lines.length === 0) return undefined;
    const lines  = idea.caption_lines.map((l: unknown) => String(l).trim()).filter(Boolean);
    const accent = idea.accent_word ? String(idea.accent_word).trim() : undefined;

    const problem = captionProblem(lines, accent);
    if (problem) {
      this.logger.warn(
        `Caption refused (${projectSlug}, idea «${idea.idea ?? '?'}»): ${problem}. `
        + `Lines: ${JSON.stringify(lines)}. Оператор напишет подпись сам.`,
      );
      return undefined;
    }
    return { lines, accent_word: accent };
  }

  /** Final caption verdict: drop it if the lexicon did not recognise a word. */
  private dropIfNonWords(
    caption: { lines: string[]; accent_word?: string } | undefined,
    nonWords: Set<string>,
    idea: any,
    projectSlug: string,
  ): { lines: string[]; accent_word?: string } | undefined {
    if (!caption || nonWords.size === 0) return caption;
    const bad = caption.lines
      .flatMap(captionWords)
      .filter((w) => nonWords.has(w.toLowerCase()));
    if (bad.length === 0) return caption;
    this.logger.warn(
      `Caption refused (${projectSlug}, idea «${idea?.idea ?? '?'}»): не русские слова — ${bad.join(', ')}. `
      + `Lines: ${JSON.stringify(caption.lines)}. Оператор напишет подпись сам.`,
    );
    return undefined;
  }

  /**
   * Which of these words are not Russian words at all.
   *
   * The mechanical gate cannot see this: «ТУДЕЛКА» and «СТАНДОР» are shaped like
   * Russian, so only a lexicon catches them. `scripts/check_ru_words.py` reads
   * RUAccent's 3.19M-form dictionary — already on disk for the TTS stack, so no
   * new download — and empirically rejected every observed non-word while
   * passing every real word tested.
   *
   * ONE spawn per batch, never per idea: the dictionary takes ~4 s to load.
   *
   * Degrades to an empty set on any failure (python missing, dictionary moved,
   * bad JSON) and says so in the log. A cover must never be blocked because a
   * dictionary is unavailable — the mechanical gate and the operator remain.
   */
  private async unknownRussianWords(words: string[]): Promise<Set<string>> {
    // Single letters are skipped: the lexicon has no one-character entries, so
    // the one-letter prepositions («в», «с», «к», «у», «о») would come back
    // "unknown" and kill a perfectly good caption. Caught on the live winner
    // «В ТВОЕЙ БУДКЕ ГОЛОСА». Numbers are skipped for the same reason. Latin
    // words are skipped too: captions are ENGLISH drafts now, and the Russian
    // lexicon would reject every one of them wholesale.
    const probe = [...new Set(
      words.map((w) => w.trim().toLowerCase())
           .filter((w) => w.length > 1 && !/^\d+$/.test(w) && /[а-яё]/.test(w)),
    )];
    if (probe.length === 0) return new Set();

    const py = process.env.TTS_PYTHON ?? process.env.PYTHON_BIN ?? CAPTION_PYTHON;
    const script = path.join(APP_ROOT, 'scripts', 'check_ru_words.py');
    if (!existsSync(py) || !existsSync(script)) {
      this.logger.warn(`Lexicon check skipped: python=${py} script=${script} — проверяю подписи только механически`);
      return new Set();
    }

    try {
      const raw = await new Promise<string>((resolve, reject) => {
        const child = spawn(py, [script], { stdio: ['pipe', 'pipe', 'pipe'] });
        let out = '', err = '';
        const timer = setTimeout(() => { child.kill(); reject(new Error('lexicon check timed out')); }, 120_000);
        child.stdout.setEncoding('utf-8');
        child.stdout.on('data', (d) => { out += d; });
        child.stderr.setEncoding('utf-8');
        child.stderr.on('data', (d) => { err += d; });
        child.on('error', (e) => { clearTimeout(timer); reject(e); });
        child.on('close', () => {
          clearTimeout(timer);
          if (out.trim()) resolve(out);
          else reject(new Error(err.slice(0, 300) || 'no output'));
        });
        // UTF-8 over stdin on purpose: Cyrillic through argv arrives mangled.
        child.stdin.end(JSON.stringify({ words: probe }), 'utf-8');
      });

      const res = JSON.parse(raw) as { ok?: boolean; unknown?: string[]; error?: string; lexicon?: number };
      if (!res.ok) {
        this.logger.warn(`Lexicon check unavailable (${res.error}) — проверяю подписи только механически`);
        return new Set();
      }
      this.logger.log(`Lexicon check: ${probe.length} слов против ${res.lexicon} форм, не найдено ${res.unknown?.length ?? 0}`);
      return new Set(res.unknown ?? []);
    } catch (e: any) {
      this.logger.warn(`Lexicon check failed (${e?.message}) — проверяю подписи только механически`);
      return new Set();
    }
  }

  private get ideaJobs() {
    return (this.prisma as any).thumbnailIdeaJob;
  }

  /** Where a project's candidate art lives. */
  private artDir(slug: string): string {
    return path.join(APP_ROOT, 'data', slug, 'thumbnail', 'candidates');
  }

  /**
   * Stage 2 of the pipeline: the LOCAL MODEL invents the cover concepts from the
   * screenplay. Nothing here is hand-written — the operator asks for ideas,
   * reviews them, and queues the ones worth rendering.
   *
   * Runs on Ollama, which needs the whole card, so it refuses while a ComfyUI
   * job holds the queue slot rather than killing someone's render. ComfyUI is
   * stopped for the call and its VRAM released afterwards, exactly as the
   * validation jobs do it.
   */
  async enqueueIdeaJob(idOrSlug: string, count = 6): Promise<any> {
    const project = await this.findProject(idOrSlug);
    const job = await this.ideaJobs.create({
      data: { projectId: project.id, count, status: 'pending' },
    });
    await this.ledger.enqueue('thumbnail_ideas', job.id);
    this.logger.log(`Thumbnail ideas enqueued: project=${project.slug} count=${count} job=${job.id}`);
    return job;
  }

  /**
   * Throw away ONE proposed concept. Rounds accumulate and are never rewritten
   * by the next generation, so the only thing that ever removes a concept is
   * this — an explicit click.
   */
  async deleteProposedIdea(jobId: string, index: number): Promise<any> {
    const job = await this.ideaJobs.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Idea round ${jobId} not found`);

    const ideas = Array.isArray(job.result) ? [...job.result] : [];
    if (index < 0 || index >= ideas.length) {
      throw new BadRequestException(`No idea #${index} in this round (it has ${ideas.length})`);
    }
    ideas.splice(index, 1);

    this.logger.log(`Proposed idea dropped: round=${jobId} #${index}, ${ideas.length} left`);
    return this.ideaJobs.update({ where: { id: jobId }, data: { result: ideas as any } });
  }

  /** Every proposal round for this project, newest first. */
  async listIdeaJobs(idOrSlug: string): Promise<any[]> {
    const project = await this.findProject(idOrSlug);
    return this.ideaJobs.findMany({ where: { projectId: project.id }, orderBy: { queuedAt: 'desc' } });
  }

  /**
   * Run one proposal job. Called by the dispatcher, which has already stopped
   * ComfyUI — engine arbitration is the queue's business, not ours.
   */
  async runIdeaJob(jobId: string): Promise<void> {
    const job = await this.ideaJobs.findUnique({ where: { id: jobId } });
    if (!job) return;
    try {
      const ideas = await this.generateIdeas(job.projectId, job.count);
      await this.ideaJobs.update({
        where: { id: jobId },
        data:  { status: 'completed', result: ideas as any, completedAt: new Date() },
      });
      await this.ledger.close('thumbnail_ideas', jobId, { status: 'completed' });
      this.logger.log(`Thumbnail ideas ready: job=${jobId} n=${ideas.length}`);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      await this.ideaJobs.update({
        where: { id: jobId },
        data:  { status: 'failed', errorMessage: msg, completedAt: new Date() },
      });
      await this.ledger.close('thumbnail_ideas', jobId, { status: 'failed', errorMessage: msg });
      this.logger.warn(`Thumbnail ideas failed: job=${jobId} — ${msg}`);
    }
  }

  /** One call to the local model. Returns its trimmed reply, '' if it gave none.
   *
   *  Logs the shape of every exchange: this path failed six times in a row with
   *  nothing to look at, because the interesting numbers (`done_reason`,
   *  `eval_count`, the size of the hidden `thinking` field) live in the response
   *  envelope and never reach the caller. */
  private async askModel(instructions: string): Promise<string> {
    const started = Date.now();
    this.logger.log(
      `ollama → model=${IDEAS_MODEL} prompt=${instructions.length} chars, num_ctx=32768 num_predict=16384`,
    );
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:    IDEAS_MODEL,
        // STREAMING IS NOT COSMETIC HERE. With stream:false Ollama buffers the
        // entire generation and only then sends response headers — and Node's
        // fetch (undici) gives up waiting for headers after 5 minutes, which
        // surfaces as a bare "fetch failed". A 16k-token budget on a busy card
        // routinely exceeds that. Streaming makes headers arrive immediately and
        // keeps data flowing, so there is nothing for the timeout to trip on.
        stream:   true,
        format:   'json',
        messages: [{ role: 'user', content: instructions }],
        options: {
          temperature: 0.9,
          // Ollama defaults num_ctx to 4096 — smaller than the screenplay alone.
          num_ctx:     32_768,
          // THE load-bearing setting. qwen3-vl always reasons: `think:false` is
          // silently ignored by Ollama 0.32.4 for this model, and the reasoning
          // is emitted into a separate `thinking` field BEFORE any content. On a
          // trivial prompt that field alone ran to 13k characters. With a small
          // budget the reply is cut mid-thought (`done_reason: "length"`) and
          // `content` comes back EMPTY — which is exactly how every early run of
          // this job failed. The budget has to cover the thinking AND the answer.
          num_predict: 16_384,
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`ollama ← HTTP ${res.status}: ${text.slice(0, 500)}`);
      throw new BadRequestException(`Ollama ${res.status}: ${text}`);
    }

    // Ollama streams NDJSON: one json object per line, each carrying a slice of
    // `content` and/or `thinking`, the last one carrying the totals.
    let content = '';
    let thinking = '';
    let done: { done_reason?: string; eval_count?: number; prompt_eval_count?: number } = {};
    let buffer = '';

    for await (const chunk of res.body as any) {
      buffer += Buffer.from(chunk).toString('utf-8');
      const lines = buffer.split('\n');
      // The tail may be a half-written line; keep it for the next chunk.
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        let piece: any;
        try { piece = JSON.parse(line); } catch { continue; }
        if (piece.error) throw new BadRequestException(`Ollama: ${piece.error}`);
        content  += piece.message?.content  ?? '';
        thinking += piece.message?.thinking ?? '';
        if (piece.done) done = piece;
      }
    }
    content = content.trim();
    const body = done;
    this.logger.log(
      `ollama ← done_reason=${body.done_reason} eval=${body.eval_count} prompt_eval=${body.prompt_eval_count} ` +
      `thinking=${thinking.length} chars content=${content.length} chars in ${Math.round((Date.now() - started) / 1000)}s`,
    );

    // The one failure worth naming explicitly: the budget ran out mid-thought,
    // so nothing was ever written to `content`.
    if (!content && body.done_reason === 'length') {
      this.logger.error(
        `ollama: hit the num_predict ceiling while still reasoning (${thinking.length} chars of thinking, ` +
        `no answer). Raise num_predict or shorten the prompt.`,
      );
    } else if (!content) {
      this.logger.error(`ollama: empty content, done_reason=${body.done_reason}, thinking starts: ${thinking.slice(0, 300)}`);
    }
    return content;
  }

  private async generateIdeas(projectId: string, count: number): Promise<ThumbnailIdea[]> {
    const project = await this.prisma.project.findFirst({
      where:   { id: projectId },
      include: {
        characterLinks: { include: { character: { include: { profiles: true } } } },
      },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    // Canon, the same sources the clickbait skill reads: the screenplay itself
    // plus the cast's visual identity (so the model can pick a real anchor).
    const cast = project.characterLinks
      .flatMap((l) => l.character.profiles)
      .map((p) => `${p.profileCode}: ${(p.promptBase ?? '').slice(0, 220)}`)
      .join('\n');
    const fullScript = project.scriptText ?? '';
    if (!fullScript.trim()) {
      throw new BadRequestException(`У проекта ${project.slug} пустой scriptText — модели не из чего придумывать`);
    }

    // The English short script (settings.scriptShort.en) is the canon of MEANING:
    // arc, finale, leitmotif, the real numbers. The verbatim finale rides along in
    // both branches — a cover concept is almost always about the reckoning.
    const shortScript = String((project.settings as any)?.scriptShort?.en ?? '').trim();
    const finale = fullScript.slice(-SCRIPT_TAIL);
    const brief = shortScript
      ? [`Story brief (canonical — trust it over your own reading of the screenplay):`, shortScript, ``]
      : [];

    /**
     * Send the WHOLE screenplay whenever it fits. It almost always does — the six
     * films that have covers run 5 200 to 10 000 characters, roughly 1 300 to
     * 2 500 tokens against a 32 768-token context. Truncating them bought nothing
     * and cost the feature its variety:
     *
     * car_flipper, 2026-08-10 — script 9 116 chars, brief present, so the old
     * code took the `brief + finale` branch and the model saw the brief plus the
     * LAST 6 000 characters only. The first three thousand — the teenage garage
     * years, the whole first half of the arc — were never shown. All six concepts
     * then came out of that one slice: "steam rises" in 6 of 6, "thirty payment
     * forms" in 5 of 6. The model was not repeating itself; it was describing the
     * only part of the film it had been given.
     */
    const WHOLE_SCRIPT_CAP = 24_000;
    const storySections = fullScript.length <= WHOLE_SCRIPT_CAP
      ? [...brief, `Screenplay, complete:`, fullScript]
      : [
          // Only for a genuinely long script. Take a middle slice too — the old
          // head+tail shape made the entire second and third acts invisible,
          // which is exactly where a cautionary tale keeps its best images.
          ...brief,
          `Screenplay opening:`,
          fullScript.slice(0, SCRIPT_HEAD),
          ``,
          `Screenplay middle, verbatim excerpt:`,
          fullScript.slice(
            Math.floor(fullScript.length / 2) - SCRIPT_HEAD / 2,
            Math.floor(fullScript.length / 2) + SCRIPT_HEAD / 2,
          ),
          ``,
          `Screenplay finale, verbatim excerpt:`,
          finale,
        ];

    const instructions = [
      `You design YouTube thumbnails for a Russian cautionary-tale film channel («И ЭТО ВСЯ ТВОЯ ЖИЗНЬ»).`,
      `Invent ${count} DISTINCT cover concepts for the film below.`,
      ``,
      `DIVERSITY IS THE POINT, and it is CHECKED mechanically after you answer: two concepts that share`,
      `an object, or repeat the same three-word phrase, are sent back for rework. Each concept MUST use a`,
      `DIFFERENT composition from this list; at most ONE concept in the whole set may be a face close-up.`,
      `Each concept also needs its OWN key object, its OWN time of day and its OWN pair of colours —`,
      `a set of six variations on one idea is a failed set, however good the idea is:`,
      `  - "split": two moments of the same person or place sharing one frame, and the contrast between`,
      `    them IS the story. For a person use two profile codes of the SAME character at different ages.`,
      `    Write it as ONE continuous image — "the boy at the workbench on one side, the same man thirty`,
      `    years older on the other". Never write the words "split frame", "left half" or "right side`,
      `    shows": those get drawn as a literal dividing line down the middle of the picture;`,
      `  - "object-hero": the story's key object huge and sharp in the foreground, the person small or out`,
      `    of focus behind it;`,
      `  - "scale": one tiny lone figure against an enormous environment that dwarfs it;`,
      `  - "confrontation": two people face each other, the tension readable in posture and distance;`,
      `  - "pov": over the hero's shoulder — we see what they see, and the thing they see is in focus;`,
      `  - "hands": no face in frame at all — hands doing or holding the decisive thing;`,
      `  - "face-plus": the classic big face in strong emotion. Allowed ONCE, and only with a second`,
      `    story-telling element sharing the frame — never the face alone.`,
      ``,
      `THE COVER MUST BE BEAUTIFUL, not merely shocking. A grim frame nobody wants to look at loses to a`,
      `gorgeous one. Every prompt must build the image out of these four craft elements — they are what`,
      `separates a still that looks composed by a cinematographer from a snapshot:`,
      `  1. DEPTH IN THREE LAYERS: something close to the lens (a shoulder, a railing, leaves, steam), the`,
      `     subject in the middle, and a background that recedes. A flat single-plane frame is the single`,
      `     most common reason a render looks cheap. Weave all three into ONE flowing sentence, the way a`,
      `     person describes a photograph out loud. Do NOT answer this rule as a form: labels like`,
      `     "Close layer:", "Middle ground:", "Foreground:" or "Background:" are a memo about the picture,`,
      `     and the model draws the memo — three unrelated sub-pictures with no subject.`,
      `  2. LIGHT YOU CAN SEE TRAVELLING: a rim or back light that separates the subject from the`,
      `     background, plus a visible source inside the frame when the scene allows one (a lamp, a`,
      `     headlight, a window, a screen).`,
      `  3. ATMOSPHERE THE LIGHT CATCHES: haze, dust motes, rain, steam, snow, smoke, breath in cold air.`,
      `     This is what turns a correct image into a beautiful one — never leave the air empty.`,
      `  4. CLEAN SHAPE READING: one dominant subject, generous negative space, the subject placed off`,
      `     centre. It is looked at two centimetres wide, so big simple silhouettes beat fine detail.`,
      ``,
      `Each concept needs:`,
      `- "idea": a short RUSSIAN label, 2-5 words.`,
      `- "composition": the pattern name from the list above ("split", "object-hero", …).`,
      `- "prompt": the art prompt in ENGLISH prose, 3-6 sentences, 40-90 words. Rules, all mandatory:`,
      `    * THE HOOK IS A CONTRADICTION: two elements in frame that clash and make the viewer ask "how`,
      `      did THIS lead to THAT?" — polished dress shoes on a muddy village road, a wedding photo on`,
      `      top of packed moving boxes. Emotion alone is not a hook.`,
      `    * every object and event must come from the story below — nothing invented;`,
      `    * name the light and the palette — and the palette must CARRY COLOUR. A cover competes in a`,
      `      grid of bright thumbnails, so name two or three saturated hues that fight each other (sodium`,
      `      orange against night blue, red against wet green). NEVER write "desaturated", "muted", "grey",`,
      `      "monochrome", "washed out", "drained" or "faded" — those words are an order, and they are why`,
      `      earlier covers came back flat and grey. Drama comes from the subject and the light, not from`,
      `      draining the colour out;`,
      `    * name a strong light DIRECTION and a source (low sun raking across, a single overhead bulb, a`,
      `      screen lighting the face from below) — flat even daylight is what makes a frame look dead;`,
      `    * the lower third of the frame must be a QUIET low-detail surface (floor, asphalt, shadow) — a caption is drawn there later;`,
      `    * a number from the story becomes a QUANTITY THE EYE GRASPS WITHOUT COUNTING — a thick fan of`,
      `      banknotes, a shelf packed end to end, an overflowing box, a wall of them. NEVER a specific`,
      `      count ("thirty folders", "68 exercise books"): nobody can count at thumbnail size, and a`,
      `      counted pile of documents comes back as garbled glyphs because the technical negative forbids`,
      `      the very lettering the papers invite. Same ban on written digits, tags, labels, signs,`,
      `      engraved dates, calendars and any paper with visible writing;`,
      `    * describe only what IS in the picture: never "no text", never "missing X", never "an empty`,
      `      chair where someone should be" — negations and absences cannot be drawn; name the visible`,
      `      thing instead;`,
      `    * no meta-language: never write "shock element", "concrete object" or "the composition shows" —`,
      `      write the finished frame itself.`,
      `NEVER write a profile code (SOLMOTHER_BASE, ANNOUNCER_OLD …) inside "prompt". Those belong only in`,
      `"refProfileCodes". In the prose call people by what they are — "the woman", "the older man", "the boy".`,
      `A code left in the prose gets DRAWN: one render came back with "SOLMOTHER" printed on a ticket.`,
      `This is the rule broken most often — 24 of the last 40 covers had a code left in the prose — so it is`,
      `now checked mechanically and a concept that still carries one is sent back.`,
      ``,
      `- "light": the light of this frame on its own, 4-10 words — source plus direction. Examples:`,
      `  "a single overhead bulb, hard shadows straight down", "low winter sun raking from frame left",`,
      `  "the screen lighting her face from below, everything behind it dark".`,
      `- "palette": 2-3 saturated hues that FIGHT each other, 4-10 words, e.g. "sodium orange against deep`,
      `  night blue, wet black asphalt". This field is mandatory and is appended to the end of the render`,
      `  instruction, which is the position the films' own shots put their palette in. Never desaturating`,
      `  words here either.`,
      `- "motif": the ONE object this concept is built on, 1-3 words in English ("the odometer", "the`,
      `  thermos"). Two concepts in the set may not share a motif — this is compared mechanically.`,
      `- "moment": which moment of the film this concept is taken from, 2-5 words in RUSSIAN («первая`,
      `  сделка в гараже», «ночь после суда»). SPREAD THE SET ACROSS THE WHOLE ARC — the beginning, the`,
      `  middle and the reckoning, not six angles on the finale. Two concepts may not share a moment, and`,
      `  this too is compared mechanically. You have the complete screenplay above; use its middle, not`,
      `  only its last page.`,
      ``,
      `A worked example, from a real failure. THIS was returned for a film about a car dealer, and every`,
      `line of it is wrong in a way that costs a render:`,
      `  BAD: "Split frame: left shows young Viktor (VIK_TEEN) holding an instrument cluster under garage`,
      `  light; steam rises from wet car beneath him. Right side shows older Viktor (VIK_OLD) washing a`,
      `  flooded vehicle at dawn with cracked wrist pouch on arm—stack of thirty payment forms rests near`,
      `  rubber boots. Orange-gold backlight separates both figures against grey sky and concrete floor."`,
      `  Why it fails: "Split frame:" and "left shows" draw a literal divider; the two codes get drawn as`,
      `  letters; "thirty payment forms" cannot be counted and invites glyphs; "grey sky" and "concrete`,
      `  floor" name the frame's dominant colour as grey in the closing clause, so the whole cover greys out.`,
      `  GOOD: "A boy of sixteen crouches over an opened instrument cluster on an oil-dark workbench, the`,
      `  same man forty years later stands beyond him hosing down a flooded sedan, both of them held by the`,
      `  hard amber beam of a work lamp that rakes across the wet floor and throws their shadows long into`,
      `  the blue dark of the yard behind."`,
      `  light: "one amber work lamp low at frame left, hard raking beam"`,
      `  palette: "amber work-lamp orange against cold cobalt night, oil-black reflections"`,
      `  motif: "the instrument cluster"`,
      ``,
      `Hard limits on content: this is a drama channel, not horror. Nothing bloody, gory, injured or dead —`,
      `no blood, no bloodstains, no wounds, no corpses. The dread comes from loss, silence and time passing,`,
      `and every object you put in frame must actually appear in the story below.`,
      ``,
      `- "negative": 3-6 EXTRA comma-separated things to keep OUT of this specific cover — the failure you`,
      `  expect from THIS composition, not generic quality words. A standard technical negative is always`,
      `  applied on top, so do not repeat "text, blurry, extra fingers". Write the wrong reading a diffusion`,
      `  model reaches for by default: "smiling, heroic pose, confident smirk" for a scene of ruin,`,
      `  "tidy showroom, polished floor" for a working garage, "crowd, other people" for a frame about being`,
      `  alone. It bites only on the "full" quality tier, which renders at cfg 3.0 — on the cheaper tiers`,
      `  the negative is inert, so never rely on it to fix a defect the positive can avoid.`,
      ``,
      `- "caption_lines": 1-2 ENGLISH lines in CAPITALS, 2-6 words per line. A working draft — the operator`,
      `  translates the chosen one into Russian before it is drawn on the cover. A concrete number or fact`,
      `  from the story plus a consequence or an open loop. Plain everyday words, no poetry, never repeat`,
      `  the video title. Good: «30 YEARS IN ONE BOOTH / NOBODY KNEW HER FACE», «THE LETTER CAME / 40 YEARS LATE».`,
      `- "accent_word": the ONE word from caption_lines to paint red — prefer the emotional verb over the number.`,
      `    * It must appear VERBATIM in caption_lines, otherwise there is nothing to colour.`,
      `- "refProfileCodes": WHICH people this particular concept needs, as an array of 0-3 profile codes copied EXACTLY from the cast list below.`,
      `    * Age matters and is your call: the same character has several profiles for different ages. Pick the one the`,
      `      MOMENT of this concept happens at — the arrival, the peak, or the reckoning. Do not default to one profile.`,
      `    * Use two codes when the concept genuinely shows two people, or the SAME character at two ages side by side.`,
      `    * Use an empty array when the cover is an object or a place with no face in it.`,
      `    * Order matters: the first code is the main face of the cover.`,
      `- "refReason": one short sentence, in Russian, on why those profiles and that age fit this concept.`,
      ``,
      `Cast (profile code: appearance):`,
      cast || '(none)',
      ``,
      ...storySections,
      ``,
      `Return JSON: {"ideas": [...]}. No preamble.`,
    ].join('\n');

    {
      // One call. An empty reply fails the job with a clear message and the
      // operator re-runs it from the UI — a silent auto-retry just burns the
      // 30B twice without telling anyone.
      const content = await this.askModel(instructions);
      if (!content) {
        throw new BadRequestException(`${IDEAS_MODEL} вернула пустой ответ — нажми «Предложить идеи» ещё раз`);
      }

      const parsed = JSON.parse(content) as { ideas?: any[] };
      const ideas  = (parsed.ideas ?? []).filter((i) => i?.prompt?.trim());
      if (ideas.length === 0) throw new BadRequestException('Модель вернула пустой список идей');

      this.logger.log(`Thumbnail ideas proposed: project=${project.slug} n=${ideas.length}`);
      // Only codes that actually exist in this project's cast survive — a model
      // hallucinating a profile would otherwise fail the render minutes later.
      const known = new Set(project.characterLinks.flatMap((l) => l.character.profiles).map((p) => p.profileCode));

      // The art prompt gets the same treatment the captions already had: a
      // mechanical gate, one repair round, then a loud drop. See
      // cover-prompt.gate.ts for why prose rules alone were not enough.
      const surviving = await this.gateCoverPrompts(ideas, project.slug);
      if (surviving.length === 0) {
        throw new BadRequestException(
          `${IDEAS_MODEL} не смогла выдать ни одного годного арт-промпта даже после доработки — нажми «Предложить идеи» ещё раз`,
        );
      }

      // Captions in two passes: the cheap mechanical gate per idea, then ONE
      // lexicon spawn over everything that survived it (the dictionary costs
      // ~4 s to load, so it must not run per idea).
      const captions = surviving.map((i) => this.acceptCaption(i, project.slug));
      const nonWords = await this.unknownRussianWords(
        captions.flatMap((c) => (c ? c.lines.flatMap(captionWords) : [])),
      );

      return surviving.map((i, n) => ({
        idea:   typeof i.idea === 'string' ? i.idea : undefined,
        prompt: String(i.prompt).trim(),
        refProfileCodes: (Array.isArray(i.refProfileCodes) ? i.refProfileCodes : [])
          .map(String).filter((c: string) => known.has(c)).slice(0, 3),
        // Per-idea negative, appended to the technical one at dispatch: the model
        // names the wrong reading THIS composition invites, which a single global
        // negative cannot know (a smile on a scene of ruin, a crowd in a frame
        // about being alone).
        negative: typeof i.negative === 'string' && i.negative.trim()
          ? `${THUMB_NEGATIVE}, ${i.negative.trim()}`
          : undefined,
        // The composition pattern rides in front of refReason so the operator
        // sees at a glance which slot of the diversity list each concept fills.
        refReason: [
          typeof i.composition === 'string' && i.composition.trim() ? `[${i.composition.trim()}]` : '',
          typeof i.refReason === 'string' ? i.refReason : '',
        ].filter(Boolean).join(' ') || undefined,
        // Carried through so the picker can pre-fill the caption form with the
        // model's own wording — but only if it survived both gates.
        captionSpec: this.dropIfNonWords(captions[n], nonWords, i, project.slug),
      }));
    }
  }

  /**
   * Art-prompt gate: sanitize → validate → ONE repair round → validate → drop.
   *
   * Why a repair round rather than a straight reject: a 30B call over the whole
   * screenplay costs minutes, and the defects measured on 2026-08-11 were almost
   * all WORDING (a code left in the prose, a layer label, "thirty forms") on top
   * of a concept that was fine. Throwing the batch away to re-roll the same
   * concepts differently-worded is the expensive way to fix a typo. The repair
   * call sees only the failing concepts and the exact violations, so it is small.
   *
   * What survives is returned with `prompt` already composed — prose + light +
   * palette, palette last. What does not survive is dropped and LOGGED with the
   * reason: a silently shortened set of ideas reads to the operator as "the model
   * only had four ideas", which is a different and misleading fact.
   */
  private async gateCoverPrompts(ideas: any[], slug: string): Promise<any[]> {
    const fields = (list: any[]): CoverPromptFields[] => list.map((i) => ({
      prompt:  String(i.prompt ?? ''),
      light:   typeof i.light === 'string' ? i.light : undefined,
      palette: typeof i.palette === 'string' ? i.palette : undefined,
      motif:   typeof i.motif === 'string' ? i.motif : undefined,
      moment:  typeof i.moment === 'string' ? i.moment : undefined,
    }));

    // Pass 1 — deterministic cleanup. Writes back onto the idea objects so the
    // repair call and the final compose both see the cleaned text.
    for (const idea of ideas) {
      const { prompt, fixes } = sanitizeCoverPrompt(String(idea.prompt ?? ''));
      idea.prompt = prompt;
      if (fixes.length) {
        this.logger.warn(`cover prompt «${idea.idea ?? '?'}» (${slug}): ${fixes.join('; ')}`);
      }
    }

    // Pass 2 — what cleanup must not guess at, per concept and across the batch.
    const problemsFor = (list: any[]): string[][] => {
      const f = fields(list);
      const own = f.map((x) => coverPromptProblems(x));
      const shared = batchDiversityProblems(f);
      return own.map((p, i) => [...p, ...shared[i]]);
    };

    let problems = problemsFor(ideas);
    const failing = ideas.filter((_, i) => problems[i].length > 0);

    if (failing.length) {
      this.logger.warn(
        `cover gate (${slug}): ${failing.length} of ${ideas.length} concepts need rework — `
        + ideas
            .map((idea, i) => (problems[i].length ? `«${idea.idea ?? '?'}»: ${problems[i].length}` : ''))
            .filter(Boolean)
            .join(', '),
      );
      const repaired = await this.repairCoverPrompts(ideas, problems, slug);
      if (repaired) {
        for (const [i, fix] of repaired) {
          if (typeof fix.prompt === 'string' && fix.prompt.trim()) {
            ideas[i].prompt = sanitizeCoverPrompt(fix.prompt).prompt;
          }
          if (typeof fix.light === 'string' && fix.light.trim())     ideas[i].light   = fix.light;
          if (typeof fix.palette === 'string' && fix.palette.trim()) ideas[i].palette = fix.palette;
          if (typeof fix.motif === 'string' && fix.motif.trim())     ideas[i].motif   = fix.motif;
          if (typeof fix.moment === 'string' && fix.moment.trim())   ideas[i].moment  = fix.moment;
        }
        problems = problemsFor(ideas);
      }
    }

    // Compose the survivors, drop the rest loudly.
    const out: any[] = [];
    ideas.forEach((idea, i) => {
      if (problems[i].length) {
        this.logger.error(
          `cover DROPPED «${idea.idea ?? '?'}» (${slug}): ${problems[i].join(' | ')}`,
        );
        return;
      }
      idea.prompt = composeCoverPrompt({
        prompt:  idea.prompt,
        light:   typeof idea.light === 'string' ? idea.light : undefined,
        palette: typeof idea.palette === 'string' ? idea.palette : undefined,
      });
      out.push(idea);
    });

    if (out.length < ideas.length) {
      this.logger.warn(`cover gate (${slug}): ${out.length} of ${ideas.length} concepts survived`);
    }
    return out;
  }

  /**
   * One repair call. Sends ONLY the failing concepts and their violations — no
   * screenplay, because the fix is wording, not content, and re-sending the
   * script would double the cost of the whole feature.
   *
   * @returns [index, patch] pairs, or null if the model gave nothing usable
   *          (in which case the caller drops the failures, which is the honest
   *          outcome rather than rendering them anyway).
   */
  private async repairCoverPrompts(
    ideas: any[],
    problems: string[][],
    slug: string,
  ): Promise<Array<[number, any]> | null> {
    const broken = ideas
      .map((idea, i) => ({ i, idea, problems: problems[i] }))
      .filter((x) => x.problems.length > 0);
    if (!broken.length) return null;

    const instructions = [
      `You are fixing YouTube cover art prompts that failed an automated check.`,
      `Keep each concept's IDEA exactly as it is — same people, same objects, same moment.`,
      `Change only the wording that the listed violations point at.`,
      ``,
      `Rules the check enforces:`,
      `- write the finished frame as flowing prose, never labels like "Split frame:", "Foreground:",`,
      `  "Background:", never "we see", never "left half";`,
      `- never a profile code (VIK_OLD, LIDA_MID …) in the prose — say "the older man", "the boy";`,
      `- name at least TWO saturated hues that fight each other; never "grey", "muted", "washed out",`,
      `  "faded", "dull", "desaturated" — those drain the render;`,
      `- name a light source AND its direction;`,
      `- no negations and no absences — only what IS in the frame;`,
      `- quantities the eye grasps without counting ("a thick fan of notes"), never "thirty folders",`,
      `  never written digits;`,
      `- nothing that carries text: no signs, labels, printed forms, calendars, plates;`,
      `- 35-95 words.`,
      ``,
      `Fix these:`,
      ...broken.flatMap((x) => [
        ``,
        `#${x.i} «${x.idea.idea ?? '?'}»`,
        `prompt: ${x.idea.prompt}`,
        `light: ${x.idea.light ?? '(missing)'}`,
        `palette: ${x.idea.palette ?? '(missing)'}`,
        `motif: ${x.idea.motif ?? '(missing)'}`,
        `moment: ${x.idea.moment ?? '(missing)'}`,
        `violations:`,
        ...x.problems.map((p) => `  - ${p}`),
      ]),
      ``,
      `Return JSON: {"fixes": [{"index": <the # above>, "prompt": "...", "light": "...", "palette": "...",`,
      `"motif": "...", "moment": "..."}]}. Every concept listed above must appear exactly once. No preamble.`,
    ].join('\n');

    const content = await this.askModel(instructions);
    if (!content) {
      this.logger.error(`cover repair (${slug}): модель вернула пустой ответ, дефектные концепты будут отброшены`);
      return null;
    }
    try {
      const parsed = JSON.parse(content) as { fixes?: any[] };
      const out: Array<[number, any]> = [];
      for (const fix of parsed.fixes ?? []) {
        const i = Number(fix?.index);
        if (!Number.isInteger(i) || i < 0 || i >= ideas.length) continue;
        out.push([i, fix]);
      }
      this.logger.log(`cover repair (${slug}): доработано ${out.length} из ${broken.length}`);
      return out.length ? out : null;
    } catch (e) {
      this.logger.error(`cover repair (${slug}): ответ не разобран как JSON — ${String(e).slice(0, 200)}`);
      return null;
    }
  }

  /**
   * Queue a fresh set of concepts. Additive by design — call it again to top the
   * pool up without disturbing what is already rendered or chosen.
   */
  async enqueueIdeas(idOrSlug: string, ideas: ThumbnailIdea[]): Promise<any[]> {
    if (!ideas?.length) throw new BadRequestException('No ideas supplied');

    const project = await this.findProject(idOrSlug);
    const created: any[] = [];

    for (const idea of ideas) {
      const prompt = (idea.prompt ?? '').trim();
      if (!prompt) throw new BadRequestException('An idea with an empty prompt was supplied');

      const job = await this.jobs.create({
        data: {
          projectId:      project.id,
          idea:           idea.idea?.trim() || null,
          prompt,
          negative:       idea.negative?.trim() || null,
          refProfileCodes: (idea.refProfileCodes ?? [])
            .map((c) => String(c).trim()).filter(Boolean).slice(0, 3),
          referenceLatents: idea.referenceLatents ?? null,
          captionSpec:      (idea.captionSpec ?? null) as any,
          batchSize:      Math.min(8, Math.max(1, idea.batchSize ?? DEFAULT_BATCH)),
          quality:        normalizeThumbQuality(idea.quality),
          status:         'pending',
        } as any,
      });
      await this.ledger.enqueue('thumbnail', job.id);
      created.push(job);
    }

    this.logger.log(`Thumbnail enqueue: project=${project.slug} ideas=${created.length}`);
    return created;
  }

  /** Everything on the table for this project, newest concept first. */
  async list(idOrSlug: string): Promise<any[]> {
    const project = await this.findProject(idOrSlug);
    return this.jobs.findMany({
      where:   { projectId: project.id },
      orderBy: { queuedAt: 'desc' },
    });
  }

  /** On-disk path of one candidate (or of the finished cover), for streaming to
   *  the picker. Filename is validated against the job's own candidate list, so
   *  the parameter can never walk out of the project's directory. */
  async candidatePath(jobId: string, filename: string): Promise<string> {
    const job = await this.jobs.findUnique({ where: { id: jobId }, include: { project: true } });
    if (!job) throw new NotFoundException(`Thumbnail job ${jobId} not found`);
    const candidates: string[] = Array.isArray(job.candidates) ? job.candidates : [];
    if (!candidates.includes(filename)) throw new NotFoundException(`No candidate ${filename} on this job`);
    const p = path.join(job.artPath ?? this.artDir(job.project.slug), filename);
    if (!existsSync(p)) throw new NotFoundException(`Candidate file missing on disk: ${p}`);
    return p;
  }

  /** The finished cover for a project, if one has been chosen and captioned. */
  async coverPath(idOrSlug: string): Promise<string> {
    const project = await this.findProject(idOrSlug);
    const chosen = await this.jobs.findFirst({
      where: { projectId: project.id, NOT: { chosenFilename: null } },
    });
    if (!chosen?.outputPath || !existsSync(chosen.outputPath)) {
      throw new NotFoundException(`No cover rendered yet for ${project.slug}`);
    }
    return chosen.outputPath;
  }

  /**
   * Render MORE frames for an idea that already ran, keeping everything it has
   * produced so far. The concept stays one card in the picker; the pool inside
   * it just grows.
   *
   * The row is re-queued rather than duplicated, so the ledger records this as
   * another attempt on the same unit of work.
   */
  async addMore(jobId: string, count = DEFAULT_BATCH, quality?: string): Promise<any> {
    const job = await this.jobs.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Thumbnail job ${jobId} not found`);
    if (ACTIVE_JOB_STATUSES.includes(job.status)) {
      throw new BadRequestException('Эта идея ещё рендерится — дождись, потом добавляй');
    }

    const updated = await this.jobs.update({
      where: { id: jobId },
      data: {
        status:        'pending',
        batchSize:     Math.min(8, Math.max(1, count)),
        // A top-up keeps the concept's tier unless the operator explicitly asks
        // for another one — the common case is "same look, more frames", and
        // silently re-rolling at a different tier would make the pool
        // incomparable with itself.
        ...(quality !== undefined ? { quality: normalizeThumbQuality(quality) } : {}),
        comfyPromptId: null,
        errorMessage:  null,
        startedAt:     null,
        completedAt:   null,
      },
    });
    await this.ledger.enqueue('thumbnail', jobId);
    this.logger.log(`Thumbnail top-up: job=${jobId} +${count}`);
    return updated;
  }

  /**
   * Throw away one candidate: the file leaves the disk and the job's list.
   *
   * Per the project's rework rule, a rejected artifact is deleted rather than
   * left lying around — a pool you are picking from must not accumulate frames
   * you already said no to.
   */
  async deleteCandidate(jobId: string, filename: string): Promise<any> {
    const job = await this.jobs.findUnique({ where: { id: jobId }, include: { project: true } });
    if (!job) throw new NotFoundException(`Thumbnail job ${jobId} not found`);

    const candidates: string[] = Array.isArray(job.candidates) ? job.candidates : [];
    if (!candidates.includes(filename)) {
      throw new BadRequestException(`${filename} is not a candidate of this job`);
    }

    const dir = job.artPath ?? this.artDir(job.project.slug);
    try { rmSync(path.join(dir, filename), { force: true }); }
    catch (e: any) { this.logger.warn(`could not delete ${filename}: ${e?.message ?? e}`); }

    // Deleting the frame that was the cover un-chooses it: the cover file on
    // disk no longer has a source candidate behind it.
    const wasChosen = job.chosenFilename === filename;
    const updated = await this.jobs.update({
      where: { id: jobId },
      data: {
        candidates:     candidates.filter((c) => c !== filename),
        chosenFilename: wasChosen ? null : job.chosenFilename,
        outputPath:     wasChosen ? null : job.outputPath,
      },
    });
    this.logger.log(`Thumbnail candidate deleted: job=${jobId} ${filename}${wasChosen ? ' (was the cover)' : ''}`);
    return updated;
  }

  /**
   * Delete a whole idea — the prompt and every frame it produced.
   *
   * The ledger entry is finalised rather than deleted: the queue keeps a
   * permanent record of the attempt even when its artifacts are gone.
   */
  async deleteJob(jobId: string): Promise<{ deleted: string; files: number }> {
    const job = await this.jobs.findUnique({ where: { id: jobId }, include: { project: true } });
    if (!job) throw new NotFoundException(`Thumbnail job ${jobId} not found`);

    const dir = job.artPath ?? this.artDir(job.project.slug);
    const candidates: string[] = Array.isArray(job.candidates) ? job.candidates : [];
    let files = 0;
    for (const filename of candidates) {
      try { rmSync(path.join(dir, filename), { force: true }); files++; }
      catch (e: any) { this.logger.warn(`could not delete ${filename}: ${e?.message ?? e}`); }
    }

    await this.ledger.finalizeForDeletion('thumbnail', jobId, 'thumbnail idea deleted by user');
    await this.jobs.delete({ where: { id: jobId } });
    this.logger.log(`Thumbnail idea deleted: job=${jobId} "${job.idea ?? '—'}" (${files} file(s))`);
    return { deleted: jobId, files };
  }

  async cancel(jobId: string): Promise<any> {
    const job = await this.jobs.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Thumbnail job ${jobId} not found`);
    if (['completed', 'failed', 'cancelled'].includes(job.status)) return job;
    await this.ledger.close('thumbnail', jobId, { status: 'cancelled', errorMessage: 'cancelled by user' });
    return this.jobs.update({
      where: { id: jobId },
      data:  { status: 'cancelled', completedAt: new Date(), errorMessage: 'cancelled by user' },
    });
  }

  /** Dispatch one pending idea to ComfyUI. */
  async dispatchPending(jobId: string): Promise<void> {
    const job = await this.jobs.findUnique({ where: { id: jobId }, include: { project: true } });
    if (!job || job.status !== 'pending') return;

    const project = job.project;
    const workflowFilename = 'scene_realcomic_qwen_api.json';
    const workflowPath = resolveWorkflowPath(project.slug, workflowFilename);
    if (!workflowPath) {
      await this.failJob(
        jobId,
        `Thumbnail workflow not found at ${describeWorkflowLookup(project.slug, workflowFilename)}`,
      );
      return;
    }

    // Identity references, in Picture-N order. Up to three — the graph wires
    // image1..image3 and ignores anything past that. Zero is legitimate: a cover
    // can be a pure object or landscape.
    const codes: string[] = (Array.isArray(job.refProfileCodes) ? job.refProfileCodes : []).slice(0, 3);
    const anchors: string[] = [];
    const participants: Array<{ displayName: string; characterPrompt: string }> = [];

    for (const code of codes) {
      const src = path.join(APP_ROOT, 'data', project.slug, 'reference', `${code}_anchor.png`);
      if (!existsSync(src)) {
        await this.failJob(jobId, `Anchor not found for ${code}: ${src}`);
        return;
      }
      const staged = `thumbref_${code}.png`;
      copyFileSync(src, path.join(COMFY_INPUT, staged));
      anchors.push(staged);

      // Rule 1: bind each picture to a name and state the identity once, or the
      // VL encoder sees faces with nothing tying them to the scene.
      //
      // The label is deliberately NEUTRAL. Feeding the profile code in made the
      // model DRAW it: a render came back with "SOLMOTHER" printed on a ticket
      // lying on the platform. Display names are no better here — they are
      // Russian descriptive phrases («Отец-эмигрант»), which the model would
      // render as Cyrillic lettering for the same reason.
      const profile = await this.prisma.characterProfile.findFirst({ where: { profileCode: code } });
      participants.push({
        displayName:     `Person ${participants.length + 1}`,
        characterPrompt: profile?.promptBase ?? '',
      });
    }

    // ── Where the STYLE comes from ─────────────────────────────────────────
    // Two mutually exclusive carriers, exactly as the dual-character overlay
    // solved it (qwen-dual-character-overlay.strategy.ts):
    //
    //   realcomic_qwen films → the project's own Qwen style LoRA.
    //   everything else      → the ANCHOR carries the style, and NO Qwen LoRA is
    //                          loaded at all. Their styleLora is a Flux one (it
    //                          belongs to the scene base) and would be garbage
    //                          in this chain; a RealComic default is worse than
    //                          garbage — it silently overrides the film's look.
    //
    // Carrying style from a picture REQUIRES the pixel channel: through the VL
    // encoder alone only "who this is" survives, never the linework or palette.
    const isQwenProject   = (project as any).visualStyle === 'realcomic_qwen';
    const carryAnchorStyle = !isQwenProject && anchors.length > 0;
    const projectLora = isQwenProject ? normalizeStyleLora((project as any).settings) : null;

    const instruction = composeQwenInstruction({
      participants,
      scenePrompt:    job.prompt,
      // REALCOMIC_COVER_STYLE, not the scenes' REALCOMIC_T2I_STYLE: the style
      // directive is composed LAST, and the t2i one ends on "muted cinematic
      // color palette" — a closing order to drain the colour out of the one
      // frame in the system that has to win a fight in a grid of bright
      // thumbnails. See the constant's comment for the measurement.
      styleDirective: carryAnchorStyle ? KEEP_REFERENCE_STYLE : REALCOMIC_COVER_STYLE,
      withReferences: anchors.length > 0,
      sceneBudget:    THUMB_SCENE_BUDGET,
    });

    const tier = THUMB_TIERS[normalizeThumbQuality((job as any).quality)];
    this.logger.log(
      `thumbnail ${job.id}: tier=${normalizeThumbQuality((job as any).quality)} `
      + `steps=${tier.steps} cfg=${tier.cfg} lightning=${tier.lightning} batch=${job.batchSize ?? 2}`,
    );

    const wf = new QwenSceneGraphBuilder().build(
      JSON.parse(readFileSync(workflowPath, 'utf-8')),
      {
        instruction,
        negative:  job.negative?.trim() || THUMB_NEGATIVE,
        width:     THUMB_WIDTH,
        height:    THUMB_HEIGHT,
        batchSize: job.batchSize ?? 2,
        seed:      Math.floor(Math.random() * 2 ** 31),
        steps:     tier.steps,
        cfg:       tier.cfg,
        scheduler: 'sgm_uniform',
        // The round number is in the prefix so a top-up cannot collide with the
        // frames already in the pool if ComfyUI's output dir was cleaned and its
        // per-prefix counter restarted from 00001.
        filenamePrefix: `thumb_${project.slug}_${job.id.slice(0, 8)}r${(Array.isArray(job.candidates) ? job.candidates.length : 0)}`,
        anchors,
        // Default ON, unlike the scenes: a cover is judged on whether it is
        // recognisably HER, and the VL channel alone only carries "a blonde
        // woman of about forty" — the first render came back with the wrong
        // hair colour and a generic face. Per-idea override for when the
        // anchor's studio backdrop starts bleeding into the composition.
        // Forced ON when the anchor is also the style carrier — that is the
        // channel the linework and palette travel through.
        referenceLatents: carryAnchorStyle ? true : (job.referenceLatents ?? true),
        lightning:        tier.lightning,
        // Omitted entirely when the anchor carries the style: any LoRA here
        // would overrule the very look we are copying.
        // Fallback strength 0.5, not 1.0: the scenes' A/B (2026-07-27) put full
        // strength at "flat, washed-out engraving, face more caricatured", and
        // 0.5 kept the ink line while leaving the light and depth alive. A cover
        // is judged on exactly that. Projects that tuned settings.styleLora
        // still win — this only replaces the blind default.
        styleLora: carryAnchorStyle ? undefined : {
          name:          projectLora?.name ?? 'style\\RealComic_2509_base.safetensors',
          strengthModel: projectLora?.strengthModel ?? 0.5,
        },
      } as any,
    ) as Record<string, any>;

    let promptId: string;
    try {
      ({ promptId } = await this.comfy.queuePrompt(wf));
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      const hint = (msg.includes('fetch failed') || msg.includes('ECONNREFUSED'))
        ? 'ComfyUI is not reachable on http://127.0.0.1:8188 — start it and retry. '
        : '';
      await this.failJob(jobId, hint + msg);
      return;
    }

    await this.jobs.update({
      where: { id: jobId },
      data:  { status: 'running', comfyPromptId: promptId, startedAt: new Date() },
    });
    await this.ledger.attachPrompt('thumbnail', jobId, promptId);
    this.logger.log(`Thumbnail dispatch: job=${jobId} idea=${job.idea ?? '—'} → promptId=${promptId}`);
  }

  /** Poll ComfyUI for running thumbnail renders; copy candidates in on success. */
  async pollRunning(): Promise<void> {
    const running = await this.jobs.findMany({ where: { status: 'running' }, include: { project: true } });
    for (const j of running) {
      if (!j.comfyPromptId) continue;
      const h = await this.comfy.getHistory(j.comfyPromptId).catch(() => null);
      if (!h || !h.status?.completed) continue;

      if (h.status.status_str !== 'success') {
        await this.failJob(j.id, `ComfyUI status: ${h.status.status_str}`);
        continue;
      }

      try {
        const outputs = h.outputs as Record<string, { images?: Array<{ filename: string }> }>;
        const imgs = (outputs?.['8']?.images ?? []).filter((im) => im?.filename);
        if (imgs.length === 0) {
          await this.failJob(j.id, 'ComfyUI marked success but produced no images');
          continue;
        }

        const dir = this.artDir(j.project.slug);
        mkdirSync(dir, { recursive: true });
        const fresh: string[] = [];
        for (const im of imgs) {
          const src = path.join(COMFY_OUTPUT, im.filename);
          if (!existsSync(src)) continue;
          copyFileSync(src, path.join(dir, im.filename));
          fresh.push(im.filename);
        }
        if (fresh.length === 0) {
          await this.failJob(j.id, `ComfyUI outputs not found under ${COMFY_OUTPUT}`);
          continue;
        }

        // APPEND, never replace: a top-up round (`addMore`) re-runs this same
        // row, and the frames the operator already has must survive it.
        const existing: string[] = Array.isArray(j.candidates) ? j.candidates : [];
        const candidates = [...existing, ...fresh.filter((f) => !existing.includes(f))];

        await this.jobs.update({
          where: { id: j.id },
          data:  { status: 'completed', artPath: dir, candidates, completedAt: new Date() },
        });
        await this.ledger.close('thumbnail', j.id, { status: 'completed', outputFilename: dir });
        this.logger.log(`Thumbnail completed: job=${j.id} → ${candidates.length} candidate(s)`);
      } catch (e: any) {
        await this.failJob(j.id, e?.message ?? String(e));
      }
    }
  }

  /**
   * Promote one candidate to "the cover" and draw the caption on it.
   *
   * Cheap and repeatable on purpose: no GPU is involved, so the operator can
   * reword the hook or move the accent word as many times as they like, and can
   * switch to a different candidate at any point.
   */
  async choose(jobId: string, filename: string, captionSpec?: unknown): Promise<any> {
    const job = await this.jobs.findUnique({ where: { id: jobId }, include: { project: true } });
    if (!job) throw new NotFoundException(`Thumbnail job ${jobId} not found`);

    const candidates: string[] = Array.isArray(job.candidates) ? job.candidates : [];
    if (!candidates.includes(filename)) {
      throw new BadRequestException(
        `${filename} is not a candidate of this job. Available: ${candidates.join(', ') || '—'}`,
      );
    }

    const spec = captionSpec ?? job.captionSpec;
    if (!spec) throw new BadRequestException('No caption spec — supply one or set it on the job first');

    const art = path.join(job.artPath ?? this.artDir(job.project.slug), filename);
    if (!existsSync(art)) throw new BadRequestException(`Candidate file is gone: ${art}`);

    const outDir = path.join(APP_ROOT, 'data', job.project.slug, 'thumbnail');
    mkdirSync(outDir, { recursive: true });
    const out = path.join(outDir, 'cover.png');

    const script = path.join(APP_ROOT, 'scripts', 'render_caption.py');
    let written = out;
    try {
      const { stdout } = await execFileAsync(CAPTION_PYTHON, [
        script, '--art', art, '--spec-json', JSON.stringify(spec), '--out', out,
      ]);
      // The script falls back to JPEG when PNG would breach YouTube's 2MB API
      // cap, so the path it reports is the authoritative one.
      const m = /saved:\s*(.+?)\s*\(/.exec(stdout);
      if (m) written = m[1];
    } catch (e: any) {
      throw new BadRequestException(`Caption overlay failed: ${e?.stderr || e?.message || e}`);
    }

    // Exactly one chosen cover per project.
    await this.jobs.updateMany({
      where: { projectId: job.projectId, NOT: { id: jobId } },
      data:  { chosenFilename: null },
    });
    const updated = await this.jobs.update({
      where: { id: jobId },
      data:  { chosenFilename: filename, captionSpec: spec as any, outputPath: written },
    });
    this.logger.log(`Thumbnail cover: project=${job.project.slug} ← ${filename} → ${written}`);
    return updated;
  }

  private async findProject(idOrSlug: string) {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!project) throw new NotFoundException(`Project ${idOrSlug} not found`);
    return project;
  }

  private async failJob(jobId: string, msg: string): Promise<void> {
    await this.jobs.update({
      where: { id: jobId },
      data:  { status: 'failed', errorMessage: msg, completedAt: new Date() },
    });
    await this.ledger.close('thumbnail', jobId, { status: 'failed', errorMessage: msg });
    this.logger.warn(`Thumbnail failed: job=${jobId} — ${msg}`);
  }
}
