import { Context } from 'telegraf';
import { db } from '../db';
import { reminders, memories } from '../db/schema';

export async function handleCallbackQuery(ctx: Context) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

    const queryData = ctx.callbackQuery.data as string;
    const chatId = ctx.from?.id.toString();

    if (!chatId) return;

    try {
        // Ação: Agendar Lembrete via Visão
        if (queryData.startsWith('VIS_ACT_REMINDER|')) {
            const data = queryData.split('VIS_ACT_REMINDER|')[1];
            const [description, dateStr] = data.split('|').map(s => s.trim());
            
            const parsed = new Date(dateStr);
            if (isNaN(parsed.getTime())) {
                await ctx.answerCbQuery('Erro: data inválida.');
                return await ctx.reply('ERRO\n\nNão foi possível interpretar a data. Tente agendar novamente pelo chat.');
            }
            
            await db.insert(reminders).values({
                chatId,
                description,
                scheduledAt: parsed
            });

            await ctx.answerCbQuery('Agendado com sucesso!');
            await ctx.editMessageReplyMarkup(undefined);
            return await ctx.reply(`AGENDADO\n\n${description}\nPara: ${dateStr}`);
        }

        // Ação: Salvar Fato via Visão
        if (queryData.startsWith('VIS_ACT_SAVE|')) {
            const fact = queryData.split('VIS_ACT_SAVE|')[1];
            
            await db.insert(memories).values({
                chatId,
                content: fact,
                category: 'fact',
                type: 'text'
            });

            await ctx.answerCbQuery('Salvo na memória!');
            await ctx.editMessageReplyMarkup(undefined);
            return await ctx.reply(`FATO REGISTRADO\n\n${fact}`);
        }

        if (queryData === 'CANCEL') {
            await ctx.answerCbQuery('Operação cancelada');
            return await ctx.editMessageReplyMarkup(undefined);
        }

    } catch (error) {
        console.error('Callback Error:', error);
        await ctx.answerCbQuery('Erro ao processar ação');
    }
}
