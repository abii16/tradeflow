import { payoutService } from '../modules/payments/payout.service';

let workerInterval: NodeJS.Timeout | null = null;

export const startPayoutWorker = (intervalMs: number = 30000) => {
  if (workerInterval) {
    console.log('[Payout Worker] Payout worker already running.');
    return;
  }

  console.log(`[Payout Worker] Starting automated payout background processor (Interval: ${intervalMs}ms)...`);

  workerInterval = setInterval(async () => {
    try {
      const result = await payoutService.processPendingPayoutsBatch(20);
      if (result.processed > 0) {
        console.log(
          `[Payout Worker] Batch execution completed: ${result.processed} processed (${result.succeeded} succeeded, ${result.retrying} retrying, ${result.failed} failed)`
        );
      }
    } catch (error: any) {
      console.error('[Payout Worker] Error running payout batch job:', error.message);
    }
  }, intervalMs);
};

export const stopPayoutWorker = () => {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('[Payout Worker] Payout worker stopped.');
  }
};
