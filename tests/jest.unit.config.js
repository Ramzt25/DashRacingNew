module.exports = {
  displayName: 'Unit Tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 15000,
  testMatch: [
    '<rootDir>/unit/**/*.test.ts'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/setup/jest.setup.ts'
  ]
};