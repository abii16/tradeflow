import { db } from './src/db';
import { loads } from './src/db/schema/loads';

async function run() {
  const all = await db.select().from(loads);
  console.log("Found loads:", all.length);
  console.log(JSON.stringify(all, null, 2));
  process.exit(0);
}
run();
