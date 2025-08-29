#!/usr/bin/env node

/**
 * Quick Test Runner - Bypasses server setup for faster testing
 * Use when backend is already running
 */

const { spawn } = require('child_process');

async function runQuickTests() {
  console.log('🧪 DASH RACING QUICK TEST RUNNER');
  console.log('Running tests against existing servers...\n');

  // Check if backend is running
  try {
    const response = await fetch('http://localhost:8000/health');
    if (!response.ok) {
      throw new Error('Backend not healthy');
    }
    console.log('✅ Backend server detected - proceeding with tests\n');
  } catch (error) {
    console.error('❌ Backend server not running. Please start it first:');
    console.error('   cd backend && npm run dev');
    process.exit(1);
  }

  // Run tests with timeouts
  const testSuites = [
    { name: 'Unit Tests', config: 'jest.unit.config.js', timeout: 30000 },
    { name: 'Integration Tests', config: 'jest.integration.config.js', timeout: 60000 },
    { name: 'E2E Tests', config: 'jest.e2e.config.js', timeout: 90000 }
  ];

  let allPassed = true;

  for (const suite of testSuites) {
    console.log(`🔬 Running ${suite.name}...`);
    
    try {
      const result = await runJestWithTimeout(suite.config, suite.timeout);
      if (result.success) {
        console.log(`✅ ${suite.name} passed\n`);
      } else {
        console.log(`❌ ${suite.name} failed\n`);
        console.log(result.output);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${suite.name} timed out or errored: ${error.message}\n`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('🎉 All tests passed! Ready for production build.');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed. Fix issues before building.');
    process.exit(1);
  }
}

function runJestWithTimeout(config, timeout) {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['jest', '--config', config, '--forceExit'], {
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    let isResolved = false;

    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        proc.kill('SIGTERM');
        reject(new Error(`Test suite timed out after ${timeout}ms`));
      }
    }, timeout);

    proc.stdout?.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data); // Stream output in real-time
    });

    proc.stderr?.on('data', (data) => {
      output += data.toString();
      process.stderr.write(data); // Stream errors in real-time
    });

    proc.on('close', (code) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        resolve({
          success: code === 0,
          output: output
        });
      }
    });

    proc.on('error', (error) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  });
}

// Run if executed directly
if (require.main === module) {
  runQuickTests().catch(console.error);
}

module.exports = { runQuickTests };