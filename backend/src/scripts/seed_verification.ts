import { db } from '../db';
import { verifications } from '../db/schema/verifications';
import { users } from '../db/schema/users';

async function run() {
  const allUsers = await db.select().from(users).limit(1);
  if (allUsers.length === 0) {
    console.log("No users found.");
    process.exit(1);
  }
  const user = allUsers[0];
  
  await db.insert(verifications).values({
    userId: user.id,
    tradeLicenseNumber: 'TL-8821-EX',
    taxId: 'TIN-40992-AA',
    status: 'PENDING',
    documentUrls: { tradeLicense: 'https://example.com/tl.pdf', idCard: 'https://example.com/id.pdf' }
  });
  console.log("Inserted pending verification");
  process.exit(0);
}
run();
