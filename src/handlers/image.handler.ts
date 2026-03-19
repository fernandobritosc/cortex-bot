import { Context, Markup } from 'telegraf';
import { ai } from '../services/ai.service';
import { db } from '../db';
import { memories } from '../db/schema';
import axios from 'axios';

export async function handleImageMessage(ctx: Context) {
  if (!ctx.message || !('photo' in ctx.message)) return;

  const photo = ctx.message.photo.pop(); // Maior resolução
  const chatId = ctx.from?.id.toString();
  const caption = (ctx.message as any).caption;

  if (!photo || !chatId) return;

  try {
    // Feedback visual
    await ctx.sendChatAction('typing');
    
    const fileLink = await ctx.telegram.getFileLink(photo.file_id);
    const response = await axios.get(fileLink.toString(), { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    const result = await ai.processImage(buffer, 'image/jpeg', caption);

    // Registro na memória bruta (Log de imagens)
    await db.insert(memories).values({
      chatId,
      content: result,
      type: 'image',
      category: 'vision_log',
      metadata: { fileId: photo.file_id, user_caption: caption }
    });

    // Verificação de Ações Sugeridas
    if (result.includes('AÇÃO SUGERIDA: AGENDAR |')) {
        const part = result.split('AÇÃO SUGERIDA: AGENDAR |')[1]?.trim();
        if (part) {
            return await ctx.reply(result, Markup.inlineKeyboard([
                [Markup.button.callback('🗓️ AGENDAR AGORA', `VIS_ACT_REMINDER|${part}`)],
                [Markup.button.callback('❌ IGNORAR', 'CANCEL')]
            ]));
        }
    }

    if (result.includes('AÇÃO SUGERIDA: SALVAR |')) {
        const part = result.split('AÇÃO SUGERIDA: SALVAR |')[1]?.trim();
        if (part) {
            return await ctx.reply(result, Markup.inlineKeyboard([
                [Markup.button.callback('📝 SALVAR FATO', `VIS_ACT_SAVE|${part}`)],
                [Markup.button.callback('❌ IGNORAR', 'CANCEL')]
            ]));
        }
    }

    await ctx.reply(result);
  } catch (error) {
    console.error('Vision Handler Error:', error);
    await ctx.reply('ERRO AO PROCESSAR IMAGEM\nTente novamente em instantes.');
  }
}
