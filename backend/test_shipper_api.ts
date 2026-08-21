const BASE_URL = 'http://localhost:4001/api/v1';

async function request(url: string, method: string, token?: string, body?: any) {
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }
  return { status: res.status, data };
}

async function testShipperApi() {
  console.log('--- Starting Shipper API Test ---');

  // 1. Register a new Shipper
  const shipperPayload = {
    email: `shipper_${Date.now()}@test.com`,
    password: 'Password123!',
    role: 'SHIPPER',
    fullName: 'Test Shipper API',
    phone: '+251911000000',
    companyName: 'Shipper API Test Co',
    tinNumber: '1234567890',
    tradeLicense: 'MTI/123'
  };

  console.log('1. Registering Shipper...');
  const regRes = await request(`http://localhost:4001/auth/register`, 'POST', undefined, shipperPayload);
  
  const loginRes = await request(`http://localhost:4001/auth/login`, 'POST', undefined, { email: shipperPayload.email, password: shipperPayload.password });
  if (loginRes.status !== 200 || !loginRes.data?.access_token) {
    console.error(`Failed to login SHIPPER:`, loginRes.data);
    return;
  }
  const token = loginRes.data.access_token;
  console.log('   Registration successful. Token:', token ? 'Acquired' : 'Missing');

  // 2. Post a Load
  console.log('\n2. Posting a Load...');
  const loadPayload = {
    title: 'Freight: Construction Rebar',
    description: 'Deliver from Djibouti to Modjo',
    origin: { address: 'Djibouti Container Terminal', city: 'Djibouti' },
    destination: { address: 'Modjo Dry Port, Ethiopia', city: 'Modjo' },
    weightKg: 32000,
    cargoType: '30T Construction Rebar (Flatbed)',
    budgetAmount: 348000,
    currency: 'ETB',
    expiryHours: 24
  };

  const postRes = await request(`${BASE_URL}/loads`, 'POST', token, loadPayload);
  console.log('   Post Load Status:', postRes.status);
  if (postRes.status !== 201) {
    console.error('   Failed to post load:', postRes.data);
    return;
  }
  console.log('   Load Created:', postRes.data.load?.id);

  // 3. Fetch Shipper Loads
  console.log('\n3. Fetching Shipper Loads (/shipper/loads)...');
  const getRes = await request(`${BASE_URL}/shipper/loads`, 'GET', token);
  console.log('   Fetch Loads Status:', getRes.status);
  
  if (getRes.status === 200) {
    console.log('   Success! Found loads:', getRes.data.loads?.length);
    if (getRes.data.loads?.length > 0) {
       console.log('   Sample load data:', JSON.stringify(getRes.data.loads[0], null, 2));
    }
  } else {
    console.error('   Failed to fetch loads:', getRes.data);
  }

  console.log('\n--- Test Completed ---');
}

testShipperApi().catch(console.error);
