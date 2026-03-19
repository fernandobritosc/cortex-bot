import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  chatId: text('chat_id').notNull().unique(),
  username: text('username'),
  firstName: text('first_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const memories = pgTable('memories', {
  id: serial('id').primaryKey(),
  chatId: text('chat_id').notNull(),
  content: text('content').notNull(),
  type: text('type').default('text'), // text, audio, image
  category: text('category').default('transient'), // transient, fact
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const reminders = pgTable('reminders', {
  id: serial('id').primaryKey(),
  chatId: text('chat_id').notNull(),
  description: text('description').notNull(),
  category: text('category').default('pessoal'),
  scheduledAt: timestamp('scheduled_at').notNull(),
  sent: boolean('sent').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  chatId: text('chat_id').notNull(),
  type: text('type').notNull(),
  amount: integer('amount').notNull(),
  description: text('description').notNull(),
  category: text('category').default('outros'),
  date: timestamp('date').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});
