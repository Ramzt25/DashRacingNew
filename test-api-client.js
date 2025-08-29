const fetch = require('node-fetch');
global.fetch = fetch;

// Import our API client
const { TestApiClient } = require('./tests/utils/api-client.ts');

async function testApiClient() {
  const apiClient = new TestApiClient();
  
  console.log('🧪 Testing API client with registration...');
  
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'testpass123',
    username: `testuser${Date.now()}`
  };
  
  const registerResponse = await apiClient.post('/api/auth/register', testUser);
  console.log('📝 Registration Response:');
  console.log('Success:', registerResponse.success);
  console.log('Status:', registerResponse.status);
  console.log('Data keys:', registerResponse.data ? Object.keys(registerResponse.data) : 'null');
  
  if (registerResponse.success && registerResponse.data) {
    console.log('User:', registerResponse.data.user ? 'Found' : 'Missing');
    console.log('Token:', registerResponse.data.token ? 'Found' : 'Missing');
    console.log('RefreshToken:', registerResponse.data.refreshToken ? 'Found' : 'Missing');
  } else {
    console.log('Error:', registerResponse.error);
  }
}

testApiClient().catch(console.error);