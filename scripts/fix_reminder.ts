import { db } from '../src/db';
import { reminders } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  try {
    const targetId = 1;
    const newDate = new Date('2026-03-12T17:30:00-03:00');
    
    console.log(`Updating reminder ${targetId} to ${newDate.toISOString()} and resetting sent flag`);
    
    await db.update(reminders)
      .set({ 
        scheduledAt: newDate,
        sent: false 
      })
      .where(eq(reminders.id, targetId));
        
    console.log('✅ Update successful');
  } catch (error) {
    console.error('❌ Error updating reminder:', error);
    process.exit(1);
  }
  process.exit(0);
}

run();
