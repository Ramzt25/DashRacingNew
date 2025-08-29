#!/usr/bin/env node

// Simple test runner that only starts backend for testing
const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 DASH RACING - Backend Only Test Runner');
console.log('======================================');

// Change to backend directory
process.chdir(path.join(__dirname, '..', 'backend'));

// Start backend server in background
console.log('🚀 Starting backend server...');
const backend = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe',
  detached: false
});

let backendReady = false;

// Wait for backend to be ready
backend.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('[BACKEND]', output.trim());
  
  if (output.includes('Server listening at')) {
    backendReady = true;
    console.log('✅ Backend ready, starting tests...');
    runTests();
  }
});

backend.stderr.on('data', (data) => {
  console.error('[BACKEND ERROR]', data.toString());
});

function runTests() {
  // Change to tests directory
  process.chdir(path.join(__dirname));
  
  // Run tests without pretest hook
  console.log('📝 Running integration tests...');
  const jest = spawn('npx', ['jest', '--config', 'jest.integration.config.js', '--runInBand', '--verbose'], {
    stdio: 'inherit'
  });
  
  jest.on('close', (code) => {
    console.log(`\n🏁 Tests completed with code: ${code}`);
    
    // Cleanup
    console.log('🧹 Cleaning up...');
    backend.kill();
    process.exit(code);
  });
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  backend.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  backend.kill();
  process.exit(0);
});

// Timeout after 30 seconds if backend doesn't start
setTimeout(() => {
  if (!backendReady) {
    console.error('❌ Backend failed to start within 30 seconds');
    backend.kill();
    process.exit(1);
  }
}, 30000);