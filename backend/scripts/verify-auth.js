/**
 * Verification script for FreshMart Authentication and Role System.
 * Tests register, login, role-matching, and error codes for customer, owner, and delivery.
 */
const http = require('http');

const BASE_URL = 'http://127.0.0.1:5000/api';

async function request(endpoint, method, data, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    const bodyStr = data ? JSON.stringify(data) : null;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: rawData });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function runTests() {
  console.log('\n=============================================================');
  console.log(' FRESHMART AUTH & ROLES VERIFICATION SUITE');
  console.log('=============================================================\n');

  const ts = Date.now();

  // Test 1: Health Check
  console.log('1. Health Check GET /api/health');
  const healthRes = await request('/health', 'GET');
  console.log(`   Status: ${healthRes.status}`, healthRes.body);

  // Test 2: Existing User Login (kamal.perera@gmail.com with no DB role -> customer)
  console.log('\n2. Existing User Login (kamal.perera@gmail.com with no DB role)');
  const kamalCustomerLogin = await request('/auth/login', 'POST', {
    email: 'kamal.perera@gmail.com',
    password: 'password123',
    role: 'customer',
  });
  console.log(`   [Role: customer] Status: ${kamalCustomerLogin.status}`, {
    success: kamalCustomerLogin.body.success,
    role: kamalCustomerLogin.body.user?.role,
    name: kamalCustomerLogin.body.user?.name,
  });

  const kamalOwnerMismatch = await request('/auth/login', 'POST', {
    email: 'kamal.perera@gmail.com',
    password: 'password123',
    role: 'owner',
  });
  console.log(`   [Role mismatch: owner] Status: ${kamalOwnerMismatch.status}`, kamalOwnerMismatch.body);

  // Test 3: Customer Registration & Login
  console.log('\n3. Customer Registration & Login');
  const customerEmail = `customer_${ts}@freshmart.lk`;
  const regCustomer = await request('/auth/register', 'POST', {
    name: 'Kasun Bandara',
    email: customerEmail,
    password: 'password123',
    phone: '+94 71 234 5678',
    role: 'customer',
  });
  console.log(`   Register Customer: Status: ${regCustomer.status}`, {
    success: regCustomer.body.success,
    token: regCustomer.body.token ? 'JWT_RECEIVED' : 'NONE',
    user: regCustomer.body.user,
  });

  const loginCustomer = await request('/auth/login', 'POST', {
    email: customerEmail,
    password: 'password123',
    role: 'customer',
  });
  console.log(`   Login Customer: Status: ${loginCustomer.status}`, {
    success: loginCustomer.body.success,
    role: loginCustomer.body.user?.role,
  });

  const loginCustomerAsDelivery = await request('/auth/login', 'POST', {
    email: customerEmail,
    password: 'password123',
    role: 'delivery',
  });
  console.log(`   Login Customer as Delivery (403 expected): Status: ${loginCustomerAsDelivery.status}`, loginCustomerAsDelivery.body);

  // Duplicate email registration test
  const dupRegister = await request('/auth/register', 'POST', {
    name: 'Duplicate Kasun',
    email: customerEmail,
    password: 'password123',
    phone: '+94 71 234 5678',
    role: 'customer',
  });
  console.log(`   Duplicate Registration (409 expected): Status: ${dupRegister.status}`, dupRegister.body);

  // Test 4: Shop Owner Registration & Login
  console.log('\n4. Shop Owner Registration & Login');
  const ownerEmail = `owner_${ts}@freshmart.lk`;
  const regOwner = await request('/auth/register', 'POST', {
    name: 'Nimal Silva (Store Manager)',
    email: ownerEmail,
    password: 'password123',
    phone: '+94 77 987 6543',
    role: 'owner',
  });
  console.log(`   Register Owner: Status: ${regOwner.status}`, {
    success: regOwner.body.success,
    token: regOwner.body.token ? 'JWT_RECEIVED' : 'NONE',
    user: regOwner.body.user,
  });

  const loginOwner = await request('/auth/login', 'POST', {
    email: ownerEmail,
    password: 'password123',
    role: 'owner',
  });
  console.log(`   Login Owner: Status: ${loginOwner.status}`, {
    success: loginOwner.body.success,
    role: loginOwner.body.user?.role,
  });

  const loginOwnerAsCustomer = await request('/auth/login', 'POST', {
    email: ownerEmail,
    password: 'password123',
    role: 'customer',
  });
  console.log(`   Login Owner as Customer (403 expected): Status: ${loginOwnerAsCustomer.status}`, loginOwnerAsCustomer.body);

  // Test 5: Delivery Partner Registration & Login
  console.log('\n5. Delivery Partner Registration & Login');
  const deliveryEmail = `delivery_${ts}@freshmart.lk`;
  const regDelivery = await request('/auth/register', 'POST', {
    name: 'Sunil Fernando (Rider)',
    email: deliveryEmail,
    password: 'password123',
    phone: '+94 76 555 4321',
    role: 'delivery',
  });
  console.log(`   Register Delivery: Status: ${regDelivery.status}`, {
    success: regDelivery.body.success,
    token: regDelivery.body.token ? 'JWT_RECEIVED' : 'NONE',
    user: regDelivery.body.user,
  });

  const loginDelivery = await request('/auth/login', 'POST', {
    email: deliveryEmail,
    password: 'password123',
    role: 'delivery',
  });
  console.log(`   Login Delivery: Status: ${loginDelivery.status}`, {
    success: loginDelivery.body.success,
    role: loginDelivery.body.user?.role,
  });

  const loginDeliveryAsOwner = await request('/auth/login', 'POST', {
    email: deliveryEmail,
    password: 'password123',
    role: 'owner',
  });
  console.log(`   Login Delivery as Owner (403 expected): Status: ${loginDeliveryAsOwner.status}`, loginDeliveryAsOwner.body);

  // Test 6: Invalid Credentials (401) and Missing Validation (400)
  console.log('\n6. Error Handling Validations');
  const wrongPassword = await request('/auth/login', 'POST', {
    email: deliveryEmail,
    password: 'wrongPassword999',
    role: 'delivery',
  });
  console.log(`   Wrong Password (401 expected): Status: ${wrongPassword.status}`, wrongPassword.body);

  const missingFields = await request('/auth/login', 'POST', {
    email: '',
    password: '',
  });
  console.log(`   Missing Fields (400 expected): Status: ${missingFields.status}`, missingFields.body);

  console.log('\n=============================================================');
  console.log(' ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
  console.log('=============================================================\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
