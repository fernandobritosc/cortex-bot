import { Context } from 'telegraf';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { groq } from '../services/groq.service';
import { ai } from '../services/ai.service';
import { db } from '../db';
import { memories } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { logger } from '../utils/logger';

export async function handleVoiceMessage(ctx: Context) {
  let filePath = '';
  try {
    const voice = (ctx.message as any).voice || (ctx.message as any).audio;
    if (!voice) return;

    const chatId = ctx.chat?.id.toString();
    if (!chatId) return;

    const statusMsg = await ctx.reply('PROCESSANDO ÁUDIO...');

    const fileId = voice.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);
    logger.debug(`Link do arquivo de voz: ${fileLink.href}`);
    
    const tmpDir = os.tmpdir();
    filePath = path.join(tmpDir, `${fileId}.ogg`);
    logger.debug(`Caminho temporal: ${filePath}`);
    
    const response = await axios({
      method: 'GET',
      url: fileLink.href,
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    const transcription = await groq.transcribeAudio(filePath);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    filePath = '';

    await ctx.telegram.deleteMessage(ctx.chat!.id, statusMsg.message_id);
    
    if (transcription) {
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

      const aiResponse = await ai.processText(transcription, chatId, history);

      await db.insert(memories).values({
        chatId,
        content: `[VOZ]: ${transcription}`,
        type: 'voice',
        metadata: { response: aiResponse }
      });

      await ctx.reply(aiResponse);
    } else {
      await ctx.reply('ERRO: NÃO FOI POSSÍVEL TRANSCREVER');
    }

  } catch (error: any) {
    logger.error('Erro no processamento de voz', error);
    await ctx.reply(`ERRO AO PROCESSAR VOZ: ${error.message || 'ERRO DESCONHECIDO'}`);
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
