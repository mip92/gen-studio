import 'dotenv/config';
import { Bot } from 'grammy';
import { registerQueueHandlers } from './handlers/queue';
import { registerActionsHandlers } from './handlers/actions';

const token   = process.env.TELEGRAM_BOT_TOKEN;
const ownerId = Number(process.env.TELEGRAM_ALLOWED_USER_ID);

if (!token) {
  console.error('[bot] TELEGRAM_BOT_TOKEN is not set — refusing to start');
  process.exit(1);
}
if (!Number.isFinite(ownerId) || ownerId <= 0) {
  console.error('[bot] TELEGRAM_ALLOWED_USER_ID must be a positive Telegram user ID');
  process.exit(1);
}

const bot = new Bot(token);

// Single-ID auth: drop every update that didn't originate from the configured
// owner. Silent on purpose — strangers should get nothing back, not even a
// "you're not authorized" message that confirms the bot exists.
bot.use(async (ctx, next) => {
  if (ctx.from?.id !== ownerId) return;
  await next();
});

bot.command('start', (ctx) =>
  ctx.reply(
    'gen-studio bot. Commands:\n' +
    '• /queue — current queue (filterable)\n' +
    '• /actions — pending pipeline gates + image/video approval from phone',
  ),
);

registerQueueHandlers(bot);
registerActionsHandlers(bot);

bot.catch((err) => {
  console.error('[bot] unhandled error in handler:', err);
});

bot.start({
  onStart: (me) => console.log(`[bot] @${me.username} started, owner=${ownerId}`),
});

const shutdown = async (sig: string) => {
  console.log(`[bot] ${sig} received, stopping…`);
  await bot.stop();
  process.exit(0);
};
process.once('SIGINT',  () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
