import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;

// Desabilitar SSL se for localhost (Supabase local ou Docker), habilitar para nuvem
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
