/**
 * Test script to verify Papertrail logging with contextual information
 * Run this to ensure all context is being sent to Papertrail
 */

require('dotenv').config();
const logger = require('./utils/logger');
const { getFullContext } = require('./utils/requestContext');

// Simulate a request object
const mockReq = {
  method: 'POST',
  path: '/api/v1/app/fuelExpenses',
  originalUrl: '/api/v1/app/fuelExpenses',
  protocol: 'https',
  ip: '192.168.1.100',
  headers: {
    'user-agent': 'Mozilla/5.0 (Test Browser)',
    'host': 'localhost:3000'
  },
  get: function(header) {
    return this.headers[header.toLowerCase()];
  },
  username: 'test_user',
  user: {
    _id: 'userId123',
    username: 'test_user',
    email: 'test@example.com',
    isAdmin: false
  },
  body: {
    truckId: 'truck456',
    addedBy: 'userId123',
    cost: 150.50,
    litres: 50,
    date: '2025-11-21'
  },
  query: {},
  params: {}
};

console.log('\n🧪 Testing Papertrail Logging with Full Context\n');
console.log('='.repeat(60));

// Test 1: Info level with full context
console.log('\n1. Testing INFO level log with full context:');
logger.info('Adding fuel expense', getFullContext(mockReq, { 
  truckId: mockReq.body.truckId,
  cost: mockReq.body.cost,
  litres: mockReq.body.litres
}));

// Test 2: Warning level
console.log('\n2. Testing WARN level log:');
logger.warn('Invalid truck ID provided', getFullContext(mockReq, { 
  truckId: 'invalid123',
  reason: 'Validation failed'
}));

// Test 3: Error level with stack trace
console.log('\n3. Testing ERROR level log with error details:');
const testError = new Error('Database connection timeout');
logger.error('Failed to add fuel expense', getFullContext(mockReq, {
  error: testError.message,
  stack: testError.stack,
  truckId: mockReq.body.truckId
}));

// Test 4: Simple log without request context
console.log('\n4. Testing simple log without request context:');
logger.info('Application started', { 
  port: 3000,
  environment: process.env.NODE_ENV || 'development'
});

console.log('\n' + '='.repeat(60));
console.log('\n✅ Test completed!');
console.log('\nIf ENABLE_PAPERTRAIL=true, check your Papertrail dashboard.');
console.log('You should see logs with all contextual information:');
console.log('  - username, userId, email');
console.log('  - ip, userAgent, method, path');
console.log('  - truckId, cost, litres, etc.');
console.log('\nPapertrail enabled:', process.env.ENABLE_PAPERTRAIL === 'true' ? '✅ YES' : '❌ NO');

if (process.env.ENABLE_PAPERTRAIL !== 'true') {
  console.log('\n⚠️  To test Papertrail integration, set:');
  console.log('   ENABLE_PAPERTRAIL=true');
  console.log('   PAPERTRAIL_HTTPS_ENDPOINT=<your-endpoint>');
  console.log('   PAPERTRAIL_TOKEN=<your-token>');
}

console.log('\n');

// Wait a bit for async logging to complete
setTimeout(() => {
  console.log('📝 Logging complete. Check console output above and Papertrail dashboard.\n');
  process.exit(0);
}, 2000);
