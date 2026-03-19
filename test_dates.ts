import { groq } from './src/services/groq.service';
import * as fs from 'fs';

const logFile = 'test_results.txt';
fs.writeFileSync(logFile, ''); // Clear file

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function testExtraction(text: string) {
    log(`\n--- Testando: "${text}" ---`);
    try {
        const result = await groq.extractIntent(text);
        log(`Resultado Final: ${JSON.stringify(result, null, 2)}`);
        log(`Intenção: ${result.intent}`);
        log(`Sumário: ${result.summary}`);
        
        if (result.data?.scheduledAt) {
            const date = new Date(result.data.scheduledAt);
            log(`UTC Extracted: ${result.data.scheduledAt}`);
            log(`Local (SP): ${date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
        }
        
        if (result.data?.items) {
            log('Itens (Bulk):');
            result.data.items.forEach((item: any, i: number) => {
                const date = new Date(item.scheduledAt);
                log(`${i+1}. ${item.description}`);
                log(`   UTC: ${item.scheduledAt}`);
                log(`   Local (SP): ${date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
            });
        }
    } catch (e: any) {
        log(`Erro: ${e.message}`);
    }
}

async function runTests() {
    const now = new Date();
    log(`AGORA (ISO): ${now.toISOString()}`);
    log(`AGORA (SP): ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);

    await testExtraction("me lembre de ligar para o João amanhã às 10h");
    await testExtraction("me avise da reunião próximo domingo");
    await testExtraction("academia às 15h");
    await testExtraction("Me lembre das datas do Concurso Câmara Goiânia: 15/03 Prova Objetiva, 20/04 Resultado");
}

runTests().catch(e => log(`Fatal: ${e.message}`));
