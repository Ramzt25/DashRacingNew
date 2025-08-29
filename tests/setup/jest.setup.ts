import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Global test configuration
beforeAll(async () => {
  console.log('🧪 DASH RACING Test Suite Starting...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.API_URL = 'http://localhost:8000';
  process.env.WS_URL = 'ws://localhost:8000';
  
  // Wait for servers to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));
});

afterAll(async () => {
  console.log('🏁 DASH RACING Test Suite Complete');
});

// Test isolation
beforeEach(async () => {
  // Clear any test data between tests
});

afterEach(async () => {
  // Cleanup after each test
});

// Mock console methods for cleaner test output
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: originalConsole.error, // Keep errors visible
  info: jest.fn(),
  debug: jest.fn(),
};