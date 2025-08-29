const WebSocket = require('ws');
const axios = require('axios');

const BASE_URL = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000';

class SimpleWebSocketTest {
  constructor() {
    this.authToken = null;
  }

  async authenticate() {
    try {
      console.log('🔐 Authenticating user...');
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test1@dashracingapp.com',
        password: 'password123'
      });

      if (response.data.success) {
        this.authToken = response.data.data.token;
        console.log('✅ Authentication successful');
        return true;
      } else {
        console.log('❌ Authentication failed:', response.data);
        return false;
      }
    } catch (error) {
      console.log('❌ Authentication error:', error.response?.data || error.message);
      return false;
    }
  }

  async testWebSocketConnection() {
    return new Promise((resolve) => {
      console.log('🔌 Testing WebSocket connection...');
      
      const ws = new WebSocket(WS_URL, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log('⏰ WebSocket connection timeout');
          ws.terminate();
          resolve(false);
        }
      }, 5000);

      ws.on('open', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log('✅ WebSocket connection established');
          
          // Send a test message
          ws.send(JSON.stringify({
            type: 'heartbeat',
            timestamp: Date.now()
          }));
          
          setTimeout(() => {
            ws.close();
            resolve(true);
          }, 1000);
        }
      });

      ws.on('message', (data) => {
        console.log('📨 WebSocket message received:', data.toString());
      });

      ws.on('error', (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log('❌ WebSocket error:', error.message);
          resolve(false);
        }
      });

      ws.on('close', (code, reason) => {
        console.log(`🔌 WebSocket connection closed: ${code} ${reason}`);
      });
    });
  }

  async runTests() {
    console.log('🚀 Starting WebSocket functionality test...');
    console.log('================================================');
    
    const authSuccess = await this.authenticate();
    if (!authSuccess) {
      console.log('❌ Cannot test WebSocket without authentication');
      return;
    }

    const wsSuccess = await this.testWebSocketConnection();
    
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`✅ Authentication: ${authSuccess ? 'PASSED' : 'FAILED'}`);
    console.log(`${wsSuccess ? '✅' : '❌'} WebSocket Connection: ${wsSuccess ? 'PASSED' : 'FAILED'}`);
    
    console.log(`\n🎯 WebSocket test ${wsSuccess ? 'completed successfully' : 'failed'}!`);
  }
}

// Run the test
const test = new SimpleWebSocketTest();
test.runTests().catch(console.error);