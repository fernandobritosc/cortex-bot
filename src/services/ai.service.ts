import { groq } from './groq.service';
import { gemini } from './gemini.service';
import { db } from '../db';
import { memories, reminders, transactions } from '../db/schema';
import { eq, and, gte, asc, desc, like } from 'drizzle-orm';

export class IntelligenceAdapter {
  private getSystemPrompt(): string {
    return `Você é o Cortex, um assistente pessoal de elite. Seu nome é Cortex. Quando perguntado sobre seu nome, responda: "Meu nome é Cortex." Sua comunicação é minimalista e elegante. Nunca use emojis. Nunca use negritos (**), itálicos ou outros caracteres de formatação Markdown. Use apenas letras maiúsculas para títulos e espaçamento para organizar o conteúdo.

CONTEXTO TEMPORAL ATUAL (Fuso America/Sao_Paulo):
Data: ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Sao_Paulo' })}
Hora: ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}

Use sempre essas informações ao responder perguntas sobre data e hora.`;
  }

  async processText(text: string, chatId: string, history: any[] = []) {
    // Primeiro tenta entender a intenção com Groq (mais rápido)
    let analysis;
    let provider = 'groq';

    try {
        analysis = await groq.extractIntent(text);
    } catch (e) {
        console.error('Groq Intent Error, falling back to Gemini:', e);
        analysis = await gemini.extractIntent(text);
        provider = 'gemini';
    }
    
    if (analysis.intent === 'chat') {
        try {
            if (provider === 'gemini') {
                return await gemini.chat([
                    { role: 'system', content: this.getSystemPrompt() },
                    ...history,
                    { role: 'user', content: text }
                ]);
            }
            return await groq.chat([
                { role: 'system', content: this.getSystemPrompt() },
                ...history,
                { role: 'user', content: text }
            ]);
        } catch (e) {
            console.error(`${provider} Chat Error, falling back to Gemini Chat:`, e);
            if (provider === 'groq') {
                return await gemini.chat([
                    { role: 'system', content: this.getSystemPrompt() },
                    ...history,
                    { role: 'user', content: text }
                ]);
            }
            throw e;
        }
    }

    if (analysis.intent === 'reminder' && analysis.data?.scheduledAt) {
      try {
        const scheduledDate = new Date(analysis.data.scheduledAt);
        await db.insert(reminders).values({
          chatId,
          description: analysis.data?.description || analysis.summary,
          category: analysis.category || 'pessoal',
          scheduledAt: scheduledDate,
        });
        
        const dateStr = scheduledDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const timeStr = scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
        
        return `LEMBRETE AGENDADO\n\nAtividade: ${analysis.summary}\nHorário: ${dateStr} às ${timeStr}`;
      } catch (error) {
        console.error('Error saving reminder:', error);
        return `Tive um problema ao salvar seu lembrete, mas entendi que você quer: ${analysis.summary}`;
      }
    }

    if (analysis.intent === 'bulk_reminders' && analysis.data?.items) {
        try {
            const items = analysis.data.items;
            for (const item of items) {
                await db.insert(reminders).values({
                    chatId,
                    description: item.description,
                    category: item.category || 'pessoal',
                    scheduledAt: new Date(item.scheduledAt),
                });
            }
            return `AGENDA ATUALIZADA\n\nForam integrados ${items.length} novos itens à sua lista.`;
        } catch (error) {
            console.error('Error saving bulk reminders:', error);
            return "Tive um problema ao salvar a lista completa, mas alguns podem ter sido agendados.";
        }
    }

    if (analysis.intent === 'list_reminders') {
        try {
            const now = new Date();
            const results = await db.select()
                .from(reminders)
                .where(and(
                    eq(reminders.chatId, chatId),
                    gte(reminders.scheduledAt, now)
                ))
                .orderBy(asc(reminders.scheduledAt));

            if (results.length === 0) {
                return "AGENDA VAZIA\n\nNenhum compromisso agendado para o futuro.";
            }

            const list = results.map(r => {
                const date = r.scheduledAt.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                const time = r.scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
                return `${r.description}: ${date} às ${time}`;
            }).join('\n');

            return `SEUS COMPROMISSOS\n\n${list}`;
        } catch (error) {
            console.error('Error listing reminders:', error);
            return "Houve um erro ao buscar seus lembretes. Tente novamente em instantes.";
        }
    }

    if (analysis.intent === 'store_fact' && analysis.data?.fact) {
        try {
            await db.insert(memories).values({
                chatId,
                content: analysis.data.fact,
                category: 'fact',
                type: 'text'
            });
            return `FATO REGISTRADO\n\nInformação integrada à sua memória permanente com sucesso.`;
        } catch (error) {
            console.error('Error saving fact:', error);
            return "Tive um problema ao registrar este fato, mas entendi a informação.";
        }
    }

    if (analysis.intent === 'search_memory' && analysis.data?.keyword) {
        try {
            const keyword = analysis.data.keyword;
            
            // Buscar em fatos E memórias recentes
            const matches = await db.select()
                .from(memories)
                .where(and(
                    eq(memories.chatId, chatId),
                    like(memories.content, `%${keyword}%`)
                ))
                .orderBy(desc(memories.category), desc(memories.createdAt)) // Prioriza fatos
                .limit(5);

            if (matches.length === 0) {
                return `MEMÓRIA RECUPERADA\n\nNenhuma menção encontrada para o termo: ${keyword}`;
            }

            const historyText = matches.map(m => {
                const prefix = m.category === 'fact' ? '[FATO]' : '[MEMÓRIA]';
                const date = m.createdAt?.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                return `${prefix} (${date}): ${m.content}`;
            }).join('\n\n');

            return `MEMÓRIA RECUPERADA\nTermo pesquisado: ${keyword}\n\n${historyText}`;
        } catch (error) {
            console.error('Error searching memory:', error);
            return "ERRO DE MEMÓRIA\n\nHouve um problema ao recuperar as informações.";
        }
    }

    if (analysis.intent === 'add_expense' && analysis.data?.amount) {
      try {
        const amountCents = Math.round(analysis.data.amount * 100);
        const date = analysis.data.date ? new Date(analysis.data.date) : new Date();

        await db.insert(transactions).values({
          chatId,
          type: 'expense',
          amount: amountCents,
          description: analysis.data.description || analysis.summary,
          category: analysis.category || 'outros',
          date,
        });

        const formatted = (amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        return `GASTO REGISTRADO\n\nDescrição: ${analysis.data.description || analysis.summary}\nValor: ${formatted}\nCategoria: ${(analysis.category || 'outros').toUpperCase()}\nData: ${date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
      } catch (error) {
        console.error('Error saving expense:', error);
        return 'Houve um erro ao registrar o gasto.';
      }
    }

    if (analysis.intent === 'add_income' && analysis.data?.amount) {
      try {
        const amountCents = Math.round(analysis.data.amount * 100);
        const date = analysis.data.date ? new Date(analysis.data.date) : new Date();

        await db.insert(transactions).values({
          chatId,
          type: 'income',
          amount: amountCents,
          description: analysis.data.description || analysis.summary,
          category: analysis.category || 'outros',
          date,
        });

        const formatted = (amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        return `RECEITA REGISTRADA\n\nDescrição: ${analysis.data.description || analysis.summary}\nValor: ${formatted}\nCategoria: ${(analysis.category || 'outros').toUpperCase()}\nData: ${date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
      } catch (error) {
        console.error('Error saving income:', error);
        return 'Houve um erro ao registrar a receita.';
      }
    }

    if (analysis.intent === 'financial_summary') {
      try {
        const now = new Date();
        let startDate: Date;

        const period = analysis.data?.period || 'month';
        if (period === 'today') {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (period === 'week') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (period === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
          startDate = new Date(0);
        }

        const results = await db.select()
          .from(transactions)
          .where(and(
            eq(transactions.chatId, chatId),
            gte(transactions.date, startDate)
          ));

        if (results.length === 0) {
          return 'RESUMO FINANCEIRO\n\nNenhuma transação registrada neste período.';
        }

        const totalIncome = results
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = results
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const balance = totalIncome - totalExpense;

        const expenseByCategory: Record<string, number> = {};
        results.filter(t => t.type === 'expense').forEach(t => {
          expenseByCategory[t.category || 'outros'] = (expenseByCategory[t.category || 'outros'] || 0) + t.amount;
        });

        const categoryLines = Object.entries(expenseByCategory)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, val]) => `  ${cat.toUpperCase()}: ${(val / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`)
          .join('\n');

        const fmt = (v: number) => (v / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const periodLabel = period === 'today' ? 'HOJE' : period === 'week' ? 'ÚLTIMOS 7 DIAS' : period === 'month' ? 'ESTE MÊS' : 'TOTAL';

        return `RESUMO FINANCEIRO — ${periodLabel}\n\nRECEITAS: ${fmt(totalIncome)}\nGASTOS: ${fmt(totalExpense)}\nSALDO: ${fmt(balance)}\n\nGASTOS POR CATEGORIA\n${categoryLines}`;
      } catch (error) {
        console.error('Error fetching financial summary:', error);
        return 'Houve um erro ao buscar o resumo financeiro.';
      }
    }

    if (analysis.intent === 'list_transactions') {
      try {
        const now = new Date();
        let startDate: Date;

        const period = analysis.data?.period || 'month';
        if (period === 'today') {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (period === 'week') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (period === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
          startDate = new Date(0);
        }

        const results = await db.select()
          .from(transactions)
          .where(and(
            eq(transactions.chatId, chatId),
            gte(transactions.date, startDate)
          ))
          .orderBy(desc(transactions.date))
          .limit(15);

        if (results.length === 0) {
          return 'TRANSAÇÕES\n\nNenhuma transação encontrada neste período.';
        }

        const lines = results.map(t => {
          const signal = t.type === 'income' ? '+' : '-';
          const val = (t.amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const date = t.date?.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
          return `${signal} ${val} | ${t.description} (${date})`;
        }).join('\n');

        return `TRANSAÇÕES\n\n${lines}`;
      } catch (error) {
        console.error('Error listing transactions:', error);
        return 'Houve um erro ao listar as transações.';
      }
    }

    if (analysis.intent === 'delete_reminder' && analysis.data?.keyword) {
      try {
        const keyword = analysis.data.keyword;
        const now = new Date();
        const matches = await db.select()
          .from(reminders)
          .where(and(
            eq(reminders.chatId, chatId),
            eq(reminders.sent, false),
            gte(reminders.scheduledAt, now),
            like(reminders.description, `%${keyword}%`)
          ));

        if (matches.length === 0) {
          return `NENHUM LEMBRETE ENCONTRADO\n\nNão encontrei lembretes futuros com o termo: ${keyword}`;
        }

        if (matches.length === 1) {
          await db.delete(reminders).where(eq(reminders.id, matches[0].id));
          return `LEMBRETE CANCELADO\n\n${matches[0].description}`;
        }

        const list = matches.map((r, i) => `${i + 1}. ${r.description}`).join('\n');
        return `MÚLTIPLOS LEMBRETES ENCONTRADOS\n\nQual deles cancelar? Seja mais específico:\n\n${list}`;
      } catch (error) {
        console.error('Error deleting reminder:', error);
        return 'Houve um erro ao tentar cancelar o lembrete.';
      }
    }

    return await groq.chat([
      { role: 'system', content: this.getSystemPrompt() },
      ...history,
      { role: 'user', content: text }
    ]);
  }

  async processImage(imageBuffer: Buffer, mimeType: string, caption?: string) {
    const prompt = `Analise esta imagem com foco em EXTRAÇÃO DE DADOS para meu assistente pessoal (CORTEX).
    
    ESTRUTURA DE RESPOSTA MANDATÓRIA:
    1. Comece com "ANÁLISE:" seguido de um resumo minimalista, elegante e em LETRAS MAIÚSCULAS para categorias. Extraia nomes, datas, locais e valores.
    2. Termine com "AÇÃO SUGERIDA:" seguida de uma destas opções:
       - Se for um compromisso: "AGENDAR | [descrição] | [data/hora no formato YYYY-MM-DD HH:mm]"
       - Se for uma informação persistente: "SALVAR | [fato crucial]"
       - Se não houver ação clara: "NENHUMA"
    
    REGRAS DE ESTILO:
    - Use apenas texto puro.
    - Sem emojis.
    - Sem negrito ou itálico.
    - Minimalismo absoluto.
    
    CONTEXTO DO USUÁRIO: ${caption || "Nenhum contexto adicional provido."}`;
    
    return await gemini.analyzeVision(imageBuffer, mimeType, prompt);
  }
}

export const ai = new IntelligenceAdapter();
