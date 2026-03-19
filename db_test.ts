import { db } from './src/db';
import { memories } from './src/db/schema';
import { logger } from './src/utils/logger';

async function test() {
    try {
        console.log("Testing DB connection...");
        const result = await db.select().from(memories).limit(1);
        console.log("DB Connection OK!", result);
        process.exit(0);
    } catch (error) {
        console.error("DB Connection FAILED!", error);
        process.exit(1);
    }
}

test();
