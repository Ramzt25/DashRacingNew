import { beforeAll } from '@jest/globals';

beforeAll(async () => {
  console.log('🔧 Setting up Integration test environment...');
  
  // Additional integration specific setup
  process.env.TEST_TYPE = 'integration';
});