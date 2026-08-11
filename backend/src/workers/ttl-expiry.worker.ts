import { db } from '../db';
import { loads } from '../db/schema/loads';
import { and, eq, lte } from 'drizzle-orm';

export const startTtlWorker = () => {
  const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  setInterval(async () => {
    try {
      console.log(`[TTL Worker] Checking for expired loads...`);
      const now = new Date();

      const result = await db.update(loads)
        .set({ status: 'EXPIRED', updatedAt: now })
        .where(
          and(
            eq(loads.status, 'POSTED'),
            lte(loads.expiresAt, now)
          )
        )
        .returning({ id: loads.id });

      if (result.length > 0) {
        console.log(`[TTL Worker] Expired ${result.length} loads.`);
      }
    } catch (error) {
      console.error('[TTL Worker] Error processing load expiry:', error);
    }
  }, INTERVAL_MS);
  
  console.log('[TTL Worker] Auto-expiry background task started.');
};
