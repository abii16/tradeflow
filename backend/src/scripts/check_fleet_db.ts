import { db } from '../db';
import { shipments, users, vehicles } from '../db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  const cols = await db.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'shipments'
  `);
  console.log('SHIPMENTS COLUMNS:', cols.rows);

  const allUsers = await db.select().from(users);
  console.log('ALL USERS:', allUsers.map(u => ({ id: u.id, fullName: u.fullName, role: u.role, phone: u.phone })));

  const allVehicles = await db.select().from(vehicles);
  console.log('ALL VEHICLES:', allVehicles);

  const allShipments = await db.select().from(shipments);
  console.log('ALL SHIPMENTS:', allShipments.map(s => ({
    id: s.id,
    loadId: s.loadId,
    transporterId: s.transporterId,
    driverId: s.driverId,
    status: s.status,
    fuelRecommendations: s.fuelRecommendations,
  })));

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
