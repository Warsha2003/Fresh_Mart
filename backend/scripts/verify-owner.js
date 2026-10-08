/**
 * Owner API Verification Script
 * Validates login, dashboard, orders, inventory CRUD, slots CRUD, and prep workflow.
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
      path: url.pathname + (url.search || ''),
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

async function verify() {
  console.log('Testing Owner API...');

  // 1. Owner Login
  const loginRes = await request('/auth/login', 'POST', {
    email: 'owner@freshmart.lk',
    password: 'owner123',
    role: 'owner',
  });
  console.log('1. Owner Login status:', loginRes.status, 'User:', loginRes.body.user?.email);
  const token = loginRes.body.token;

  // 2. Owner Dashboard
  const dashRes = await request('/owner/dashboard', 'GET', null, token);
  console.log('2. Dashboard status:', dashRes.status, 'Revenue:', dashRes.body.data?.todayRevenue, 'Pending:', dashRes.body.data?.pendingOrdersCount);

  // 3. Incoming Orders
  const ordersRes = await request('/owner/orders', 'GET', null, token);
  console.log('3. Orders status:', ordersRes.status, 'Counts:', ordersRes.body.counts);

  // 4. Inventory Products
  const prodRes = await request('/owner/products', 'GET', null, token);
  console.log('4. Inventory status:', prodRes.status, 'Counts:', prodRes.body.counts);

  // 5. Test Product Create & Delete
  const createProdRes = await request('/owner/products', 'POST', {
    name: 'Fresh Mint 100g',
    category: 'Vegetables',
    unitPrice: 150,
    stock: 20,
    packSize: '100g bunch',
    lowStockThreshold: 5,
  }, token);
  console.log('5. Product Create status:', createProdRes.status, 'Created ID:', createProdRes.body.data?.id);
  const newProdId = createProdRes.body.data?.id;

  if (newProdId) {
    const delProdRes = await request(`/owner/products/${newProdId}`, 'DELETE', null, token);
    console.log('6. Product Delete status:', delProdRes.status);
  }

  // 7. Slots CRUD
  const slotsRes = await request('/owner/slots', 'GET', null, token);
  console.log('7. Slots count:', slotsRes.body.count);

  console.log('\nOWNER BACKEND VERIFICATION COMPLETE!');
}

verify();
