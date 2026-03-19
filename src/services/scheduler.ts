import cron from 'node-cron';
import { db } from '../db';
import { reminders, memories } from '../db/schema';
import { eq, lte, and, lt } from 'drizzle-orm';
import { Telegraf } from 'telegraf';
import { logger } from '../utils/logger';

export function startScheduler(bot: Telegraf) {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      const pendingReminders = await db.query.reminders.findMany({
        where: and(
          eq(reminders.sent, false),
          lte(reminders.scheduledAt, now)
        ),
      });

      for (const reminder of pendingReminders) {
        const chatId = reminder.chatId;
        
        if (chatId) {
          try {
            await bot.telegram.sendMessage(
              chatId, 
              `NOTIFICAÇÃO\n\nLembrete: ${reminder.description}`
            );
            
            await db.update(reminders)
              .set({ sent: true })
              .where(eq(reminders.id, reminder.id));
              
            logger.info(`Lembrete ${reminder.id} enviado para ${chatId}!`);
          } catch (sendError) {
            logger.error(`Falha ao enviar lembrete ${reminder.id} para ${chatId}`, sendError);
          }
        }
      }
    } catch (error) {
      logger.error('Erro no agendador', error);
    }
  });

  cron.schedule('0 3 * * 0', async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const deleted = await db.delete(memories)
        .where(
          and(
            eq(memories.category, 'transient'),
            lt(memories.createdAt, thirtyDaysAgo)
          )
        );
      logger.info(`Limpeza semanal: memórias transientes antigas removidas.`);
    } catch (error) {
      logger.error('Erro na limpeza de memórias', error);
    }
  });

  logger.info('--- Scheduler Online ---');
}
