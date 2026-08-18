// TradeFlow Mobile — Sync Service (offline queue processor)
import {
  getPendingQueue,
  markActionSynced,
  markActionFailed,
  updateLocalCargoStatus,
} from './database';
import { BidPayload } from '../types/cargo';

// ── Network state (toggleable for corridor dead-zone simulation) ──

let isOnline = true;

export function getNetworkStatus(): boolean {
  return isOnline;
}

export function setNetworkStatus(online: boolean): void {
  isOnline = online;
}

export function toggleNetworkStatus(): boolean {
  isOnline = !isOnline;
  return isOnline;
}

// ── Simulated remote sync ──

async function simulateRemoteSync(actionType: string, payload: string): Promise<boolean> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 800));

  if (!isOnline) {
    return false;
  }

  // 90% success rate when online (simulates real-world API reliability)
  return Math.random() > 0.1;
}

// ── Process queued offline actions ──

export interface SyncResult {
  processed: number;
  succeeded: number;
  failed: number;
}

export async function processQueue(): Promise<SyncResult> {
  const result: SyncResult = { processed: 0, succeeded: 0, failed: 0 };

  if (!isOnline) {
    return result;
  }

  const pending = await getPendingQueue();

  for (const action of pending) {
    result.processed++;

    const success = await simulateRemoteSync(action.actionType, action.payload);

    if (success) {
      await markActionSynced(action.id);
      result.succeeded++;

      // Apply server-confirmed state changes locally
      if (action.actionType === 'SUBMIT_BID') {
        try {
          const parsed: BidPayload = JSON.parse(action.payload);
          await updateLocalCargoStatus(parsed.cargoId, 'bid_placed');
        } catch {
          // payload parse error — skip local update
        }
      } else if (action.actionType === 'ACCEPT_LOAD') {
        try {
          const parsed = JSON.parse(action.payload);
          if (parsed.cargoId) {
            await updateLocalCargoStatus(parsed.cargoId, 'in_transit');
          }
        } catch {
          // skip
        }
      }
    } else {
      await markActionFailed(action.id);
      result.failed++;
    }
  }

  return result;
}
