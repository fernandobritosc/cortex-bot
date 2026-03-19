import dotenv from 'dotenv';
dotenv.config();
import { extractIntent } from './src/services/ai';

async function test() {
  console.log('--- Testando Extração de Intenção ---');
  
  const test1 = await extractIntent('Lembrar de comprar pão às 18h');
  console.log('Teste 1 (Lembrete):', test1);

  const test2 = await extractIntent('Nota: O céu é azul hoje');
  console.log('Teste 2 (Nota):', test2);

  const test3 = await extractIntent('Olá Cortex, como você está hoje?');
  console.log('Teste 3 (Chat):', test3);
}

test();
