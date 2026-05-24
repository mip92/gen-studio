import type { Bot, Context } from 'grammy';
import { InlineKeyboard, InputFile, InputMediaPhoto } from 'grammy';
import { existsSync } from 'fs';
import * as path from 'path';
import {
  ActionItem,
  ShotFull,
  GateKey,
  fetchActions,
  fetchShotWithVideos,
  setChosenRender,
  setChosenVideo,
  deleteRender,
  deleteVideo,
  startUpscale,
  enqueueSceneRender,
  startVideoRender,
} from '../lib/actions-api';

const APP_ROOT    = process.env.APP_ROOT    ?? path.resolve(__dirname, '..', '..');
const COMFY_OUTPUT = process.env.COMFY_OUTPUT ?? 'E:\\ComfyUI\\output';

// ── Callback-data scheme (each callback ≤ 64 bytes per Telegram limit) ─────
//   "a:list"                       — re-render the actions list
//   "a:open:<shotId>"              — open the shot's "what's here" view
//   "a:p-img:<shotId>:<idx>"       — approve image #idx (1-based)
//   "a:d-img:<shotId>:<idx>"       — delete image #idx from disk + DB
//   "a:p-vid:<shotId>:<idx>"       — approve video #idx
//   "a:d-vid:<shotId>:<idx>"       — delete video #idx
//   "a:u-vid:<shotId>:<idx>"       — start FHD upscale on video #idx
//   "a:r-scn:<shotId>"             — enqueue a fresh scene render
//   "a:r-vid:<shotId>"             — start a video render (from chosenRender)
//   "a:s-img:<shotId>"             — clear chosenRender
//
// UUID is 36 chars → "a:p-img:<uuid>:<idx>" = ~48 bytes. Fits.

