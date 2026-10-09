/**
 * Database Configuration
 * Connects to MongoDB Atlas using Mongoose.
 * Features automatic DNS fallback (Google/Cloudflare DNS) and reconnect resilience.
 */
const mongoose = require('mongoose');
const dns = require('dns');

// 1. Configure reliable public DNS servers for SRV record resolution
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore
}

// 2. Patch dns.lookup so socket connections fallback to public DNS if local Windows router DNS fails
const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  originalLookup(hostname, options, (err, address, family) => {
    if (err && (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN')) {
      return dns.resolve4(hostname, (resErr, addresses) => {
        if (!resErr && addresses && addresses.length > 0) {
          if (options && options.all) {
            return callback(null, addresses.map((a) => ({ address: a, family: 4 })));
          }
          return callback(null, addresses[0], 4);
        }
        return callback(err, address, family);
      });
    }
    return callback(err, address, family);
  });
};

const connectDB = async (retryCount = 0) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    console.log(`[MongoDB] Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB Error] Connection failed: ${error.message}`);
    const nextRetry = Math.min(1000 * Math.pow(2, retryCount), 10000);
    console.log(`[MongoDB] Retrying connection in ${nextRetry / 1000}s...`);
    setTimeout(() => connectDB(retryCount + 1), nextRetry);
  }
};

module.exports = connectDB;
