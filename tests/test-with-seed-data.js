const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8000';
const TEST_USERS = [
  { email: 'test1@dashracingapp.com', username: 'speedracer', isPro: true },
  { email: 'test2@dashracingapp.com', username: 'streetking', isPro: false },
  { email: 'test3@dashracingapp.com', username: 'trackmaster', isPro: true },
  { email: 'test4@dashracingapp.com', username: 'weekendwarrior', isPro: false },
  { email: 'test5@dashracingapp.com', username: 'newbie', isPro: false }
];

class DashRacingTestClient {
  constructor() {
    this.tokens = {};
  }

  async login(email, password = 'password123') {
    try {
      console.log(`🔐 Logging in as ${email}...`);
      
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        this.tokens[email] = response.data.data.token;
        console.log(`✅ Login successful for ${response.data.data.username}`);
        return {
          success: true,
          data: response.data.data,
          token: response.data.data.token
        };
      } else {
        console.log(`❌ Login failed:`, response.data);
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.log(`❌ Login error:`, error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async testHealthCheck() {
    try {
      console.log('🏥 Testing health check endpoint...');
      const response = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Health check response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.log('❌ Health check failed:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  async testApiInfo() {
    try {
      console.log('ℹ️  Testing API info endpoint...');
      const response = await axios.get(`${BASE_URL}/info`);
      console.log('✅ API info response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.log('❌ API info failed:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  async testUserProfile(email) {
    try {
      const token = this.tokens[email];
      if (!token) {
        throw new Error('No token available. Please login first.');
      }

      console.log('👤 Testing user profile endpoint...');
      const response = await axios.get(`${BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ User profile response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.log('❌ User profile failed:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  async testVehicles(email) {
    try {
      const token = this.tokens[email];
      if (!token) {
        throw new Error('No token available. Please login first.');
      }

      console.log('🚗 Testing vehicles endpoint...');
      const response = await axios.get(`${BASE_URL}/api/vehicles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Vehicles response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.log('❌ Vehicles failed:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  async testRaces(email) {
    try {
      const token = this.tokens[email];
      if (!token) {
        throw new Error('No token available. Please login first.');
      }

      console.log('🏁 Testing races endpoint...');
      const response = await axios.get(`${BASE_URL}/api/races`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Races response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.log('❌ Races failed:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  async testFriends(email) {
    try {
      const token = this.tokens[email];
      if (!token) {
        throw new Error('No token available. Please login first.');
      }

      console.log('👫 Testing friends endpoint...');
      const response = await axios.get(`${BASE_URL}/api/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Friends response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.log('❌ Friends failed:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  async runComprehensiveTest() {
    console.log('🚀 Starting comprehensive DASH Racing API test...');
    console.log('================================================');
    
    const results = {
      health: null,
      apiInfo: null,
      login: null,
      userProfile: null,
      vehicles: null,
      races: null,
      friends: null
    };

    // Test health and info endpoints (no auth required)
    results.health = await this.testHealthCheck();
    results.apiInfo = await this.testApiInfo();

    // Test with first user (speedracer)
    const testUser = TEST_USERS[0];
    console.log(`\n🎯 Testing with user: ${testUser.email} (${testUser.username})`);
    
    results.login = await this.login(testUser.email);
    
    if (results.login.success) {
      results.userProfile = await this.testUserProfile(testUser.email);
      results.vehicles = await this.testVehicles(testUser.email);
      results.races = await this.testRaces(testUser.email);
      results.friends = await this.testFriends(testUser.email);
    }

    // Print summary
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    
    const testCounts = {
      passed: 0,
      failed: 0,
      total: 0
    };

    Object.entries(results).forEach(([test, result]) => {
      testCounts.total++;
      if (result?.success) {
        console.log(`✅ ${test}: PASSED`);
        testCounts.passed++;
      } else {
        console.log(`❌ ${test}: FAILED - ${result?.error || 'Unknown error'}`);
        testCounts.failed++;
      }
    });

    console.log(`\n🎯 Results: ${testCounts.passed}/${testCounts.total} tests passed`);
    
    if (testCounts.passed === testCounts.total) {
      console.log('🎉 ALL TESTS PASSED! The DASH Racing API is working perfectly!');
    } else {
      console.log(`⚠️  ${testCounts.failed} tests failed. Check the logs above for details.`);
    }

    return results;
  }
}

// Run the test
async function main() {
  const testClient = new DashRacingTestClient();
  await testClient.runComprehensiveTest();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DashRacingTestClient;