import { ai } from './src/services/ai.service';
import * as dotenv from 'dotenv';
dotenv.config();

async function testFallback() {
  console.log('--- TESTANDO FALLBACK DE IA ---');
  
  const text = 'Me lembre de comprar café amanhã às 08:00';
  const chatId = '6256932968';
  
  console.log(`Input: "${text}"`);
  
  try {
    const response = await ai.processText(text, chatId);
    console.log('\nResposta do Bot:');
    console.log(response);
    
    if (response && (response.includes('LEMBRETE') || response.includes('café'))) {
      console.log('\n✓ Teste de Fallback: SUCESSO');
    } else {
      console.log('\n✗ Teste de Fallback: FALHA (Resposta inesperada)');
    }
  } catch (error) {
    console.error('\n✗ Teste de Fallback: ERRO CRÍTICO', error);
  }
}

testFallback();
