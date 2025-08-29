const { exec } = require('child_process');
const path = require('path');

// Start backend server
console.log('🏁 Starting backend server...');
const backend = exec('npm run dev', { 
  cwd: path.join(__dirname, 'backend')
});

backend.stdout.on('data', (data) => {
  console.log(`[BACKEND] ${data}`);
});

backend.stderr.on('data', (data) => {
  console.error(`[BACKEND ERROR] ${data}`);
});

// Wait for backend to start, then run tests
setTimeout(() => {
  console.log('🧪 Starting E2E tests...');
  const tests = exec('npm run test:e2e', { 
    cwd: path.join(__dirname, 'tests')
  });

  tests.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  tests.stderr.on('data', (data) => {
    console.error(data.toString());
  });

  tests.on('close', (code) => {
    console.log(`\n🏁 Tests completed with code ${code}`);
    backend.kill();
    process.exit(code);
  });
}, 5000);

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping...');
  backend.kill();
  process.exit();
});