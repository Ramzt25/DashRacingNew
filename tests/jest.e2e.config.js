module.exports = {
  displayName: 'End-to-End Tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 120000, // Increased timeout
  testMatch: [
    '<rootDir>/e2e/**/*.test.ts'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/setup/jest.setup.ts',
    '<rootDir>/setup/e2e.setup.ts'
  ],
  globalSetup: '<rootDir>/setup/global.setup.ts',
  globalTeardown: '<rootDir>/setup/global.teardown.ts',
  // Run tests sequentially to avoid rate limiting
  maxWorkers: 1,
  // Add delays between test suites
  testSequencer: '<rootDir>/setup/sequential-runner.js'
};