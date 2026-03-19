import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

async function run() {
  console.log('🚀 Executando migração final...');
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "memories" (
        "id" serial PRIMARY KEY NOT NULL,
        "chat_id" text NOT NULL,
        "content" text NOT NULL,
        "type" text DEFAULT 'text',
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now()
      );
    `;
    console.log('✅ memories ok');

    await sql`
      CREATE TABLE IF NOT EXISTS "profiles" (
        "id" serial PRIMARY KEY NOT NULL,
        "chat_id" text NOT NULL,
        "username" text,
        "first_name" text,
        "created_at" timestamp DEFAULT now(),
        CONSTRAINT "profiles_chat_id_unique" UNIQUE("chat_id")
      );
    `;
    console.log('✅ profiles ok');

    await sql`
      CREATE TABLE IF NOT EXISTS "reminders" (
        "id" serial PRIMARY KEY NOT NULL,
        "chat_id" text NOT NULL,
        "description" text NOT NULL,
        "scheduled_at" timestamp NOT NULL,
        "sent" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now()
      );
    `;
    console.log('✅ reminders ok');

    console.log('🎉 Tudo pronto!');
    process.exit(0);
  } catch (e) {
    console.error('❌ Erro:', e);
    process.exit(1);
  }
}

run();
