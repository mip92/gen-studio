import type { Bot, Context } from 'grammy';
import { InlineKeyboard, InputFile } from 'grammy';
import { existsSync } from 'fs';
import * as path from 'path';
import {
  ActionItem,
  ShotFull,
  fetchActions,
  fetchShot,
  setChosenRender,
  setChosenVideo,
} from '../lib/actions-api';

const APP_ROOT = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..');

/**
 * Gates that benefit from phone-side action:
 *   5 (approve_render)  — pick a candidate image to canonicalize
 *   7 (approve_video)   — pick a candidate video to canonicalize
 * Other gates (upload images, start dataset/training, render, create video,
 * upscale) get one-tap action buttons but no media preview — they're
 * triggered remotely, results land in the queue.
 */
const APPROVE_GATES = new Set<ActionItem['gateKey']>(['approve_render', 'approve_video']);

// ── Callback-data scheme ────────────────────────────────────────────────────
//   "a:list"                  → re-render the actions list
//   "a:apr-img:<shotId>"      → open per-shot image approval (sends media group + pick buttons)
//   "a:apr-vid:<shotId>"      → open per-shot video approval
//   "a:p-img:<shotId>:<idx>"  → pick image #idx (1-based) as chosenRender
//   "a:p-vid:<shotId>:<idx>"  → pick video #idx as chosenVideoId
//   "a:skip:<shotId>"         → clear chosenRender (leave for re-render)
//   "a:run:<encodedAction>"   → fire-and-forget one of the gate's "action"
//                                blocks (POST /training/profiles/..., etc.).
//                                "encodedAction" is base64url of "<method>:<path>".
//
// UUID is 36 chars, so "a:p-img:<uuid>:<idx>" fits in <50 bytes < Telegram's 64-byte cap.

export function registerActionsHandlers(bot: Bot): void {
  bot.command('actions', async (ctx) => {
    await ctx.reply('🔄 Загружаю actions…');
    await sendActionsList(ctx);
  });

  bot.callbackQuery('a:list', async (ctx) => {
    if (!(await safeAnswer(ctx))) return;
    await sendActionsList(ctx, { edit: true });
  });

  bot.callbackQuery(/^a:apr-img:/, async (ctx) => {
    if (!(await safeAnswer(ctx))) return;
    const shotId = ctx.callbackQuery.data!.split(':')[2];
    await openImageApproval(ctx, shotId);
  });

  bot.callbackQuery(/^a:apr-vid:/, async (ctx) => {
    if (!(await safeAnswer(ctx))) return;
    const shotId = ctx.callbackQuery.data!.split(':')[2];
    await openVideoApproval(ctx, shotId);
  });

  bot.callbackQuery(/^a:p-img:/, async (ctx) => {
    const [, , shotId, idxStr] = ctx.callbackQuery.data!.split(':');
    const idx = Number(idxStr);
    try {
      const shot = await fetchShot(shotId);
      const renders = (shot.renderedImages ?? []) as Array<{ filename: string }>;
      const pick = renders[idx - 1];
      if (!pick) {
        await safeAnswer(ctx, { text: 'Кадр не найден' });
        return;
      }
      await setChosenRender(shotId, pick.filename);
      await safeAnswer(ctx, { text: `✓ ${shot.shotCode} — выбран #${idx}` });
      await ctx.reply(`✅ <b>${escapeHtml(shot.shotCode)}</b> — chosenRender = <code>${escapeHtml(pick.filename)}</code>`, {
        parse_mode: 'HTML',
      });
    } catch (err) {
      await safeAnswer(ctx, { text: 'Ошибка — см. чат' });
      await ctx.reply(`❌ <code>${escapeHtml(String(err).slice(0, 300))}</code>`, { parse_mode: 'HTML' });
    }
  });

  bot.callbackQuery(/^a:p-vid:/, async (ctx) => {
    const [, , shotId, idxStr] = ctx.callbackQuery.data!.split(':');
    const idx = Number(idxStr);
    try {
      const shot = await fetchShot(shotId);
      const videos = (shot.videoRenders ?? []).filter((v) => v.status === 'completed' && v.outputFilename);
      const pick = videos[idx - 1];
      if (!pick) {
        await safeAnswer(ctx, { text: 'Видео не найдено' });
        return;
      }
      await setChosenVideo(shotId, pick.id);
      await safeAnswer(ctx, { text: `✓ ${shot.shotCode} — выбрано видео #${idx}` });
      await ctx.reply(`✅ <b>${escapeHtml(shot.shotCode)}</b> — chosenVideo = <code>${escapeHtml(pick.id)}</code>`, {
        parse_mode: 'HTML',
      });
    } catch (err) {
      await safeAnswer(ctx, { text: 'Ошибка — см. чат' });
      await ctx.reply(`❌ <code>${escapeHtml(String(err).slice(0, 300))}</code>`, { parse_mode: 'HTML' });
    }
  });

  bot.callbackQuery(/^a:skip:/, async (ctx) => {
    const shotId = ctx.callbackQuery.data!.split(':')[2];
    try {
      await setChosenRender(shotId, null);
      await safeAnswer(ctx, { text: '✗ chosenRender сброшен' });
    } catch (err) {
      await safeAnswer(ctx, { text: 'Ошибка' });
      await ctx.reply(`❌ <code>${escapeHtml(String(err).slice(0, 300))}</code>`, { parse_mode: 'HTML' });
    }
  });
}

