import { db } from '../db';
import { sql } from 'drizzle-orm';

async function main() {
  await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS truck_plate VARCHAR(50);`);
  await db.execute(sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS plate_number VARCHAR(50);`);
  console.log('ALTER TABLE executed successfully!');

  const cols = await db.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'shipments' AND column_name = 'truck_plate'
  `);
  console.log('SHIPMENTS TRUCK_PLATE COLUMN:', cols.rows);

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
