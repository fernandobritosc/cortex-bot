import Groq from 'groq-sdk';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config();

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

export class GroqService {
  async chat(messages: { role: 'user' | 'assistant' | 'system', content: string }[]) {
    try {
      const completion = await groqClient.chat.completions.create({
        messages,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      console.error('Groq Chat Error:', error);
      throw error;
    }
  }

  async transcribeAudio(filePath: string) {
    try {
      const transcription = await groqClient.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-large-v3',
        response_format: 'json',
      });
      return transcription.text;
    } catch (error) {
      console.error('Groq Transcription Error:', error);
      throw error;
    }
  }

  async extractIntent(text: string) {
      const now = new Date();
      const prompt = `
      Você é um extrator de intenções em JSON. Responda APENAS com o objeto JSON, sem nenhum texto adicional.
      
      CONTEXTO TEMPORAL (Fuso America/Sao_Paulo):
      Hoje é: ${now.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Sao_Paulo' })}
      Agora (Fuso Local): ${now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
      Agora (ISO UTC): ${now.toISOString()}
      
      ESTRUTURA DO JSON:
      - Para UM lembrete: { "intent": "reminder", "summary": "...", "category": "pessoal|trabalho|supermercado|outro", "data": { "description": "descrição limpa da tarefa, sem verbos de intenção como 'criar', 'adicionar', 'lembrar de'", "scheduledAt": "ISO_TIMESTAMP_UTC_Z" } }
      - Para MÚLTIPLOS lembretes (lista/bulk): { "intent": "bulk_reminders", "summary": "...", "data": { "items": [{ "description": "descrição limpa da tarefa", "category": "...", "scheduledAt": "..." }] } }
      - Para BUSCAR no histórico: { "intent": "search_memory", "summary": "...", "data": { "keyword": "..." } }
      - Para LISTAR lembretes: { "intent": "list_reminders", "summary": "...", "data": {} }
      - Para SALVAR FATO PERMANENTE (CPF, RG, endereço, alergia, preferência): { "intent": "store_fact", "summary": "...", "data": { "fact": "..." } }
      - Para DELETAR/CANCELAR um lembrete: { "intent": "delete_reminder", "summary": "...", "data": { "keyword": "palavra-chave do lembrete a cancelar" } }
      - Para REGISTRAR GASTO: { "intent": "add_expense", "summary": "...", "category": "alimentação|transporte|saúde|lazer|moradia|outros", "data": { "description": "descrição limpa do gasto", "amount": VALOR_EM_REAIS_NUMERO, "date": "ISO_TIMESTAMP_UTC_Z" } }
      - Para REGISTRAR RECEITA: { "intent": "add_income", "summary": "...", "category": "salário|freelance|outros", "data": { "description": "descrição limpa da receita", "amount": VALOR_EM_REAIS_NUMERO, "date": "ISO_TIMESTAMP_UTC_Z" } }
      - Para CONSULTAR SALDO ou RESUMO FINANCEIRO: { "intent": "financial_summary", "summary": "...", "data": { "period": "month|week|today|all" } }
      - Para LISTAR TRANSAÇÕES: { "intent": "list_transactions", "summary": "...", "data": { "period": "month|week|today|all", "type": "income|expense|all", "category": "categoria ou null" } }
      - Para CONVERSA GERAL: { "intent": "chat", "summary": "...", "data": {} }
      
      REGRAS PARA VALORES FINANCEIROS:
      - Extraia o valor numérico puro em reais (ex: "quarenta e cinco reais" = 45, "R$ 1.200,00" = 1200, "1200 reais" = 1200).
      - Se não houver data explícita, use o horário atual.
      - Categorize automaticamente: mercado/supermercado/feira = alimentação, uber/ônibus/gasolina = transporte, médico/farmácia = saúde, netflix/cinema/bar = lazer, aluguel/conta de luz/água = moradia.
      
      REGRAS CRÍTICAS DE DATA:
      1. Use o "Agora (Fuso Local)" como base para termos como "amanhã", "daqui a 2h", "domingo".
      2. Se hoje é quarta, "domingo" é o próximo domingo.
      3. Importante: O usuário está em GMT-3 (America/Sao_Paulo).
      4. RETORNE SEMPRE O "scheduledAt" EM UTC (formato ISO finalizando com Z).
         Exemplo: Se o usuário quer 08:00 (Local), você deve calcular 11:00 UTC (Local + 3h).
      5. Se não houver horário, use 09:00 local (12:00 UTC).
      
      Mensagem do usuário: "${text}"
      Resposta JSON:`;
      
      const response = await this.chat([{ role: 'user', content: prompt }]);
      try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('JSON não encontrado');
          return JSON.parse(jsonMatch[0]);
      } catch (e) {
          console.error('Groq parsing error:', e);
          console.error('Raw content:', response);
          return { intent: 'chat', summary: text, data: {} };
      }
  }
}

export const groq = new GroqService();