// ── Actions list ────────────────────────────────────────────────────────────

async function sendActionsList(ctx: Context, opts: { edit?: boolean } = {}): Promise<void> {
  try {
    const { items } = await fetchActions();
    if (items.length === 0) {
      const text = '<b>Actions</b>\n\n<i>(всё чисто — нет ожидающих gate'
                 + 'ов)</i>';
      if (opts.edit) await ctx.editMessageText(text, { parse_mode: 'HTML' });
      else           await ctx.reply(text,             { parse_mode: 'HTML' });
      return;
    }
    // Group by project for readability.
    const byProject = new Map<string, ActionItem[]>();
    for (const it of items) {
      const key = it.project.slug;
      if (!byProject.has(key)) byProject.set(key, []);
      byProject.get(key)!.push(it);
    }

    const lines: string[] = ['<b>Actions</b>'];
    const kb = new InlineKeyboard();
    let buttonCount = 0;
    const MAX_BUTTONS = 24; // ~6 rows × 4. Telegram caps cards at ~100 buttons but readability is the limit.

    for (const [slug, group] of byProject) {
      lines.push(`\n<b>· ${escapeHtml(slug)}</b> — ${group.length} pending`);
      for (const it of group.slice(0, 12)) {
        const tag    = gateTag(it.gateKey);
        const target = it.shot?.code ?? it.character?.code ?? it.profile?.code ?? '?';
        lines.push(`  ${tag} ${escapeHtml(target)}`);

        if (APPROVE_GATES.has(it.gateKey) && it.shot && buttonCount < MAX_BUTTONS) {
          const cb = it.gateKey === 'approve_render'
            ? `a:apr-img:${it.shot.id}`
            : `a:apr-vid:${it.shot.id}`;
          const label = `${tag} ${target}`.slice(0, 30);
          kb.text(label, cb).row();
          buttonCount++;
        }
      }
    }
    kb.text('🔄 Refresh', 'a:list');

    const text = lines.join('\n');
    if (opts.edit) await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
    else           await ctx.reply(text,             { parse_mode: 'HTML', reply_markup: kb });
  } catch (err) {
    await ctx.reply(`❌ <code>${escapeHtml(String(err).slice(0, 300))}</code>`, { parse_mode: 'HTML' });
  }
}

function gateTag(g: ActionItem['gateKey']): string {
  switch (g) {
    case 'upload_dataset_images': return '📤';
    case 'start_dataset':         return '🎲';
    case 'start_training':        return '🧠';
    case 'render_scene':          return '🎨';
    case 'approve_render':        return '🖼';
    case 'create_video':          return '🎬';
    case 'approve_video':         return '✅';
    case 'upscale_video':         return '⬆️';
  }
}

// ── Image approval ──────────────────────────────────────────────────────────

async function openImageApproval(ctx: Context, shotId: string): Promise<void> {
  let shot: ShotFull;
  try {
    shot = await fetchShot(shotId);
  } catch (err) {
    await ctx.reply(`❌ <code>${escapeHtml(String(err).slice(0, 300))}</code>`, { parse_mode: 'HTML' });
    return;
  }
  const renders = (shot.renderedImages ?? []);
  if (renders.length === 0) {
    await ctx.reply(`У <b>${escapeHtml(shot.shotCode)}</b> нет кадров на выбор.`, { parse_mode: 'HTML' });
    return;
  }
  if (!shot.project) {
    await ctx.reply('Не удалось определить project для шота — нечего слать.');
    return;
  }

  // Build media group from disk. Each entry must be an InputFile (we read the
  // file from data/<slug>/shots/<shotCode>/<filename>). Telegram limits a
  // media group to 10 items — slice if more.
  const slice = renders.slice(0, 10);
  const media = slice.map((r, i) => ({
    type:    'photo' as const,
    media:   resolveRenderInput(shot.project!.slug, shot.shotCode, r.filename),
    caption: i === 0 ? `<b>${escapeHtml(shot.shotCode)}</b> — выбери # ниже` : undefined,
    parse_mode: 'HTML' as const,
  })).filter((m) => m.media !== null) as Array<{ type: 'photo'; media: InputFile; caption?: string; parse_mode?: 'HTML' }>;

  if (media.length === 0) {
    await ctx.reply(`Файлы кадров не найдены на диске для <b>${escapeHtml(shot.shotCode)}</b>.`, { parse_mode: 'HTML' });
    return;
  }

  try {
    await ctx.replyWithMediaGroup(media);
  } catch (err) {
    await ctx.reply(`❌ MediaGroup failed: <code>${escapeHtml(String(err).slice(0, 300))}</code>`, { parse_mode: 'HTML' });
    return;
  }

  // Buttons: pick #1..N + skip.
  const kb = new InlineKeyboard();
  slice.forEach((_, i) => {
    const idx = i + 1;
    kb.text(`#${idx}`, `a:p-img:${shotId}:${idx}`);
    if ((i + 1) % 5 === 0) kb.row();
  });
  if (slice.length % 5 !== 0) kb.row();
  kb.text('✗ Сброс chosenRender', `a:skip:${shotId}`);

  const chosen = shot.chosenRender
    ? `текущий выбор: <code>${escapeHtml(shot.chosenRender)}</code>`
    : '<i>chosenRender не задан</i>';
  await ctx.reply(`<b>${escapeHtml(shot.shotCode)}</b> — ${chosen}\nТапни номер чтобы утвердить:`, {
    parse_mode: 'HTML',
    reply_markup: kb,
  });
}

