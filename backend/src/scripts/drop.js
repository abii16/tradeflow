require('dotenv').config();
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  await sql.unsafe('DROP SCHEMA IF EXISTS public CASCADE;');
  await sql.unsafe('CREATE SCHEMA public;');
  console.log('Schema dropped and recreated');
  process.exit(0);
}
run().catch(console.error);
