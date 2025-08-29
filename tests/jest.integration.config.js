module.exports = {
  displayName: 'Integration Tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 45000,
  testMatch: [
    '<rootDir>/integration/**/*.test.ts'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/setup/jest.setup.ts',
    '<rootDir>/setup/integration.setup.ts'
  ]
};