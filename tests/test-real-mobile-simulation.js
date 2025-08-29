/**
 * Real Mobile App Simulation Test
 * This test simulates exactly what the mobile app would do
 * when connecting to the backend server
 */

const fetch = require('node-fetch');

// Configuration that matches what mobile app would use
const API_BASE_URL = 'http://localhost:8000';
const TEST_USER = {
  email: 'test1@dashracingapp.com',
  password: 'password123'
};

class RealAppSimulation {
  constructor() {
    this.authToken = null;
    this.testResults = {};
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
        ...options.headers
      };

      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      return {
        success: response.ok,
        status: response.status,
        data: data,
        error: response.ok ? null : (data.message || data.error || 'Request failed')
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async testHealthCheck() {
    console.log('🏥 Testing backend health check...');
    const result = await this.makeRequest('/health');
    
    if (result.success) {
      console.log('✅ Backend is healthy:', result.data);
      this.testResults.health = true;
    } else {
      console.log('❌ Backend health check failed:', result.error);
      this.testResults.health = false;
    }
    return result.success;
  }

  async testUserLogin() {
    console.log('🔐 Testing user login...');
    const result = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(TEST_USER)
    });

    if (result.success && result.data.success) {
      console.log('✅ Login successful');
      console.log('👤 User:', result.data.data.username);
      console.log('🔑 Token received:', !!result.data.data.token);
      
      this.authToken = result.data.data.token;
      this.testResults.login = true;
      return true;
    } else {
      console.log('❌ Login failed:', result.error || result.data?.message);
      this.testResults.login = false;
      return false;
    }
  }

  async testProtectedEndpoint() {
    console.log('🛡️ Testing protected endpoint (user profile)...');
    const result = await this.makeRequest('/api/users/profile');

    if (result.success) {
      console.log('✅ Protected endpoint accessible');
      console.log('📊 User profile:', {
        username: result.data.data?.username,
        email: result.data.data?.email,
        isPro: result.data.data?.isPro
      });
      this.testResults.protected = true;
      return true;
    } else {
      console.log('❌ Protected endpoint failed:', result.error);
      this.testResults.protected = false;
      return false;
    }
  }

  async testVehiclesEndpoint() {
    console.log('🚗 Testing vehicles endpoint...');
    const result = await this.makeRequest('/api/vehicles');

    if (result.success) {
      console.log('✅ Vehicles endpoint working');
      console.log('🚗 Vehicle count:', result.data.data?.vehicles?.length || 0);
      this.testResults.vehicles = true;
      return true;
    } else {
      console.log('❌ Vehicles endpoint failed:', result.error);
      this.testResults.vehicles = false;
      return false;
    }
  }

  async testRacesEndpoint() {
    console.log('🏁 Testing races endpoint...');
    const result = await this.makeRequest('/api/races');

    if (result.success) {
      console.log('✅ Races endpoint working');
      const raceCount = result.data.data?.races?.length || 0;
      console.log('🏁 Race count:', raceCount);
      
      if (raceCount > 0) {
        const sampleRace = result.data.data.races[0];
        console.log('📊 Sample race:', {
          id: sampleRace.id,
          type: sampleRace.type,
          status: sampleRace.status
        });
      }
      
      this.testResults.races = true;
      return true;
    } else {
      console.log('❌ Races endpoint failed:', result.error);
      this.testResults.races = false;
      return false;
    }
  }

  async testFriendsEndpoint() {
    console.log('👫 Testing friends endpoint...');
    const result = await this.makeRequest('/api/friends');

    if (result.success) {
      console.log('✅ Friends endpoint working');
      console.log('👫 Friends count:', result.data.length || 0);
      this.testResults.friends = true;
      return true;
    } else {
      console.log('❌ Friends endpoint failed:', result.error);
      this.testResults.friends = false;
      return false;
    }
  }

  async runCompleteSimulation() {
    console.log('🚀 Starting Real Mobile App Simulation...');
    console.log('This test simulates the EXACT requests the mobile app will make\n');

    // Test 1: Health Check
    const healthOK = await this.testHealthCheck();
    if (!healthOK) {
      console.log('\n❌ CRITICAL: Backend server not accessible');
      return this.generateReport();
    }

    // Test 2: User Authentication
    const loginOK = await this.testUserLogin();
    if (!loginOK) {
      console.log('\n❌ CRITICAL: User authentication not working');
      return this.generateReport();
    }

    // Test 3: Protected Endpoints (what the app needs after login)
    await this.testProtectedEndpoint();
    await this.testVehiclesEndpoint();
    await this.testRacesEndpoint();
    await this.testFriendsEndpoint();

    return this.generateReport();
  }

  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📱 REAL MOBILE APP SIMULATION REPORT');
    console.log('='.repeat(70));
    
    const tests = [
      { name: 'Backend Health', key: 'health', critical: true },
      { name: 'User Login', key: 'login', critical: true },
      { name: 'Protected Routes', key: 'protected', critical: true },
      { name: 'Vehicles API', key: 'vehicles', critical: false },
      { name: 'Races API', key: 'races', critical: false },
      { name: 'Friends API', key: 'friends', critical: false },
    ];

    let passed = 0;
    let criticalPassed = 0;
    let criticalTotal = 0;

    tests.forEach(test => {
      const success = this.testResults[test.key];
      const status = success ? '✅ PASSED' : '❌ FAILED';
      const criticality = test.critical ? ' (CRITICAL)' : '';
      
      console.log(`${status} ${test.name}${criticality}`);
      
      if (success) passed++;
      if (test.critical) {
        criticalTotal++;
        if (success) criticalPassed++;
      }
    });

    console.log('\n' + '-'.repeat(70));
    console.log(`🎯 OVERALL: ${passed}/${tests.length} tests passed`);
    console.log(`🚨 CRITICAL: ${criticalPassed}/${criticalTotal} critical tests passed`);
    
    const isReady = criticalPassed === criticalTotal;
    
    if (isReady) {
      console.log('\n🎉 MOBILE APP IS READY!');
      console.log('✅ The mobile app will successfully connect to and work with the backend.');
      console.log('✅ All critical functionality is operational.');
      console.log('📱 You can proceed with confidence to build the APK.');
    } else {
      console.log('\n⚠️  MOBILE APP NOT READY!');
      console.log('❌ Critical functionality is broken.');
      console.log('🔧 Fix the failed critical tests before building APK.');
      
      if (!this.testResults.health) {
        console.log('💡 Suggestion: Restart the backend server');
      }
      if (!this.testResults.login) {
        console.log('💡 Suggestion: Check authentication configuration');
      }
    }
    
    console.log('\n' + '='.repeat(70));
    
    return {
      ready: isReady,
      passed,
      total: tests.length,
      criticalPassed,
      criticalTotal,
      results: this.testResults
    };
  }
}

// Run the simulation
console.log('🎯 This test verifies that the mobile app can actually work with the backend');
console.log('🔍 Testing the real API endpoints that the mobile app will use\n');

const simulation = new RealAppSimulation();
simulation.runCompleteSimulation()
  .then(report => {
    process.exit(report.ready ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  });