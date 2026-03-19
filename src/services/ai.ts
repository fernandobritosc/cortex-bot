import Groq from 'groq-sdk';
import fs from 'fs';

let groqInstance: Groq | null = null;
function getGroq() {
  if (!groqInstance) {
    groqInstance = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqInstance;
}

export async function transcribeAudio(audioFilePath: string): Promise<string> {
  try {
    const transcription = await getGroq().audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-large-v3',
    });
    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

export type ParsedIntent = 
  | { type: 'NOTE'; category: string; text: string }
  | { type: 'REMINDER'; sendAt: string; text: string }
  | { type: 'FINANCE'; amount: number; transactionType: 'INCOME' | 'EXPENSE'; category: string; text: string }
  | { type: 'TASK'; text: string; priority: 'low' | 'medium' | 'high'; dueDate?: string }
  | { type: 'CHAT'; text: string }
  | { type: 'UNKNOWN'; text: string };

export async function extractIntent(text: string): Promise<ParsedIntent> {
  try {
    const completion = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Você é um assistente pessoal inteligente e proativo chamado Cortex. Sua missão é ajudar o usuário a organizar sua vida pessoal, financeira e profissional.\n\nDada uma mensagem, determine a intenção:\n1. 'NOTE': Ideias, notas ou itens simples.\n2. 'REMINDER': Eventos com data/hora específica.\n3. 'FINANCE': Transações financeiras (gastos ou ganhos).\n4. 'TASK': Tarefas profissionais ou rotinas.\n5. 'CHAT': Conversa livre ou dúvidas.\n\nRegras de saída:\n- Para NOTE: JSON com 'category' e 'text'.\n- Para REMINDER: JSON com 'text' e 'sendAt' (ISO 8601 UTC). Fuso: Brasília (UTC-3).\n- Para FINANCE: JSON com 'amount' (número), 'transactionType' ('INCOME' ou 'EXPENSE'), 'category' (Ex: Alimentação, Lazer, Salário) e 'text' (transação).\n- Para TASK: JSON com 'text', 'priority' ('low', 'medium', 'high') e 'dueDate' (opcional ISO 8601).\n- Para CHAT: Forneça a resposta amigável no campo 'text'.\n\nData/Hora atual (Brasília): " + new Date().toLocaleString("pt-BR", {timeZone: "America/Sao_Paulo"}) + "\n\nResponda APENAS em JSON."
        },
        { 
          role: "user", 
          content: text
        }
      ],
      response_format: {
        type: "json_object"
      }
    });

    const content = completion.choices[0].message?.content;
    if (!content) {
        return { type: 'UNKNOWN', text: text };
    }
    
    const result = JSON.parse(content);

    if (result.type === 'NOTE') {
      return { type: 'NOTE', category: result.category || 'Geral', text: result.text };
    } else if (result.type === 'REMINDER') {
      return { type: 'REMINDER', sendAt: result.sendAt || new Date().toISOString(), text: result.text };
    } else if (result.type === 'FINANCE') {
      return { 
        type: 'FINANCE', 
        amount: Number(result.amount) || 0, 
        transactionType: result.transactionType || 'EXPENSE', 
        category: result.category || 'Geral',
        text: result.text 
      };
    } else if (result.type === 'TASK') {
      return { 
        type: 'TASK', 
        text: result.text, 
        priority: result.priority || 'low', 
        dueDate: result.dueDate 
      };
    } else if (result.type === 'CHAT') {
      return { type: 'CHAT', text: result.text };
    }

    return { type: 'UNKNOWN', text: result.text || text };

  } catch (error) {
    console.error('Error extracting intent:', error);
    return { type: 'UNKNOWN', text };
  }
}
