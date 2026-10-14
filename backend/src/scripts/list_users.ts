import { db } from '../db';
import { users } from '../db/schema/users';

async function main() {
  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    role: users.role,
    companyName: users.companyName,
    isVerified: users.isVerified
  }).from(users);
  console.log('USERS_IN_DB:', JSON.stringify(allUsers, null, 2));
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
