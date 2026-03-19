import { groq } from './src/services/groq.service';
import { db } from './src/db';
import { memories } from './src/db/schema';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  console.log('--- DIAGNÓSTICO ---');
  
  try {
    console.log('1. Testando Groq...');
    const intent = await groq.extractIntent('Teste de conexão');
    console.log('✓ Groq OK:', intent);
  } catch (e: any) {
    console.error('✗ Groq FALHOU:', e.message);
  }

  try {
    console.log('1.5 Testando Gemini...');
    const { gemini } = await import('./src/services/gemini.service');
    const result = await gemini.analyzeVision(Buffer.from([]), 'image/png', 'test');
    console.log('✓ Gemini OK');
  } catch (e: any) {
    console.error('✗ Gemini FALHOU (provavelmente erro de buffer vazio, mas vamos ver a mensagem):', e.message);
  }

  try {
    console.log('2. Testando Banco de Dados...');
    const result = await db.select().from(memories).limit(1);
    console.log('✓ Banco de Dados OK (select works)');
  } catch (e: any) {
    console.error('✗ Banco de Dados FALHOU:', e.message);
  }

  process.exit(0);
}

run();
