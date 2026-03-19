import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import { handleTextMessage } from './handlers/message.handler';
import { handleImageMessage } from './handlers/image.handler';
import { handleVoiceMessage } from './handlers/voice.handler';
import { handleCallbackQuery } from './handlers/callback.handler';
import { startScheduler } from './services/scheduler';
import { logger } from './utils/logger';
import os from 'os';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const MY_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const START_TIME = new Date();

// Iniciar agendador
startScheduler(bot);

// Middleware de Segurança: Só responde a você
bot.use(async (ctx, next) => {
  const chatId = ctx.from?.id.toString();
  if (chatId === MY_CHAT_ID) {
    return next();
  }
  logger.warn(`Acesso negado para o ID: ${chatId}`);
});

// Handlers
bot.on('text', handleTextMessage);
bot.on('photo', handleImageMessage);
bot.on('voice', handleVoiceMessage);
bot.on('audio', handleVoiceMessage);
bot.on('callback_query', handleCallbackQuery);

// Comandos
bot.command('start', (ctx) => ctx.reply('CORTEX ATIVADO'));

bot.command('status', (ctx) => {
  const uptime = Math.floor((new Date().getTime() - START_TIME.getTime()) / 1000);
  const memory = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
  const statusMsg = `📊 STATUS DO SISTEMA\n\n` +
    `🤖 Bot: Online\n` +
    `⏱️ Uptime: ${uptime}s\n` +
    `🧠 Memória: ${memory} MB\n` +
    `💻 OS: ${os.platform()} (${os.arch()})\n` +
    `📅 Início: ${START_TIME.toLocaleString('pt-BR')}`;
  
  ctx.reply(statusMsg);
});

// Error handling global do Telegraf
bot.catch((err: any, ctx) => {
  logger.error(`Erro no bot para o update ${ctx.updateType}`, err);
  ctx.reply('Desculpe, tive um erro interno ao processar isso.');
});

bot.launch().then(() => {
  logger.info('--- Cortex 2.0 Online ---');
});

// Tratamento de erros globais do Node
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', err);
  // O PM2 vai reiniciar o processo se ele cair
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', reason);
});

// Enable graceful stop
process.once('SIGINT', () => {
  logger.info('SIGINT recebido. Fechando bot...');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  logger.info('SIGTERM recebido. Fechando bot...');
  bot.stop('SIGTERM');
});
