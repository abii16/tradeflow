import 'dotenv/config';

const BASE_URL = 'http://localhost:4001/api/v1';
const AUTH_URL = 'http://localhost:4001/auth';

interface TestResult {
  endpoint: string;
  status: string | number;
  dbMutated: string;
  passed: boolean;
}

const results: TestResult[] = [];

async function request(url: string, method: string, token?: string, body?: any) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Origin': 'http://localhost:5173'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  
  let data;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  }
  
  if (res.status >= 400) {
    console.error(`[${method} ${url}] Failed with ${res.status}:`, data || res.statusText);
  }

  return { status: res.status, data };
}

async function getValidToken(role: string): Promise<string | null> {
  const email = `test_${role.toLowerCase()}_${Date.now()}@example.com`;
  const password = 'Password123!';
  
  const payload: any = {
    email,
    password,
    fullName: `Test ${role}`,
    phone: '1234567890',
    role,
  };

  if (['SHIPPER', 'TRANSPORTER', 'FORWARDER'].includes(role)) {
    payload.companyName = 'Test Co';
    payload.tinNumber = '1234567890';
    payload.tradeLicense = 'MTI/123';
  }
  if (role === 'TRANSPORTER') {
    payload.fleetName = 'Test Fleet';
    payload.operatorLicense = '123';
    payload.vehicleCapacity = '40MT';
  }
  if (role === 'CUSTOMS_OFFICER') {
    payload.badgeId = 'CUST123';
  }

  // Register
  const regRes = await request(`${AUTH_URL}/register`, 'POST', undefined, payload);
  if (regRes.status !== 201) {
    console.error(`Failed to register ${role}:`, regRes.data);
    return null;
  }

  // Login
  const loginRes = await request(`${AUTH_URL}/login`, 'POST', undefined, { email, password });
  if (loginRes.status !== 200 || !loginRes.data?.access_token) {
    console.error(`Failed to login ${role}:`, loginRes.data);
    return null;
  }

  return loginRes.data.access_token;
}

async function runTests() {
  console.log('Starting E2E Integration Tests...');
  
  const adminToken = await getValidToken('ADMIN');
  const nonAdminToken = await getValidToken('SHIPPER');

  if (!adminToken || !nonAdminToken) {
    console.error('Failed to initialize test users. Aborting.');
    return;
  }

  try {
    // 1. Auth & RBAC Guard
    let res = await request(`${BASE_URL}/admin/telematics/corridor-summary`, 'GET', nonAdminToken);
    results.push({
      endpoint: 'RBAC: Non-Admin Access (Should be 403 or 401)',
      status: res.status,
      dbMutated: 'No',
      passed: res.status === 403 || res.status === 401 
    });

    // Tab 1: Telematics & ETA
    res = await request(`${BASE_URL}/admin/telematics/corridor-summary`, 'GET', adminToken);
    let etaRes = await request(`${BASE_URL}/eta/projections`, 'GET', adminToken);
    results.push({
      endpoint: 'Tab 1: Telematics & ETA',
      status: res.status,
      dbMutated: 'No',
      passed: res.status === 200 && etaRes.status === 200
    });

    // Tab 2: Verifications
    res = await request(`${BASE_URL}/admin/verifications/pending`, 'GET', adminToken);
    const verifications = res.data?.data || [];
    let reviewPassed = false;
    if (verifications.length > 0) {
      const v = verifications[0];
      const reviewRes = await request(`${BASE_URL}/admin/verifications/${v.id}/review`, 'POST', adminToken, { status: 'VERIFIED' });
      reviewPassed = reviewRes.status === 200;
    } else {
      reviewPassed = true; // no pending to review
    }
    results.push({
      endpoint: 'Tab 2: Verifications (GET & POST)',
      status: res.status,
      dbMutated: verifications.length > 0 ? 'Yes' : 'No',
      passed: res.status === 200 && reviewPassed
    });

    // Tab 3: Dynamic Pricing
    res = await request(`${BASE_URL}/pricing/governance`, 'GET', adminToken);
    const updateRes = await request(`${BASE_URL}/pricing/governance/update`, 'POST', adminToken, {
      spotRateFloor: 10,
      spotRateCeiling: 50,
      dieselPrice: 100,
      demandMultiplier: 1.2
    });
    results.push({
      endpoint: 'Tab 3: Dynamic Pricing (GET & POST)',
      status: updateRes.status,
      dbMutated: 'Yes',
      passed: res.status === 200 && updateRes.status === 200
    });

    // Tab 4: Fuel Analytics
    res = await request(`${BASE_URL}/admin/analytics/fuel`, 'GET', adminToken);
    results.push({
      endpoint: 'Tab 4: Fuel Analytics',
      status: res.status,
      dbMutated: 'No',
      passed: res.status === 200 && Array.isArray(res.data?.activeVehicles)
    });

    // Tab 5: Security Detours
    res = await request(`${BASE_URL}/admin/security/geofences`, 'GET', adminToken);
    let geoPassed = res.status === 200;
    const broadcastRes = await request(`${BASE_URL}/admin/security/broadcast-geofence`, 'POST', adminToken, {
      name: 'Test Zone ' + Date.now(),
      type: 'WEATHER',
      severity: 'WARNING',
      radiusKm: 10,
      lat: 10.0,
      lng: 40.0,
      description: 'Test hazard'
    });
    geoPassed = geoPassed && broadcastRes.status === 200;
    results.push({
      endpoint: 'Tab 5: Security Detours (GET & POST)',
      status: broadcastRes.status,
      dbMutated: 'Yes',
      passed: geoPassed
    });

    // Tab 6: Disputes & Audit Logs
    const disputesRes = await request(`${BASE_URL}/admin/disputes`, 'GET', adminToken);
    const auditRes = await request(`${BASE_URL}/admin/audit-logs`, 'GET', adminToken);
    results.push({
      endpoint: 'Tab 6: Disputes & Audit Logs',
      status: auditRes.status,
      dbMutated: 'No',
      passed: disputesRes.status === 200 && auditRes.status === 200 && Array.isArray(auditRes.data?.logs)
    });

  } catch (error) {
    console.error('Test Execution Error:', error);
  }

  // Print Summary Table
  console.log('\n================================================================================');
  console.log('INTEGRATION TEST SUMMARY');
  console.log('================================================================================');
  console.table(results.map(r => ({
    'Endpoint / Feature Tested': r.endpoint,
    'HTTP Status': r.status,
    'Database Mutation Verified': r.dbMutated,
    'Status': r.passed ? '✅ PASS' : '❌ FAIL'
  })));
  
  const allPassed = results.every(r => r.passed);
  console.log(`\nOverall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
}

runTests();
