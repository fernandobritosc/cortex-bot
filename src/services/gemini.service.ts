import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  async analyzeVision(imageBuffer: Buffer, mimeType: string, prompt: string) {
    try {
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType
          }
        }
      ]);
      return result.response.text();
    } catch (error) {
      console.error('Gemini Vision Error:', error);
      throw error;
    }
  }

  async chat(messages: { role: string; content: string }[]) {
    try {
      // Converte formato de mensagens do Groq para o Gemini
      const chat = this.model.startChat({
        history: messages.slice(0, -1).map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }))
      });
      const lastMessage = messages[messages.length - 1].content;
      const result = await chat.sendMessage(lastMessage);
      return result.response.text();
    } catch (error) {
      console.error('Gemini Chat Error:', error);
      throw error;
    }
  }

  async extractIntent(text: string) {
    const prompt = `Analise a mensagem do usuário para um Assistente Pessoal de Elite (CORTEX) e extraia a intenção e dados estruturados.
    
    RESPONDA APENAS COM UM OBJETO JSON VÁLIDO.
    
    ESTRUTURA:
    {
        "intent": "reminder" | "list_reminders" | "store_fact" | "search_memory" | "chat" | "bulk_reminders",
        "summary": "resumo curto em Português",
        "category": "pessoal" | "trabalho" | "saúde" | "finanças",
        "data": {
            "scheduledAt": "ISO DATE STRING (se reminder)",
            "fact": "o fato principal (se store_fact)",
            "keyword": "termo de busca (se search_memory)",
            "items": [ // se bulk_reminders
                { "description": "...", "scheduledAt": "...", "category": "..." }
            ]
        }
    }

    INTENÇÕES:
    - reminder: algo para fazer em data/hora específica (Ex: "me lembre de ligar pro médico amanhã às 14h")
    - list_reminders: ver compromissos futuros (Ex: "o que eu tenho pra hoje?")
    - store_fact: guardar informação persistente (Ex: "o aniversário da minha mãe é 15 de maio")
    - search_memory: recuperar info guardada (Ex: "quando é o aniversário da minha mãe?")
    - bulk_reminders: lista de múltiplos itens (Ex: "segue minha agenda: 10h reunião, 15h academia")
    - chat: conversa normal, dúvidas, tarefas que não se encaixam acima.
    
    CONDIÇÃO ESPECIAL: Se a mensagem for vaga ou apenas saudação, use "chat".
    
    IMPORTANTE: Atualmente é ${new Date().toISOString()}. Interprete "amanhã", "hoje", etc., com base nisso.
    
    MENSAGEM: "${text}"`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON não encontrado na resposta do Gemini');
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Gemini Intent Error:', error);
      return { intent: 'chat', summary: text, data: {} };
    }
  }
}

export const gemini = new GeminiService();
