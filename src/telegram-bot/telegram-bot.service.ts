import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Bot } from 'grammy';
import { registerQueueHandlers } from '../../bot/handlers/queue';
import { registerActionsHandlers } from '../../bot/handlers/actions';

const VISIBLE_COMMANDS = [
  { command: 'actions', description: 'Pending gates + approve/delete media' },
  { command: 'queue',   description: 'Pipeline queue (filterable)' },
  { command: 'start',   description: 'Help / command list' },
];

@Injectable()
export class TelegramBotService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(TelegramBotService.name);
  private bot: Bot | null = null;

  onApplicationBootstrap(): void {
    const token   = process.env.TELEGRAM_BOT_TOKEN;
    const ownerId = Number(process.env.TELEGRAM_ALLOWED_USER_ID);

    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN is not set — bot disabled');
      return;
    }
    if (!Number.isFinite(ownerId) || ownerId <= 0) {
      this.logger.warn('TELEGRAM_ALLOWED_USER_ID is invalid — bot disabled');
      return;
    }

    const bot = new Bot(token);
    this.bot = bot;

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
      this.logger.error('Unhandled error in handler:', err as Error);
    });

    // Long-polling never returns — start it in the background. Errors during
    // initial connection surface via .catch on the returned promise.
    void bot
      .start({
        onStart: async (me) => {
          try {
            await bot.api.setMyCommands(VISIBLE_COMMANDS);
            await bot.api.setChatMenuButton({
              menu_button: { type: 'commands' },
            });
          } catch (e) {
            this.logger.warn(
              `could not register commands menu: ${String(e)}`,
            );
          }
          this.logger.log(`@${me.username} started, owner=${ownerId}`);
        },
      })
      .catch((err) => {
        this.logger.error('bot.start failed:', err);
      });
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    if (!this.bot) return;
    this.logger.log(`${signal ?? 'shutdown'} received, stopping bot…`);
    try {
      await this.bot.stop();
    } catch (e) {
      this.logger.warn(`bot.stop failed: ${String(e)}`);
    }
    this.bot = null;
  }
}
