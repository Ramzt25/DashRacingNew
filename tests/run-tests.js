#!/usr/bin/env node

/**
 * Test Runner Script for DASH RACING
 * Comprehensive test execution with detailed reporting
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DashRacingTestRunner {
  constructor() {
    this.testResults = {
      unit: { passed: 0, failed: 0, total: 0 },
      integration: { passed: 0, failed: 0, total: 0 },
      e2e: { passed: 0, failed: 0, total: 0 },
      overall: { passed: 0, failed: 0, total: 0 }
    };
    this.startTime = Date.now();
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[level];

    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const timeout = options.timeout || 120000; // 2 minutes default timeout
      
      const proc = spawn(command, args, {
        stdio: 'pipe',
        shell: true,
        ...options
      });

      let stdout = '';
      let stderr = '';
      let isResolved = false;

      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          proc.kill('SIGTERM');
          reject(new Error(`Command timed out after ${timeout}ms: ${command} ${args.join(' ')}`));
        }
      }, timeout);

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          resolve({
            code,
            stdout,
            stderr,
            success: code === 0
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

  parseJestOutput(output) {
    const lines = output.split('\n');
    let passed = 0;
    let failed = 0;
    let total = 0;

    for (const line of lines) {
      if (line.includes('Tests:')) {
        const match = line.match(/(\d+) passed(?:, (\d+) failed)?/);
        if (match) {
          passed = parseInt(match[1]);
          failed = match[2] ? parseInt(match[2]) : 0;
          total = passed + failed;
        }
      }
    }

    return { passed, failed, total };
  }

  async runTestSuite(name, config) {
    this.log(`Starting ${name} tests...`);
    
    const result = await this.runCommand('npx', ['jest', '--config', config], {
      cwd: process.cwd()
    });

    const results = this.parseJestOutput(result.stdout);
    this.testResults[name] = results;
    this.testResults.overall.passed += results.passed;
    this.testResults.overall.failed += results.failed;
    this.testResults.overall.total += results.total;

    if (result.success) {
      this.log(`${name} tests completed: ${results.passed}/${results.total} passed`, 'success');
    } else {
      this.log(`${name} tests failed: ${results.failed}/${results.total} failed`, 'error');
      if (result.stderr) {
        console.log(result.stderr);
      }
    }

    return result.success;
  }

  generateReport() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 DASH RACING TEST SUITE RESULTS');
    console.log('='.repeat(60));
    
    const suites = ['unit', 'integration', 'e2e'];
    
    suites.forEach(suite => {
      const results = this.testResults[suite];
      const status = results.failed === 0 ? '✅' : '❌';
      console.log(`${status} ${suite.toUpperCase()}: ${results.passed}/${results.total} passed`);
    });

    console.log('─'.repeat(60));
    
    const overall = this.testResults.overall;
    const overallStatus = overall.failed === 0 ? '✅' : '❌';
    const successRate = overall.total > 0 ? ((overall.passed / overall.total) * 100).toFixed(1) : 0;
    
    console.log(`${overallStatus} OVERALL: ${overall.passed}/${overall.total} passed (${successRate}%)`);
    console.log(`⏱️  Duration: ${duration}s`);
    
    if (overall.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Ready for production build.');
    } else {
      console.log('\n💥 TESTS FAILED! Fix issues before building.');
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    this.log('Checking prerequisites...');
    
    // Check if backend is running
    try {
      const response = await fetch('http://localhost:8000/health');
      if (!response.ok) {
        throw new Error('Backend health check failed');
      }
      this.log('Backend server is running', 'success');
    } catch (error) {
      this.log('Backend server is not running. Starting backend...', 'warning');
      // The global setup will handle starting the backend
    }

    // Check test files exist
    const testDirs = ['unit', 'integration', 'e2e'];
    for (const dir of testDirs) {
      const testPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(testPath)) {
        this.log(`Test directory ${dir} not found`, 'error');
        process.exit(1);
      }
    }

    this.log('All prerequisites met', 'success');
  }

  async run() {
    try {
      console.log('\n🧪 DASH RACING COMPREHENSIVE TEST SUITE');
      console.log('Testing all functions E2E - requires passing before building\n');

      await this.checkPrerequisites();

      // Run test suites in sequence
      const unitSuccess = await this.runTestSuite('unit', 'jest.unit.config.js');
      const integrationSuccess = await this.runTestSuite('integration', 'jest.integration.config.js');
      const e2eSuccess = await this.runTestSuite('e2e', 'jest.e2e.config.js');

      this.generateReport();

      // All tests must pass for build eligibility
      if (unitSuccess && integrationSuccess && e2eSuccess) {
        process.exit(0);
      } else {
        process.exit(1);
      }

    } catch (error) {
      this.log(`Test runner error: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new DashRacingTestRunner();
  runner.run();
}

module.exports = DashRacingTestRunner;