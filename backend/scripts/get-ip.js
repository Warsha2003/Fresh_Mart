/**
 * Helper script to find and display the laptop's current local Wi-Fi IPv4 address.
 * Run via: npm run ip (from backend/ directory) or node scripts/get-ip.js
 */
const os = require('os');

const interfaces = os.networkInterfaces();
let wifiIp = null;
const allIps = [];

for (const [name, addrs] of Object.entries(interfaces)) {
  for (const addr of addrs) {
    if (addr.family === 'IPv4' && !addr.internal) {
      allIps.push({ name, address: addr.address });
      // Identify Wi-Fi / WLAN adapters (excluding VMware, VirtualBox, vEthernet)
      if (/wi-fi|wlan|wireless/i.test(name) && !wifiIp) {
        wifiIp = addr.address;
      }
    }
  }
}

// Fallback to the first non-internal IPv4 if no explicit Wi-Fi adapter name matched
const chosenIp = wifiIp || (allIps.length > 0 ? allIps[0].address : '127.0.0.1');

console.log('\n======================================================');
console.log(` FreshMart Network Helper`);
console.log(` Detected Wi-Fi IPv4: \x1b[32m${chosenIp}\x1b[0m`);
console.log('======================================================');
console.log('Ensure frontend/.env has:');
console.log(`\x1b[36mEXPO_PUBLIC_API_URL=http://${chosenIp}:5000/api\x1b[0m`);
console.log('======================================================\n');

if (allIps.length > 1) {
  console.log('All active network interfaces detected:');
  allIps.forEach((item) => {
    const isChosen = item.address === chosenIp ? ' (selected)' : '';
    console.log(`  - ${item.name}: ${item.address}${isChosen}`);
  });
  console.log('');
}
