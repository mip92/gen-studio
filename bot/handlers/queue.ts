import type { Bot, Context } from 'grammy';
import { fetchQueue } from '../lib/api';
import {
  DEFAULT_FILTERS,
  buildKeyboard,
  decodeFilters,
  renderQueueText,
} from '../lib/format';

export function registerQueueHandlers(bot: Bot): void {
  bot.command('queue', async (ctx) => {
    await renderAndSend(ctx, DEFAULT_FILTERS);
  });

  // All queue-related buttons use callback_data prefixed with "q:" — single
  // handler, single rendering path, single rate-limit pinch point.
  bot.callbackQuery(/^q:/, async (ctx) => {
    const f = decodeFilters(ctx.callbackQuery.data ?? '');
    if (!f) {
      await safeAnswer(ctx, { text: 'Bad filter' });
      return;
    }
    await renderAndEdit(ctx, f);
  });
}

async function renderAndSend(ctx: Context, f: typeof DEFAULT_FILTERS): Promise<void> {
  try {
    const page = await fetchQueue(f);
    await ctx.reply(renderQueueText(page, f), {
      parse_mode: 'HTML',
      reply_markup: buildKeyboard(f),
    });
  } catch (err) {
    await ctx.reply(`Queue fetch failed: <code>${escapeHtml(String(err))}</code>`, { parse_mode: 'HTML' });
  }
}

async function renderAndEdit(ctx: Context, f: typeof DEFAULT_FILTERS): Promise<void> {
  // Acknowledge the click immediately so the Telegram loading spinner clears.
  // If the query is stale (>15 min), bail — the underlying message can't be
  // edited either, and there's no user to inform.
  if (!(await safeAnswer(ctx))) return;

  try {
    const page = await fetchQueue(f);
    await ctx.editMessageText(renderQueueText(page, f), {
      parse_mode: 'HTML',
      reply_markup: buildKeyboard(f),
    });
  } catch (err) {
    if (isBenignEditError(err)) return;
    // Real error — post a follow-up message; can't show a toast since the
    // callback was already answered above.
    try {
      await ctx.reply(`Refresh failed: <code>${escapeHtml(String(err).slice(0, 300))}</code>`, { parse_mode: 'HTML' });
    } catch { /* nothing more we can do */ }
  }
}

/** Returns true if the callback was acknowledged, false if it was stale and
 *  the caller should give up. Stale queries are expected after a bot restart
 *  when the user clicks a button on a pre-restart message. */
async function safeAnswer(ctx: Context, payload?: { text: string }): Promise<boolean> {
  try {
    await ctx.answerCallbackQuery(payload);
    return true;
  } catch (e) {
    if (isStaleQueryError(e)) return false;
    console.error('[bot] answerCallbackQuery failed:', e);
    return false;
  }
}

function isStaleQueryError(e: any): boolean {
  const desc = String(e?.description ?? e?.message ?? e);
  return desc.includes('query is too old')
      || desc.includes('query ID is invalid')
      || desc.includes('QUERY_ID_INVALID');
}

function isBenignEditError(e: any): boolean {
  const desc = String(e?.description ?? e?.message ?? e);
  return desc.includes('message is not modified')
      || desc.includes('message to edit not found')
      || isStaleQueryError(e);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