// ── Video approval ──────────────────────────────────────────────────────────

async function openVideoApproval(ctx: Context, shotId: string): Promise<void> {
  let shot: ShotFull;
  try {
    shot = await fetchShot(shotId);
  } catch (err) {
    await ctx.reply(`❌ <code>${escapeHtml(String(err).slice(0, 300))}</code>`, { parse_mode: 'HTML' });
    return;
  }
  const videos = (shot.videoRenders ?? []).filter((v) => v.status === 'completed' && v.outputFilename);
  if (videos.length === 0) {
    await ctx.reply(`У <b>${escapeHtml(shot.shotCode)}</b> нет завершённых видео.`, { parse_mode: 'HTML' });
    return;
  }
  if (!shot.project) {
    await ctx.reply('Не удалось определить project для шота.');
    return;
  }

  // Telegram bot upload cap is 50 MB per file. Wan2.2 5-sec 832×480 mp4s are
  // typically 1-3 MB so we're fine. We send each video as its own message
  // (sendMediaGroup with video supports up to 10 but mixing video+text in a
  // group is awkward) and a separate buttons message at the end.
  const slice = videos.slice(0, 5);
  for (let i = 0; i < slice.length; i++) {
    const v = slice[i];
    const filePath = path.join(APP_ROOT, 'data', shot.project!.slug, 'shots', shot.shotCode, 'videos', v.outputFilename!);
    if (!existsSync(filePath)) {
      await ctx.reply(`#${i + 1}: файл не найден — <code>${escapeHtml(filePath)}</code>`, { parse_mode: 'HTML' });
      continue;
    }
    try {
      await ctx.replyWithVideo(new InputFile(filePath), {
        caption: `<b>${escapeHtml(shot.shotCode)}</b> · видео #${i + 1}`,
        parse_mode: 'HTML',
      });
    } catch (err) {
      await ctx.reply(`#${i + 1}: send failed — <code>${escapeHtml(String(err).slice(0, 200))}</code>`, { parse_mode: 'HTML' });
    }
  }

  const kb = new InlineKeyboard();
  slice.forEach((_, i) => {
    kb.text(`#${i + 1}`, `a:p-vid:${shotId}:${i + 1}`);
    if ((i + 1) % 5 === 0) kb.row();
  });
  await ctx.reply(`<b>${escapeHtml(shot.shotCode)}</b> — тапни номер чтобы утвердить:`, {
    parse_mode: 'HTML',
    reply_markup: kb,
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function resolveRenderInput(slug: string, shotCode: string, filename: string): InputFile | null {
  // Image lives at data/<slug>/shots/<shotCode>/<filename>. If absent, try
  // COMFY_OUTPUT (in-flight or legacy).
  const inShot   = path.join(APP_ROOT, 'data', slug, 'shots', shotCode, filename);
  if (existsSync(inShot)) return new InputFile(inShot);
  const comfyOut = process.env.COMFY_OUTPUT ?? 'E:\\ComfyUI\\output';
  const inOutput = path.join(comfyOut, filename);
  if (existsSync(inOutput)) return new InputFile(inOutput);
  return null;
}

async function safeAnswer(ctx: Context, payload?: { text: string }): Promise<boolean> {
  try {
    await ctx.answerCallbackQuery(payload);
    return true;
  } catch (e: any) {
    const desc = String(e?.description ?? e?.message ?? e);
    if (desc.includes('query is too old') || desc.includes('QUERY_ID_INVALID')) return false;
    console.error('[bot] answerCallbackQuery failed:', e);
    return false;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
