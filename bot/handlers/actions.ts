import type { Bot, Context } from 'grammy';
import { InlineKeyboard, InputFile } from 'grammy';
import type { InputMediaPhoto } from 'grammy/types';
import { existsSync } from 'fs';
import * as path from 'path';
import {
  ActionItem,
  ShotFull,
  GateKey,
  TtsJobRow,
  BgmSegmentFull,
  fetchActions,
  fetchShotWithVideos,
  setChosenRender,
  setChosenVideo,
  deleteRender,
  deleteVideo,
  startUpscale,
  enqueueSceneRender,
  startVideoRender,
  queueShotTTS,
  approveTTSJob,
  deleteTTSJob,
  clearShotTTSApproval,
  fetchSegment,
  approveBgmJob,
  deleteBgmJob,
  clearBgmApproval,
} from '../lib/actions-api';

const APP_ROOT    = process.env.APP_ROOT    ?? path.resolve(__dirname, '..', '..');
const COMFY_OUTPUT = process.env.COMFY_OUTPUT ?? 'E:\\ComfyUI\\output';

// ── Callback-data scheme (each callback ≤ 64 bytes per Telegram limit) ─────
//   "a:list"                       — re-render the actions list
//   "a:open:<shotId>"              — open the shot's "what's here" view
//   "a:open-seg:<segmentId>"       — open the BGM segment's "what's here" view
//   "a:p-img:<shotId>:<idx>"       — approve image #idx (1-based)
//   "a:d-img:<shotId>:<idx>"       — delete image #idx from disk + DB
//   "a:p-vid:<shotId>:<idx>"       — approve video #idx
//   "a:d-vid:<shotId>:<idx>"       — delete video #idx
//   "a:u-vid:<shotId>:<idx>"       — start FHD upscale on video #idx
//   "a:r-scn:<shotId>"             — enqueue a fresh scene render
//   "a:r-vid:<shotId>"             — start a video render (from chosenRender)
//   "a:s-img:<shotId>"             — clear chosenRender
//   "a:p-tts:<shotId>:<idx>"       — approve shot-TTS job #idx (completed only)
//   "a:d-tts:<shotId>:<idx>"       — delete shot-TTS job #idx
//   "a:s-tts:<shotId>"             — clear shot.approvedTTSJobId
//   "a:p-bgm:<segmentId>:<idx>"    — approve BGM job #idx for the segment
//   "a:d-bgm:<segmentId>:<idx>"    — delete BGM job #idx
//   "a:s-bgm:<segmentId>"          — clear segment.approvedJobId
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

  bot.callbackQuery(/^a:r-tts:/, async (ctx) => {
    const shotId = ctx.callbackQuery.data!.split(':')[2];
    try {
      await queueShotTTS(shotId);
      await safeAnswer(ctx, { text: '🎙 TTS в очереди' });
      await ctx.reply(`🎙 Озвучка для шота добавлена в очередь.`, { parse_mode: 'HTML' });
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

  // ── TTS approve / delete / clear ────────────────────────────────────────

  bot.callbackQuery(/^a:p-tts:/, async (ctx) => {
    const [, , shotId, idxStr] = ctx.callbackQuery.data!.split(':');
    await withShotTts(ctx, shotId, Number(idxStr), async (shot, job) => {
      await approveTTSJob(job.id);
      await safeAnswer(ctx, { text: `✓ TTS #${idxStr} approved` });
      await ctx.reply(
        `🎙✅ <b>${escapeHtml(shot.shotCode)}</b>\napprovedTTSJobId = <code>${escapeHtml(job.id)}</code>`,
        { parse_mode: 'HTML' },
      );
    });
  });

  bot.callbackQuery(/^a:d-tts:/, async (ctx) => {
    const [, , shotId, idxStr] = ctx.callbackQuery.data!.split(':');
    await withShotTts(ctx, shotId, Number(idxStr), async (shot, job) => {
      await deleteTTSJob(job.id);
      await safeAnswer(ctx, { text: `🗑 TTS #${idxStr} удалён` });
      await ctx.reply(`🎙🗑 <b>${escapeHtml(shot.shotCode)}</b> — TTS-дубль удалён`, { parse_mode: 'HTML' });
    });
  });

  bot.callbackQuery(/^a:s-tts:/, async (ctx) => {
    const shotId = ctx.callbackQuery.data!.split(':')[2];
    try {
      await clearShotTTSApproval(shotId);
      await safeAnswer(ctx, { text: '✗ approval сброшен' });
    } catch (err) {
      await safeAnswer(ctx, { text: 'Ошибка' });
      await ctx.reply(`❌ <code>${escapeHtml(String(err).slice(0, 300))}</code>`, { parse_mode: 'HTML' });
    }
  });

  // ── BGM open / approve / delete / clear ─────────────────────────────────

  bot.callbackQuery(/^a:open-seg:/, async (ctx) => {
    if (!(await safeAnswer(ctx))) return;
    const segmentId = ctx.callbackQuery.data!.split(':')[2];
    await openSegmentView(ctx, segmentId);
  });

  bot.callbackQuery(/^a:p-bgm:/, async (ctx) => {
    const [, , segmentId, idxStr] = ctx.callbackQuery.data!.split(':');
    await withSegmentJob(ctx, segmentId, Number(idxStr), async (seg, job) => {
      await approveBgmJob(segmentId, job.id);
      await safeAnswer(ctx, { text: `✓ BGM #${idxStr} approved` });
      await ctx.reply(
        `🎵✅ <b>${escapeHtml(seg.block.slug)}/${seg.sortOrder + 1}</b>\napprovedJobId = <code>${escapeHtml(job.id)}</code>`,
        { parse_mode: 'HTML' },
      );
    });
  });

  bot.callbackQuery(/^a:d-bgm:/, async (ctx) => {
    const [, , segmentId, idxStr] = ctx.callbackQuery.data!.split(':');
    await withSegmentJob(ctx, segmentId, Number(idxStr), async (seg, job) => {
      await deleteBgmJob(job.id);
      await safeAnswer(ctx, { text: `🗑 BGM #${idxStr} удалён` });
      await ctx.reply(`🎵🗑 <b>${escapeHtml(seg.block.slug)}/${seg.sortOrder + 1}</b> — дубль удалён`, { parse_mode: 'HTML' });
    });
  });

  bot.callbackQuery(/^a:s-bgm:/, async (ctx) => {
    const segmentId = ctx.callbackQuery.data!.split(':')[2];
    try {
      await clearBgmApproval(segmentId);
      await safeAnswer(ctx, { text: '✗ approval сброшен' });
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
        const target = it.shot?.code
                    ?? it.character?.code
                    ?? it.profile?.code
                    ?? (it.segment ? `${it.segment.block.slug}/${it.segment.sortOrder + 1}` : null)
                    ?? it.scene?.sceneKey
                    ?? '?';
        lines.push(`  ${tag} ${escapeHtml(target)} — ${gateLabel(it.gateKey)}`);

        if (buttonsAdded >= MAX_BUTTONS) continue;
        // Shot-anchored items (gates 4–9 with a shot) → open shot view, which
        // surfaces images + videos + TTS in one card.
        // Segment-anchored items (gate 10 BGM) → open segment view.
        // Character / scene-only items are listed without a button — the user
        // jumps to the UI via the link in the message.
        if (it.shot) {
          kb.text(`${tag} ${target}`.slice(0, 30), `a:open:${it.shot.id}`).row();
          buttonsAdded++;
        } else if (it.segment) {
          kb.text(`${tag} ${target}`.slice(0, 30), `a:open-seg:${it.segment.id}`).row();
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
    case 'generate_anchor':       return '🧷';
    case 'render_scene':          return '🎨';
    case 'approve_render':        return '🖼';
    case 'create_video':          return '🎬';
    case 'approve_video':         return '✅';
    case 'upscale_video':         return '⬆️';
    case 'render_tts':            return '🎙';
    case 'approve_tts':           return '🎙';
    case 'approve_bgm':           return '🎵';
  }
}
function gateLabel(g: GateKey): string {
  switch (g) {
    case 'upload_dataset_images': return 'нужны reference photo';
    case 'start_dataset':         return 'нужен датасет';
    case 'start_training':        return 'нужна LoRA';
    case 'generate_anchor':       return 'нужен якорь-портрет';
    case 'render_scene':          return 'нужен рендер';
    case 'approve_render':        return 'выбрать кадр';
    case 'create_video':          return 'нужно видео';
    case 'approve_video':         return 'выбрать видео';
    case 'upscale_video':         return 'нужен FHD-upscale';
    case 'render_tts':            return 'нужна озвучка';
    case 'approve_tts':           return 'выбрать дубль озвучки';
    case 'approve_bgm':           return 'выбрать дубль BGM';
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
  if (shot.narrationText && shot.narrationText.trim().length) {
    headerLines.push(`<i>«${escapeHtml(shot.narrationText.trim().slice(0, 200))}»</i>`);
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

  // ── Shot TTS dubs ─────────────────────────────────────────────────────────
  const completedTts = (shot.ttsJobs ?? []).filter((j) => j.status === 'completed' && j.outputFilename);
  if (completedTts.length > 0 && shot.project) {
    const slice = completedTts.slice(0, 5);
    for (let i = 0; i < slice.length; i++) {
      const j = slice[i];
      const filePath = path.join(
        APP_ROOT, 'data', shot.project.slug, 'shots', shot.shotCode, j.outputFilename!,
      );
      if (!existsSync(filePath)) {
        await ctx.reply(
          `🎙 #${i + 1}: файл не найден — <code>${escapeHtml(filePath)}</code>`,
          { parse_mode: 'HTML' },
        );
        continue;
      }
      const isChosen = shot.approvedTTSJobId === j.id;
      const dur      = j.durationMs ? ` · ${(j.durationMs / 1000).toFixed(1)}s` : '';
      const caption  = `🎙 #${i + 1}${isChosen ? '  ✓ approved' : ''}${dur}`;
      try {
        await ctx.replyWithAudio(new InputFile(filePath), {
          caption, parse_mode: 'HTML',
          title:     `${shot.shotCode} TTS #${i + 1}`,
          performer: j.voice,
        });
      } catch (err) {
        await ctx.reply(
          `🎙 #${i + 1}: send failed — <code>${escapeHtml(String(err).slice(0, 200))}</code>`,
          { parse_mode: 'HTML' },
        );
      }
    }
    const kb = new InlineKeyboard();
    slice.forEach((_, i) => {
      kb.text(`🎙 ✅ #${i + 1}`, `a:p-tts:${shotId}:${i + 1}`)
        .text(`🎙 🗑 #${i + 1}`, `a:d-tts:${shotId}:${i + 1}`)
        .row();
    });
    if (shot.approvedTTSJobId) kb.text('🎙 ✗ Сбросить approval', `a:s-tts:${shotId}`).row();
    await ctx.reply(`<b>🎙 Озвучка</b> — выбери / удали:`, {
      parse_mode: 'HTML', reply_markup: kb,
    });
  } else if (shot.narrationText) {
    const kb = new InlineKeyboard().text('🎙 Поставить озвучку', `a:r-tts:${shotId}`);
    await ctx.reply(
      `<i>🎙 Дублей озвучки нет.</i> Текст есть — можно поставить TTS в очередь:`,
      { parse_mode: 'HTML', reply_markup: kb },
    );
  }
}

// ── Open BGM segment view ───────────────────────────────────────────────────

async function openSegmentView(ctx: Context, segmentId: string): Promise<void> {
  let seg: BgmSegmentFull;
  try {
    seg = await fetchSegment(segmentId);
  } catch (err) {
    await ctx.reply(`❌ <code>${escapeHtml(String(err).slice(0, 300))}</code>`, { parse_mode: 'HTML' });
    return;
  }

  const projectSlug = seg.block.project?.slug ?? null;

  const header: string[] = [
    `<b>🎵 ${escapeHtml(seg.block.slug)} / сегмент ${seg.sortOrder + 1}</b>`,
  ];
  if (seg.prompt) header.push(`<i>«${escapeHtml(seg.prompt.slice(0, 200))}»</i>`);
  header.push(`длительность: ${seg.durationSec}s`);
  header.push(`дублей: ${seg.jobs.length}${seg.approvedJobId ? ` (✓ approved)` : ''}`);
  await ctx.reply(header.join('\n'), { parse_mode: 'HTML' });

  const completed = seg.jobs.filter((j) => j.status === 'completed' && j.outputFilename);
  if (completed.length === 0) {
    await ctx.reply(`<i>Готовых дублей нет.</i>`, { parse_mode: 'HTML' });
    return;
  }

  const slice = completed.slice(0, 5);
  for (let i = 0; i < slice.length; i++) {
    const j = slice[i];
    const filePath = projectSlug
      ? path.join(APP_ROOT, 'data', projectSlug, 'bgm', seg.block.slug, j.outputFilename!)
      : null;
    if (!filePath || !existsSync(filePath)) {
      await ctx.reply(
        `🎵 #${i + 1}: файл не найден — <code>${escapeHtml(filePath ?? '(no slug)')}</code>`,
        { parse_mode: 'HTML' },
      );
      continue;
    }
    const isChosen = seg.approvedJobId === j.id;
    const caption  = `🎵 #${i + 1}${isChosen ? '  ✓ approved' : ''}`;
    try {
      await ctx.replyWithAudio(new InputFile(filePath), {
        caption, parse_mode: 'HTML',
        title:     `${seg.block.slug}/${seg.sortOrder + 1} take ${i + 1}`,
        performer: 'BGM',
      });
    } catch (err) {
      await ctx.reply(
        `🎵 #${i + 1}: send failed — <code>${escapeHtml(String(err).slice(0, 200))}</code>`,
        { parse_mode: 'HTML' },
      );
    }
  }

  const kb = new InlineKeyboard();
  slice.forEach((_, i) => {
    kb.text(`🎵 ✅ #${i + 1}`, `a:p-bgm:${segmentId}:${i + 1}`)
      .text(`🎵 🗑 #${i + 1}`, `a:d-bgm:${segmentId}:${i + 1}`)
      .row();
  });
  if (seg.approvedJobId) kb.text('🎵 ✗ Сбросить approval', `a:s-bgm:${segmentId}`).row();
  await ctx.reply(`<b>🎵 BGM</b> — выбери / удали:`, {
    parse_mode: 'HTML', reply_markup: kb,
  });
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

async function withShotTts(
  ctx: Context,
  shotId: string,
  idx: number,
  fn: (shot: ShotFull, job: TtsJobRow) => Promise<void>,
): Promise<void> {
  try {
    const shot = await fetchShotWithVideos(shotId);
    const list = (shot.ttsJobs ?? []).filter((j) => j.status === 'completed' && j.outputFilename);
    const job  = list[idx - 1];
    if (!job) { await safeAnswer(ctx, { text: 'TTS не найден' }); return; }
    await fn(shot, job);
  } catch (err) {
    await safeAnswer(ctx, { text: 'Ошибка' });
    await ctx.reply(`❌ <code>${escapeHtml(String(err).slice(0, 300))}</code>`, { parse_mode: 'HTML' });
  }
}

async function withSegmentJob(
  ctx: Context,
  segmentId: string,
  idx: number,
  fn: (seg: BgmSegmentFull, job: BgmSegmentFull['jobs'][number]) => Promise<void>,
): Promise<void> {
  try {
    const seg = await fetchSegment(segmentId);
    const list = seg.jobs.filter((j) => j.status === 'completed' && j.outputFilename);
    const job  = list[idx - 1];
    if (!job) { await safeAnswer(ctx, { text: 'BGM не найден' }); return; }
    await fn(seg, job);
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
