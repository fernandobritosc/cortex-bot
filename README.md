# CORTEX 2.0 - Assistente Pessoal via Telegram

Cortex é um assistente pessoal inteligente e proativo integrado ao Telegram, projetado para gerenciar lembretes, processar imagens e responder a comandos de voz, tudo com o auxílio de modelos de linguagem avançados (Gemini e Groq).

## 🚀 Funcionalidades

- **🧠 Memória Persistente**: Utiliza SQLite (Drizzle ORM) para lembrar de interações passadas.
- **🖼️ Visão Inteligente**: Analisa fotos e extrai informações úteis.
- **🎙️ Processamento de Voz**: Converte áudios em texto e responde via IA.
- **📅 Agendador de Lembretes**: Gerencia notificações automáticas baseadas em comandos naturais.
- **📊 Monitoramento de Produção**: Comando `/status` para verificar saúde do sistema e integração com PM2.

## 🛠️ Stack Tecnológica

- **Linguagem**: TypeScript / Node.js
- **Banco de Dados**: SQLite com Drizzle ORM
- **APIs de IA**: Google Gemini (Texto/Visão) e Groq (Transcrição de Áudio)
- **Telegram**: Telegraf.js
- **Infraestrutura**: PM2 (Process Manager)

## 📋 Pré-requisitos

1. Concluir a instalação do Node.js (v18+).
2. Obter as seguintes chaves de API:
   - `TELEGRAM_BOT_TOKEN` (via @BotFather)
   - `GEMINI_API_KEY` (via Google AI Studio)
   - `GROQ_API_KEY` (via Groq Console)
   - `TELEGRAM_CHAT_ID` (Seu ID pessoal para segurança)

## ⚙️ Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env # (E preencha seus tokens)

# Sincronizar banco de dados
npx drizzle-kit push
```

## 🏃 Execução

### Modo Desenvolvimento
```bash
npm run dev
```

### Modo Produção (Com PM2)
```bash
npm run build # Caso tenha script de build
pm2 start ecosystem.config.js
```

## 📡 Comandos Disponíveis

- `/start`: Inicia o bot.
- `/status`: Mostra estatísticas de uso e uptime.
- `Texto Natural`: Converse normalmente com o bot.
- `Fotos`: Envie uma imagem para análise.
- `Voz/Áudio`: Envie um áudio para transcrição e resposta.

---
Desenvolvido como um assistente pessoal robusto e extensível.
