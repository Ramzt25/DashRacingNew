// Simple auth test script
const axios = require('axios');

async function testAuth() {
  console.log('🧪 Testing registration and login...');
  
  const baseURL = 'http://localhost:8000';
  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'testpass'
  };
  
  try {
    // Register
    console.log('📝 Registering user...');
    const registerResponse = await axios.post(`${baseURL}/api/auth/register`, testUser);
    console.log('📊 Register response:', JSON.stringify(registerResponse.data, null, 2));
    
    if (registerResponse.data.success) {
      // Login
      console.log('🔐 Logging in...');
      const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      console.log('📊 Login response:', JSON.stringify(loginResponse.data, null, 2));
      
      if (loginResponse.data.data && loginResponse.data.data.token) {
        console.log('✅ Authentication working! Token:', loginResponse.data.data.token.substring(0, 20) + '...');
      } else {
        console.log('❌ Token missing from login response');
      }
    } else {
      console.log('❌ Registration failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAuth();