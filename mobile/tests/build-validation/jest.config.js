module.exports = {
  testEnvironment: 'node',
  testTimeout: 300000, // 5 minutes for build tests
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/setup/test-setup.js'],
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test-reports',
      filename: 'build-test-report.html',
      openReport: false,
      expand: true
    }]
  ],
  testSequencer: '<rootDir>/utils/test-sequencer.js'
};