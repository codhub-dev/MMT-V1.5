const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

const endpoints = [
  '/api/v1/app/auth/login',
  '/api/v1/app/auth/signin',
  '/api/v1/app/auth/register',
  '/api/v1/app/auth/signup',
  '/api/v1/app/health',
];

async function testEndpoints() {
  console.log('Testing backend endpoints...\n');
  console.log('─'.repeat(60));

  for (const endpoint of endpoints) {
    try {
      const response = await axios.post(`${BASE_URL}${endpoint}`, {
        username: 'test',
        password: 'test'
      }, {
        validateStatus: () => true // Accept any status code
      });

      const status = response.status;
      const statusIcon = status === 404 ? '✗' : '✓';
      const statusText = status === 404 ? 'NOT FOUND' : `EXISTS (${status})`;
      
      console.log(`${statusIcon} ${endpoint.padEnd(40)} ${statusText}`);
    } catch (error) {
      console.log(`✗ ${endpoint.padEnd(40)} ERROR: ${error.message}`);
    }
  }

  console.log('─'.repeat(60));
  console.log('\n✓ = Endpoint exists (any status except 404)');
  console.log('✗ = Endpoint not found (404)');
  console.log('\nNote: A 400 or 401 status means the endpoint exists but');
  console.log('      rejected the test credentials (which is expected).\n');
}

testEndpoints();
