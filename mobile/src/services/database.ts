// TradeFlow Mobile — SQLite Database Service
import * as SQLite from 'expo-sqlite';
import { CargoLoad, CargoStatus, OfflineAction, ActionType, QueueStatus } from '../types/cargo';

const DB_NAME = 'tradeflow_mobile.db';

let db: SQLite.SQLiteDatabase | null = null;

// ── Seed data — Ethiopian corridor loads ──
const SEED_CARGO: Omit<CargoLoad, 'id'>[] = [
  {
    title: '40T Structural Steel',
    cargoType: 'Structural Steel',
    origin: 'Djibouti Port',
    destination: 'Modjo Dry Port',
    distanceKm: 910,
    weightTons: 40,
    rateETB: 340000,
    pickupWindow: '2026-08-20 06:00',
    status: 'open',
    urgency: 'urgent',
    postedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    title: '25T Coffee Beans (Export)',
    cargoType: 'Coffee Beans',
    origin: 'Modjo Dry Port',
    destination: 'Djibouti Port',
    distanceKm: 910,
    weightTons: 25,
    rateETB: 285000,
    pickupWindow: '2026-08-21 08:00',
    status: 'open',
    urgency: 'normal',
    postedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    title: '18T Textile Goods',
    cargoType: 'Textile Goods',
    origin: 'Djibouti Port',
    destination: 'Addis Ababa',
    distanceKm: 980,
    weightTons: 18,
    rateETB: 410000,
    pickupWindow: '2026-08-19 14:00',
    status: 'open',
    urgency: 'urgent',
    postedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    title: '30T Fertilizer',
    cargoType: 'Fertilizer',
    origin: 'Djibouti Port',
    destination: 'Dire Dawa',
    distanceKm: 310,
    weightTons: 30,
    rateETB: 175000,
    pickupWindow: '2026-08-22 07:00',
    status: 'open',
    urgency: 'normal',
    postedAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    title: '12T Electronics',
    cargoType: 'Electronics',
    origin: 'Modjo Dry Port',
    destination: 'Addis Ababa',
    distanceKm: 73,
    weightTons: 12,
    rateETB: 62000,
    pickupWindow: '2026-08-20 10:00',
    status: 'open',
    urgency: 'normal',
    postedAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    title: '22T Machinery Parts',
    cargoType: 'Machinery Parts',
    origin: 'Djibouti Port',
    destination: 'Modjo Dry Port',
    distanceKm: 910,
    weightTons: 22,
    rateETB: 298000,
    pickupWindow: '2026-08-21 05:00',
    status: 'in_transit',
    urgency: 'normal',
    postedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    title: '35T Construction Material',
    cargoType: 'Construction Material',
    origin: 'Dire Dawa',
    destination: 'Addis Ababa',
    distanceKm: 500,
    weightTons: 35,
    rateETB: 220000,
    pickupWindow: '2026-08-23 06:00',
    status: 'open',
    urgency: 'normal',
    postedAt: new Date(Date.now() - 5400000).toISOString(),
  },
];

// ── Database lifecycle ──

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = await getDatabase();

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS cached_cargo (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      cargoType TEXT NOT NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      distanceKm INTEGER NOT NULL,
      weightTons REAL NOT NULL,
      rateETB REAL NOT NULL,
      pickupWindow TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      urgency TEXT NOT NULL DEFAULT 'normal',
      postedAt TEXT NOT NULL
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_action_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actionType TEXT NOT NULL,
      payload TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      retryCount INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Seed if empty
  const countResult = await database.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM cached_cargo'
  );

  if (countResult && countResult.cnt === 0) {
    for (let i = 0; i < SEED_CARGO.length; i++) {
      const c = SEED_CARGO[i];
      const id = `TF-LOAD-${8800 + i}`;
      await database.runAsync(
        `INSERT INTO cached_cargo (id, title, cargoType, origin, destination, distanceKm, weightTons, rateETB, pickupWindow, status, urgency, postedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id, c.title, c.cargoType, c.origin, c.destination,
        c.distanceKm, c.weightTons, c.rateETB, c.pickupWindow,
        c.status, c.urgency, c.postedAt
      );
    }
  }
}

// ── Cargo CRUD ──

export async function getCachedCargo(
  search?: string,
  routeFilter?: string
): Promise<CargoLoad[]> {
  const database = await getDatabase();
  let query = 'SELECT * FROM cached_cargo WHERE 1=1';
  const params: (string | number)[] = [];

  if (search && search.trim()) {
    query += ' AND (title LIKE ? OR cargoType LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }

  if (routeFilter && routeFilter !== 'All') {
    query += ' AND (origin LIKE ? OR destination LIKE ?)';
    const routeTerm = `%${routeFilter}%`;
    params.push(routeTerm, routeTerm);
  }

  query += ' ORDER BY postedAt DESC';

  const rows = await database.getAllAsync<CargoLoad>(query, ...params);
  return rows;
}

export async function updateLocalCargoStatus(
  cargoId: string,
  newStatus: CargoStatus
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE cached_cargo SET status = ? WHERE id = ?',
    newStatus, cargoId
  );
}

// ── Offline Action Queue ──

export async function enqueueOfflineAction(
  actionType: ActionType,
  payload: object
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO offline_action_queue (actionType, payload, createdAt, status, retryCount)
     VALUES (?, ?, ?, 'pending', 0)`,
    actionType, JSON.stringify(payload), new Date().toISOString()
  );
}

export async function getPendingQueue(): Promise<OfflineAction[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<OfflineAction>(
    "SELECT * FROM offline_action_queue WHERE status = 'pending' ORDER BY createdAt ASC"
  );
  return rows;
}

export async function getAllQueueItems(): Promise<OfflineAction[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<OfflineAction>(
    'SELECT * FROM offline_action_queue ORDER BY createdAt DESC'
  );
  return rows;
}

export async function markActionSynced(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "UPDATE offline_action_queue SET status = 'synced' WHERE id = ?",
    id
  );
}

export async function markActionFailed(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "UPDATE offline_action_queue SET status = 'failed', retryCount = retryCount + 1 WHERE id = ?",
    id
  );
}

export async function deleteQueueItem(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'DELETE FROM offline_action_queue WHERE id = ?',
    id
  );
}

export async function getPendingCount(): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM offline_action_queue WHERE status = 'pending'"
  );
  return result?.cnt ?? 0;
}
