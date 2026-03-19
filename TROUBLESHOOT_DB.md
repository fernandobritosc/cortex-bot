# Plano de Contingência para Sincronização do Banco de Dados

## O Problema
O comando `npx prisma db push` está parando sem completar a execução. Isso geralmente ocorre devido a:
1. Bloqueio de porta (6543) pelo provedor de internet ou firewall.
2. Tempo de resposta (timeout) do banco de dados ao tentar criar as tabelas remotamente.

## Solução 1: Comandos Alternativos
Tente rodar no terminal:
```bash
npx prisma db push --skip-generate --accept-data-loss
```

## Solução 2: SQL Direto (Recomendado)
Caso o comando acima continue falhando, utilize o script SQL abaixo no **SQL Editor** do seu painel Supabase:

```sql
-- Criar tabela Note
CREATE TABLE IF NOT EXISTS "Note" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "chatId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- Criar tabela Reminder
CREATE TABLE IF NOT EXISTS "Reminder" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "sendAt" TIMESTAMP(3) NOT NULL,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "chatId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);
```

## Solução 3: Ajuste de Conexão no .env
Tente remover o `directUrl` do seu `prisma/schema.prisma` e de `web/prisma/schema.prisma` e use apenas o `DATABASE_URL` sem o pgbouncer temporariamente para o push.
