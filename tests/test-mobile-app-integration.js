const axios = require('axios');

// Simulate the mobile app's apiService
class MobileApiService {
  constructor() {
    this.baseURL = 'http://localhost:8000';
    this.authToken = null;
  }

  async makeRequest(method, url, data = null) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await axios({
        method,
        url: `${this.baseURL}${url}`,
        data,
        headers,
        timeout: 10000,
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error(`API Error (${method} ${url}):`, error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  async login(email, password) {
    const response = await this.makeRequest('POST', '/api/auth/login', { email, password });
    if (response.success && response.data.data.token) {
      this.authToken = response.data.data.token;
    }
    return response;
  }

  async register(email, password, username) {
    return this.makeRequest('POST', '/api/auth/register', { email, password, username });
  }

  async logout() {
    const response = await this.makeRequest('POST', '/api/auth/logout');
    this.authToken = null;
    return response;
  }

  async verifyToken() {
    return this.makeRequest('GET', '/api/auth/verify');
  }

  async getUserProfile() {
    return this.makeRequest('GET', '/api/users/profile');
  }

  async updateUserProfile(updates) {
    return this.makeRequest('PUT', '/api/users/profile', updates);
  }

  async getUserVehicles() {
    return this.makeRequest('GET', '/api/vehicles');
  }

  async createVehicle(vehicle) {
    return this.makeRequest('POST', '/api/vehicles', vehicle);
  }

  async deleteVehicle(vehicleId) {
    return this.makeRequest('DELETE', `/api/vehicles/${vehicleId}`);
  }

  async getRaces() {
    return this.makeRequest('GET', '/api/races');
  }

  async joinRace(raceId, vehicleId) {
    return this.makeRequest('POST', `/api/races/${raceId}/join`, { vehicleId });
  }

  async leaveRace(raceId) {
    return this.makeRequest('POST', `/api/races/${raceId}/leave`);
  }
}

// Test the full mobile app workflow
async function testMobileAppIntegration() {
  console.log('🚀 Testing Mobile App Integration with Backend');
  console.log('This test simulates the exact mobile app workflow after our fixes');
  console.log('================================================\n');

  const apiService = new MobileApiService();
  let testsPassed = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`✅ ${testName}`);
      testsPassed++;
    } else {
      console.log(`❌ ${testName}`);
    }
  }

  try {
    // Test 1: Login with existing user
    console.log('1️⃣ Testing User Login...');
    const loginResponse = await apiService.login('test1@dashracingapp.com', 'password');
    assert(loginResponse.success, 'User login successful');
    assert(loginResponse.data?.data?.token, 'Auth token received');
    
    if (loginResponse.success) {
      console.log(`   👤 Logged in as: ${loginResponse.data.data.username}`);
      console.log(`   🔑 Token received: ${loginResponse.data.data.token ? 'Yes' : 'No'}`);
    }

    // Test 2: Verify token
    console.log('\n2️⃣ Testing Token Verification...');
    const verifyResponse = await apiService.verifyToken();
    assert(verifyResponse.success, 'Token verification successful');

    // Test 3: Get user profile
    console.log('\n3️⃣ Testing User Profile...');
    const profileResponse = await apiService.getUserProfile();
    assert(profileResponse.success, 'User profile retrieved');
    assert(profileResponse.data?.data?.username, 'Profile has username');
    
    if (profileResponse.success) {
      console.log(`   📊 Profile: ${profileResponse.data.data.username} (${profileResponse.data.data.email})`);
      console.log(`   🏆 Pro status: ${profileResponse.data.data.isPro ? 'Yes' : 'No'}`);
    }

    // Test 4: Get user vehicles
    console.log('\n4️⃣ Testing Vehicle Management...');
    const vehiclesResponse = await apiService.getUserVehicles();
    assert(vehiclesResponse.success, 'Vehicles retrieved');
    assert(Array.isArray(vehiclesResponse.data?.data?.vehicles), 'Vehicles is array');
    
    console.log(`   🚗 Vehicles: ${vehiclesResponse.data?.data?.vehicles?.length || 0}`);

    // Test 5: Get races
    console.log('\n5️⃣ Testing Race Data...');
    const racesResponse = await apiService.getRaces();
    assert(racesResponse.success, 'Races retrieved');
    assert(Array.isArray(racesResponse.data?.data?.races), 'Races is array');
    
    console.log(`   🏁 Available races: ${racesResponse.data?.data?.races?.length || 0}`);

    // Test 6: Test protected endpoint without token
    console.log('\n6️⃣ Testing Auth Protection...');
    const tempService = new MobileApiService();
    const unauthedResponse = await tempService.getUserProfile();
    assert(!unauthedResponse.success, 'Unauthenticated request blocked');

    // Test 7: Logout
    console.log('\n7️⃣ Testing Logout...');
    const logoutResponse = await apiService.logout();
    assert(logoutResponse.success, 'Logout successful');

    // Test 8: Try accessing protected resource after logout
    console.log('\n8️⃣ Testing Post-logout Auth...');
    const postLogoutResponse = await apiService.getUserProfile();
    assert(!postLogoutResponse.success, 'Protected resource blocked after logout');

    console.log('\n======================================================================');
    console.log('📱 MOBILE APP INTEGRATION TEST RESULTS');
    console.log('======================================================================');
    console.log(`✅ Tests Passed: ${testsPassed}/${totalTests}`);
    console.log(`❌ Tests Failed: ${totalTests - testsPassed}/${totalTests}`);
    
    if (testsPassed === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('✅ The mobile app will successfully work with the backend');
      console.log('✅ Authentication flow is working correctly');
      console.log('✅ Protected routes are properly secured');
      console.log('✅ All API endpoints are accessible with valid tokens');
      console.log('\n📱 MOBILE APP IS READY FOR APK BUILD!');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED');
      console.log('❌ The mobile app may not work correctly');
      console.log('🔧 Please fix the failing tests before building APK');
    }

    console.log('======================================================================');

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run the test
testMobileAppIntegration();