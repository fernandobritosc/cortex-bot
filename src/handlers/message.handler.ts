import { Context } from 'telegraf';
import { ai } from '../services/ai.service';
import { db } from '../db';
import { memories } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { logger } from '../utils/logger';

export async function handleTextMessage(ctx: Context) {
  if (!ctx.message || !('text' in ctx.message)) return;

  const text = ctx.message.text;
  const chatId = ctx.chat?.id.toString();

  if (!chatId) return;

  try {
    // 0. Buscar histórico recente
    const historyData = await db.select()
      .from(memories)
      .where(eq(memories.chatId, chatId))
      .orderBy(desc(memories.createdAt))
      .limit(5);

    const history = historyData
      .reverse()
      .filter(m => (m.metadata as any)?.response)
      .map(m => ([
        { role: 'user', content: m.content },
        { role: 'assistant', content: (m.metadata as any).response }
      ])).flat();

    // 1. Processar com Inteligência Artificial
    const response = await ai.processText(text, chatId, history);

    // 2. Salvar na memória (banco de dados)
    await db.insert(memories).values({
      chatId,
      content: text,
      type: 'text',
      metadata: { response }
    });

    // 3. Responder ao usuário
    await ctx.reply(response);
  } catch (error) {
    logger.error('Erro ao processar mensagem de texto', error);
    await ctx.reply('Ops, tive um problema ao processar sua mensagem. 🧠');
  }
}
