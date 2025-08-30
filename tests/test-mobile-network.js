#!/usr/bin/env node

// Test Mobile Network Functionality
// This script validates that the mobile app can communicate with the backend over WiFi without cable connection

const path = require('path');
const fs = require('fs');

console.log('🧪 DASH Racing - Mobile Network Function Test');
console.log('===============================================\n');

// Test 1: Environment Configuration
console.log('1. Testing environment configuration...');
const mobileEnvPath = path.join(__dirname, '../mobile/.env');
const backendEnvPath = path.join(__dirname, '../backend/.env');

if (!fs.existsSync(mobileEnvPath)) {
  console.error('❌ Mobile .env file not found');
  process.exit(1);
}

if (!fs.existsSync(backendEnvPath)) {
  console.error('❌ Backend .env file not found');
  process.exit(1);
}

const mobileEnv = fs.readFileSync(mobileEnvPath, 'utf8');
const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');

// Extract API URLs
const mobileApiMatch = mobileEnv.match(/API_BASE_URL=(.+)/);
const mobileWsMatch = mobileEnv.match(/WS_URL=(.+)/);

if (!mobileApiMatch || !mobileWsMatch) {
  console.error('❌ Mobile environment missing API_BASE_URL or WS_URL');
  process.exit(1);
}

const apiUrl = mobileApiMatch[1].trim();
const wsUrl = mobileWsMatch[1].trim();

console.log(`✅ Mobile API URL: ${apiUrl}`);
console.log(`✅ Mobile WebSocket URL: ${wsUrl}`);

// Check for localhost/127.0.0.1 which won't work over WiFi
if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1') || 
    wsUrl.includes('localhost') || wsUrl.includes('127.0.0.1')) {
  console.error('❌ Configuration uses localhost/127.0.0.1 - this will not work over WiFi without cable connection');
  console.log('💡 Run `npm run get-ip` and update mobile/.env with the correct network IP');
  process.exit(1);
}

// Test 2: Network Connectivity
console.log('\n2. Testing network connectivity...');
const { URL } = require('url');

// Import node-fetch dynamically
let fetch;
try {
  fetch = require('node-fetch');
} catch (error) {
  // Try dynamic import for newer versions
  fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
}

async function testConnection(url) {
  try {
    // Use dynamic import for node-fetch compatibility
    const { default: fetch } = await import('node-fetch');
    
    const testUrl = new URL('/health', url).toString();
    console.log(`🔍 Testing connection to: ${testUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Backend server accessible: ${JSON.stringify(data)}`);
      return true;
    } else {
      console.error(`❌ Backend server returned error: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Connection timeout - backend server not accessible');
    } else {
      console.error(`❌ Connection failed: ${error.message}`);
    }
    return false;
  }
}

// Test 3: WebSocket Connectivity
async function testWebSocketConnection(wsUrl) {
  console.log('\n3. Testing WebSocket connectivity...');
  
  try {
    const WebSocket = require('ws');
    
    return new Promise((resolve) => {
      const ws = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        console.error('❌ WebSocket connection timeout');
        ws.close();
        resolve(false);
      }, 5000);
      
      ws.onopen = () => {
        clearTimeout(timeout);
        console.log('✅ WebSocket connection successful');
        
        // Send test message
        ws.send(JSON.stringify({ type: 'test', data: { message: 'network test' } }));
        
        setTimeout(() => {
          ws.close();
          resolve(true);
        }, 1000);
      };
      
      ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error(`❌ WebSocket connection failed: ${error.message || 'Unknown error'}`);
        resolve(false);
      };
      
      ws.onmessage = (event) => {
        console.log(`📥 WebSocket message received: ${event.data}`);
      };
    });
  } catch (error) {
    console.error(`❌ WebSocket test error: ${error.message}`);
    return false;
  }
}

// Test 4: End-to-End Mobile Function Test
async function testE2EMobileFunction(apiUrl, wsUrl) {
  console.log('\n4. Testing E2E mobile function...');
  
  try {
    // Test API accessibility
    const apiOk = await testConnection(apiUrl);
    if (!apiOk) {
      console.error('❌ E2E test failed: API not accessible');
      return false;
    }
    
    // Test WebSocket accessibility
    const wsOk = await testWebSocketConnection(wsUrl);
    if (!wsOk) {
      console.error('❌ E2E test failed: WebSocket not accessible');
      return false;
    }
    
    console.log('✅ E2E mobile function test passed - app can communicate without cable connection');
    return true;
  } catch (error) {
    console.error(`❌ E2E test error: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  try {
    const apiOk = await testConnection(apiUrl);
    const wsOk = await testWebSocketConnection(wsUrl);
    const e2eOk = await testE2EMobileFunction(apiUrl, wsUrl);
    
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`Environment Configuration: ✅ Passed`);
    console.log(`API Connection: ${apiOk ? '✅ Passed' : '❌ Failed'}`);
    console.log(`WebSocket Connection: ${wsOk ? '✅ Passed' : '❌ Failed'}`);
    console.log(`E2E Mobile Function: ${e2eOk ? '✅ Passed' : '❌ Failed'}`);
    
    const allPassed = apiOk && wsOk && e2eOk;
    
    if (allPassed) {
      console.log('\n🎉 SUCCESS: Mobile app network function is working correctly without cable connection!');
      console.log('Your mobile app can now communicate with the backend over WiFi.');
    } else {
      console.log('\n❌ FAILURE: Some tests failed. Check the issues above.');
      console.log('\n💡 Troubleshooting Tips:');
      
      if (!apiOk) {
        console.log('   • Ensure backend server is running: npm run backend:dev');
        console.log('   • Check firewall settings on your development machine');
        console.log('   • Verify both devices are on the same WiFi network');
      }
      
      if (!wsOk) {
        console.log('   • Ensure WebSocket support is enabled in backend');
        console.log('   • Check if WebSocket port is accessible');
      }
      
      console.log('   • Run `npm run get-ip` to verify correct network IP');
      console.log('   • Update mobile/.env with the correct IP address if needed');
    }
    
    console.log('\n🏁 Test completed!');
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error(`💥 Test execution failed: ${error.message}`);
    process.exit(1);
  }
}

runTests();