export function registerActionsHandlers(bot: Bot): void {
  bot.command('actions', async (ctx) => {
    await sendActionsList(ctx);
  });

  bot.callbackQuery('a:list', async (ctx) => {
    if (!(await safeAnswer(ctx))) return;
    await sendActionsList(ctx, { edit: true });
  });

  bot.callbackQuery(/^a:open:/, async (ctx) => {
    if (!(await safeAnswer(ctx))) return;
    const shotId = ctx.callbackQuery.data!.split(':')[2];
    await openShotView(ctx, shotId);
  });

  bot.callbackQuery(/^a:p-img:/, async (ctx) => {
    const [, , shotId, idxStr] = ctx.callbackQuery.data!.split(':');
    await withShotIdx(ctx, shotId, Number(idxStr), 'img', async (shot, item) => {
      const r = item as { filename: string };
      await setChosenRender(shotId, r.filename);
      await safeAnswer(ctx, { text: `✓ ${shot.shotCode} → #${idxStr}` });
      // Right after approval, surface the obvious next step: i2v render
      // from this image. Avoids forcing the user to scroll back to the
      // shot card for the «🎬 Сделать видео» button.
      const kb = new InlineKeyboard()
        .text('🎬 Сделать видео из этого кадра', `a:r-vid:${shotId}`).row()
        .text('🔄 Открыть шот', `a:open:${shotId}`);
      await ctx.reply(
        `✅ <b>${escapeHtml(shot.shotCode)}</b>\n` +
        `chosenRender = <code>${escapeHtml(r.filename)}</code>`,
        { parse_mode: 'HTML', reply_markup: kb },
      );
    });
  });

  bot.callbackQuery(/^a:d-img:/, async (ctx) => {
    const [, , shotId, idxStr] = ctx.callbackQuery.data!.split(':');
    await withShotIdx(ctx, shotId, Number(idxStr), 'img', async (shot, item) => {
      const r = item as { filename: string };
      await deleteRender(shotId, r.filename);
      await safeAnswer(ctx, { text: `🗑 удалено #${idxStr}` });
      await ctx.reply(`🗑 <b>${escapeHtml(shot.shotCode)}</b> — удалён <code>${escapeHtml(r.filename)}</code>`, { parse_mode: 'HTML' });
    });
  });

  bot.callbackQuery(/^a:p-vid:/, async (ctx) => {
    const [, , shotId, idxStr] = ctx.callbackQuery.data!.split(':');
    await withShotIdx(ctx, shotId, Number(idxStr), 'vid', async (shot, item) => {
      const v = item as { id: string };
      await setChosenVideo(shotId, v.id);
      await safeAnswer(ctx, { text: `✓ ${shot.shotCode} video #${idxStr}` });
      await ctx.reply(`✅ <b>${escapeHtml(shot.shotCode)}</b>\nchosenVideo = <code>${escapeHtml(v.id)}</code>`, { parse_mode: 'HTML' });
    });
  });

  bot.callbackQuery(/^a:d-vid:/, async (ctx) => {
    const [, , shotId, idxStr] = ctx.callbackQuery.data!.split(':');
    await withShotIdx(ctx, shotId, Number(idxStr), 'vid', async (shot, item) => {
      const v = item as { id: string };
      await deleteVideo(v.id);
      await safeAnswer(ctx, { text: `🗑 видео #${idxStr} удалено` });
      await ctx.reply(`🗑 <b>${escapeHtml(shot.shotCode)}</b> — удалено видео`, { parse_mode: 'HTML' });
    });
  });

  bot.callbackQuery(/^a:u-vid:/, async (ctx) => {
    const [, , shotId, idxStr] = ctx.callbackQuery.data!.split(':');
    await withShotIdx(ctx, shotId, Number(idxStr), 'vid', async (shot, item) => {
      const v = item as { id: string };
      await startUpscale(v.id);
      await safeAnswer(ctx, { text: `⬆️ upscale поставлен` });
      await ctx.reply(`⬆️ <b>${escapeHtml(shot.shotCode)}</b> — FHD-upscale в очереди`, { parse_mode: 'HTML' });
    });
  });

  bot.callbackQuery(/^a:r-scn:/, async (ctx) => {
    const shotId = ctx.callbackQuery.data!.split(':')[2];
    try {
      await enqueueSceneRender(shotId);
      await safeAnswer(ctx, { text: '🎨 render в очереди' });
      await ctx.reply(`🎨 Сцена для шота добавлена в очередь.`, { parse_mode: 'HTML' });
    } catch (err) {
      await safeAnswer(ctx, { text: 'Ошибка' });
      await ctx.reply(`❌ <code>${escapeHtml(String(err).slice(0, 300))}</code>`, { parse_mode: 'HTML' });
    }
  });

  bot.callbackQuery(/^a:r-vid:/, async (ctx) => {
    const shotId = ctx.callbackQuery.data!.split(':')[2];
    try {
      await startVideoRender(shotId);
      await safeAnswer(ctx, { text: '🎬 video в очереди' });
      await ctx.reply(`🎬 Видео для шота добавлено в очередь.`, { parse_mode: 'HTML' });
    } catch (err) {
      await safeAnswer(ctx, { text: 'Ошибка' });
      await ctx.reply(`❌ <code>${escapeHtml(String(err).slice(0, 300))}</code>`, { parse_mode: 'HTML' });
    }
  });

  bot.callbackQuery(/^a:s-img:/, async (ctx) => {
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
      const text = '<b>Actions</b>\n\n<i>(всё чисто — нет ожидающих gate-ов)</i>';
      if (opts.edit) await ctx.editMessageText(text, { parse_mode: 'HTML' });
      else           await ctx.reply(text,             { parse_mode: 'HTML' });
      return;
    }
    const byProject = new Map<string, ActionItem[]>();
    for (const it of items) {
      const k = it.project.slug;
      if (!byProject.has(k)) byProject.set(k, []);
      byProject.get(k)!.push(it);
    }

    const lines: string[] = ['<b>Actions</b>'];
    const kb = new InlineKeyboard();
    let buttonsAdded = 0;
    const MAX_BUTTONS = 30;

    for (const [slug, group] of byProject) {
      lines.push(`\n<b>· ${escapeHtml(slug)}</b> — ${group.length} pending`);
      for (const it of group.slice(0, 14)) {
        const tag    = gateTag(it.gateKey);
        const target = it.shot?.code ?? it.character?.code ?? it.profile?.code ?? '?';
        lines.push(`  ${tag} ${escapeHtml(target)} — ${gateLabel(it.gateKey)}`);

        // Only shot-anchored items get an "Открыть" button; character-level
        // (upload images / start dataset / start training) don't have a
        // shot to open. They get triggered via the action.path the API
        // already provides — we expose them as ▶ buttons too where useful.
        if (it.shot && buttonsAdded < MAX_BUTTONS) {
          kb.text(`${tag} ${target}`.slice(0, 30), `a:open:${it.shot.id}`).row();
          buttonsAdded++;
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

function gateTag(g: GateKey): string {
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
function gateLabel(g: GateKey): string {
  switch (g) {
    case 'upload_dataset_images': return 'нужны reference photo';
    case 'start_dataset':         return 'нужен датасет';
    case 'start_training':        return 'нужна LoRA';
    case 'render_scene':          return 'нужен рендер';
    case 'approve_render':        return 'выбрать кадр';
    case 'create_video':          return 'нужно видео';
    case 'approve_video':         return 'выбрать видео';
    case 'upscale_video':         return 'нужен FHD-upscale';
  }
}

// ── Open shot view ──────────────────────────────────────────────────────────

async function openShotView(ctx: Context, shotId: string): Promise<void> {
  let shot: ShotFull;
  try {
    shot = await fetchShotWithVideos(shotId);
  } catch (err) {
    await ctx.reply(`❌ <code>${escapeHtml(String(err).slice(0, 300))}</code>`, { parse_mode: 'HTML' });
    return;
  }

  const renders = (shot.renderedImages ?? []);
  const videos  = (shot.videoRenders   ?? []).filter((v) => v.status === 'completed' && v.outputFilename);

  // Header card — context for the user before they see media.
  const headerLines: string[] = [
    `<b>${escapeHtml(shot.shotCode)}</b>`,
  ];
  const sn = (shot as any).narrationText as string | null | undefined;
  if (sn && sn.trim().length) {
    headerLines.push(`<i>«${escapeHtml(sn.trim().slice(0, 200))}»</i>`);
  }
  headerLines.push(
    `\n🖼 кадров: ${renders.length}${shot.chosenRender ? ` (✓ выбран)` : ''}`,
    `🎬 видео: ${videos.length}${shot.chosenVideoId ? ` (✓ выбрано)` : ''}`,
  );
  await ctx.reply(headerLines.join('\n'), { parse_mode: 'HTML' });

  // ── Images ────────────────────────────────────────────────────────────────
  if (renders.length > 0 && shot.project) {
    const slice = renders.slice(0, 10);
    const media: InputMediaPhoto[] = [];
    slice.forEach((r, i) => {
      const file = resolveRenderInput(shot.project!.slug, shot.shotCode, r.filename);
      if (!file) return;
      const isChosen = shot.chosenRender === r.filename;
      media.push({
        type:    'photo',
        media:   file,
        caption: `#${i + 1}${isChosen ? '  ✓ chosen' : ''}`,
      });
    });
    if (media.length > 0) {
      try { await ctx.replyWithMediaGroup(media); }
      catch (err) {
        await ctx.reply(`MediaGroup fail: <code>${escapeHtml(String(err).slice(0, 200))}</code>`, { parse_mode: 'HTML' });
      }
    }

    // Per-image action buttons. Prefix every label with 🖼 so the user can't
    // confuse them with the video buttons that come next (both used to read
    // "✅ #1" identically — a real source of mis-approvals).
    const kb = new InlineKeyboard();
    slice.forEach((_, i) => {
      kb.text(`🖼 ✅ #${i + 1}`, `a:p-img:${shotId}:${i + 1}`)
        .text(`🖼 🗑 #${i + 1}`, `a:d-img:${shotId}:${i + 1}`)
        .row();
    });
    if (shot.chosenRender) kb.text('🖼 ✗ Сброс chosenRender', `a:s-img:${shotId}`).row();
    kb.text('🎨 Дорендерить ещё', `a:r-scn:${shotId}`);

    await ctx.reply(`<b>🖼 Картинки</b> — выбери / удали / дорендер:`, {
      parse_mode: 'HTML', reply_markup: kb,
    });
  } else {
    const kb = new InlineKeyboard().text('🎨 Запустить рендер сцены', `a:r-scn:${shotId}`);
    await ctx.reply(`<i>Картинок нет.</i>`, { parse_mode: 'HTML', reply_markup: kb });
  }

  // ── Videos ────────────────────────────────────────────────────────────────
  if (videos.length > 0 && shot.project) {
    const slice = videos.slice(0, 5);
    for (let i = 0; i < slice.length; i++) {
      const v = slice[i];
      const filePath = path.join(APP_ROOT, 'data', shot.project!.slug, 'shots', shot.shotCode, 'videos', v.outputFilename!);
      if (!existsSync(filePath)) {
        await ctx.reply(`#${i + 1}: файл не найден — <code>${escapeHtml(filePath)}</code>`, { parse_mode: 'HTML' });
        continue;
      }
      const isChosen = shot.chosenVideoId === v.id;
      const upscaled = v.upscaleStatus === 'completed';
      const caption  = `#${i + 1}${isChosen ? '  ✓ chosen' : ''}${upscaled ? '  · FHD ✓' : ''}`;
      try {
        await ctx.replyWithVideo(new InputFile(filePath), { caption, parse_mode: 'HTML' });
      } catch (err) {
        await ctx.reply(`#${i + 1}: send failed — <code>${escapeHtml(String(err).slice(0, 200))}</code>`, { parse_mode: 'HTML' });
      }
    }

    const kb = new InlineKeyboard();
    slice.forEach((v, i) => {
      kb.text(`🎬 ✅ #${i + 1}`, `a:p-vid:${shotId}:${i + 1}`)
        .text(`🎬 🗑 #${i + 1}`, `a:d-vid:${shotId}:${i + 1}`);
      if (v.upscaleStatus !== 'completed' && v.upscaleStatus !== 'running' && v.upscaleStatus !== 'pending') {
        kb.text(`🎬 ⬆️ #${i + 1}`, `a:u-vid:${shotId}:${i + 1}`);
      }
      kb.row();
    });
    kb.text('🎬 Сделать ещё видео', `a:r-vid:${shotId}`);
    await ctx.reply(`<b>🎬 Видео</b> — выбери / удали / FHD / дорендер:`, {
      parse_mode: 'HTML', reply_markup: kb,
    });
  } else if (shot.chosenRender) {
    const kb = new InlineKeyboard().text('🎬 Запустить видео', `a:r-vid:${shotId}`);
    await ctx.reply(`<i>Видео нет.</i> chosenRender есть — можно делать i2v.`, { parse_mode: 'HTML', reply_markup: kb });
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function withShotIdx(
  ctx: Context,
  shotId: string,
  idx: number,
  kind: 'img' | 'vid',
  fn: (shot: ShotFull, item: unknown) => Promise<void>,
): Promise<void> {
  try {
    const shot = await fetchShotWithVideos(shotId);
    const list = kind === 'img'
      ? (shot.renderedImages ?? [])
      : (shot.videoRenders ?? []).filter((v) => v.status === 'completed' && v.outputFilename);
    const item = list[idx - 1];
    if (!item) {
      await safeAnswer(ctx, { text: 'Не найдено' });
      return;
    }
    await fn(shot, item);
  } catch (err) {
    await safeAnswer(ctx, { text: 'Ошибка' });
    await ctx.reply(`❌ <code>${escapeHtml(String(err).slice(0, 300))}</code>`, { parse_mode: 'HTML' });
  }
}

function resolveRenderInput(slug: string, shotCode: string, filename: string): InputFile | null {
  const inShot   = path.join(APP_ROOT, 'data', slug, 'shots', shotCode, filename);
  if (existsSync(inShot)) return new InputFile(inShot);
  const inOutput = path.join(COMFY_OUTPUT, filename);
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
