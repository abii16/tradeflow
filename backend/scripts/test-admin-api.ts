import { AuthService } from '../src/auth/auth.service';
import { db } from '../src/db';
import { users } from '../src/db/schema/users';
import { eq } from 'drizzle-orm';
import axios from 'axios';

async function testAdminApi() {
  try {
    // 1. Find the admin user
    const [adminUser] = await db.select().from(users).where(eq(users.email, 'obama@gmail.com'));
    if (!adminUser) {
      console.log('Admin user not found in DB!');
      process.exit(1);
    }

    // 2. Generate a token bypassing login password check for testing
    const authService = new AuthService();
    // A bit hacky: we can just sign a token directly since we have the secret
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET || 'super-secret-jwt-key-for-tradeflow-dev-only',
      { expiresIn: '1h' }
    );

    console.log('Generated token for admin:', adminUser.email);

    // 3. Call the API
    console.log('Calling GET /admin/verifications/pending...');
    const response = await axios.get('http://localhost:4001/admin/verifications/pending', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    process.exit(0);
  } catch (error: any) {
    console.error('API Call Failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testAdminApi();
