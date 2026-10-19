// TradeFlow Mobile — SQLite Database Service
import * as SQLite from 'expo-sqlite';
import { CargoLoad, CargoStatus, OfflineAction, ActionType, QueueStatus } from '../types/cargo';
import { AuthUser } from '../types/auth';

const DB_NAME = 'tradeflow_mobile.db';

let db: SQLite.SQLiteDatabase | null = null;

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

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS user_session (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL,
      fullName TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      companyName TEXT,
      tinNumber TEXT,
      licensePlate TEXT,
      driverLicense TEXT,
      token TEXT
    );
  `);

  // Remove any previously seeded mock cargo
  await database.runAsync("DELETE FROM cached_cargo WHERE id LIKE 'TF-LOAD-%'");
}

export async function getActiveDriverTrip(): Promise<CargoLoad | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<CargoLoad>(
    "SELECT * FROM cached_cargo WHERE status = 'in_transit' LIMIT 1"
  );
  return row || null;
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

// ── User Session (Local SQLite Persistence) ──

export async function saveUserSession(user: AuthUser): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM user_session');
  await database.runAsync(
    `INSERT INTO user_session (id, email, fullName, role, phone, companyName, tinNumber, licensePlate, driverLicense, token)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    user.id,
    user.email,
    user.fullName,
    user.role,
    user.phone || '',
    user.companyName || '',
    user.tinNumber || '',
    user.licensePlate || '',
    user.driverLicense || '',
    user.token || ''
  );
}

export async function getCurrentUserSession(): Promise<AuthUser | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<AuthUser>(
    'SELECT * FROM user_session LIMIT 1'
  );
  return row || null;
}

export async function clearUserSession(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM user_session');
}
