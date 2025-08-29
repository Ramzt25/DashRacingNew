/**
 * End-to-End Authentication Flow Tests
 * Tests complete user registration, login, and authentication flows
 */

import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { apiClient } from '../utils/api-client';
import { TestUtils } from '../utils/test-utils';
import { sleep } from '../utils/test-helpers';

describe('E2E Authentication Flow', () => {
  let testUser: any;

  beforeAll(async () => {
    // Reset rate limiting at start of test suite
    TestUtils.resetRateLimit();
  });

  beforeEach(async () => {
    testUser = TestUtils.generateTestUser('auth');
    apiClient.clearAuth();
    // Small delay between tests
    await sleep(200);
  });

  afterEach(async () => {
    // Cleanup: logout if logged in
    if (apiClient) {
      await apiClient.post('/api/auth/logout').catch(() => {});
    }
    // Small delay after cleanup
    await sleep(100);
  });

  afterAll(async () => {
    // Cleanup after all tests
    await TestUtils.cleanup();
  });

  test('Complete user registration flow', async () => {
    console.log('\n🧪 Starting user registration test...');
    
    // Debug: Double-check server connection
    try {
      const healthCheck = await fetch('http://localhost:8000/health');
      console.log('🔍 Health check response:', healthCheck.status, healthCheck.statusText);
      
      // Also test the auth endpoint specifically
      const authTest = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      console.log('🔍 Auth endpoint test:', authTest.status, authTest.statusText);
      const authTestText = await authTest.text();
      console.log('🔍 Auth endpoint response:', authTestText);
    } catch (error) {
      console.error('🔍 Server connection test failed:', error);
    }
    
    console.log('📝 Generated test user:', JSON.stringify(testUser, null, 2));
    
    // Test user registration
    const registerResponse = await apiClient.post('/api/auth/register', {
      email: testUser.email,
      username: testUser.username,
      password: testUser.password
    });

    console.log('📥 Registration response:', JSON.stringify(registerResponse, null, 2));

    if (!registerResponse.success) {
      throw new Error(`Registration failed: ${JSON.stringify(registerResponse, null, 2)}`);
    }

    expect(registerResponse.success).toBe(true);
    expect(registerResponse.data).toHaveProperty('email');
    expect(registerResponse.data).toHaveProperty('username');
    expect(registerResponse.data).toHaveProperty('token');
    expect(registerResponse.data.email).toBe(testUser.email);
    expect(registerResponse.data.username).toBe(testUser.username);

    // Verify token is valid
    const token = registerResponse.data.token;
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
  });

  test('User login flow with valid credentials', async () => {
    // First register the user
    await apiClient.post('/api/auth/register', {
      email: testUser.email,
      username: testUser.username,
      password: testUser.password
    });

    // Then login
    const loginResponse = await apiClient.post('/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });

    expect(loginResponse.success).toBe(true);
    expect(loginResponse.data).toHaveProperty('email');
    expect(loginResponse.data).toHaveProperty('username');
    expect(loginResponse.data).toHaveProperty('token');
    expect(loginResponse.data.email).toBe(testUser.email);
  });

  test('Login fails with invalid credentials', async () => {
    const loginResponse = await apiClient.post('/api/auth/login', {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    });

    expect(loginResponse.success).toBe(false);
    expect(loginResponse.status).toBe(401);
    expect(loginResponse.error).toBeTruthy();
  });

  test('Protected routes require authentication', async () => {
    // Try to access protected route without token
    const response = await apiClient.get('/api/users/profile');
    
    expect(response.success).toBe(false);
    expect(response.status).toBe(401);
  });

  test('Protected routes work with valid token', async () => {
    // Register and login
    await apiClient.post('/api/auth/register', {
      email: testUser.email,
      username: testUser.username,
      password: 'TestPassword123!'
    });

    const loginResponse = await apiClient.post('/api/auth/login', {
      email: testUser.email,
      password: 'TestPassword123!'
    });

    // Set auth token
    apiClient.setAuthToken(loginResponse.data.token);

    // Access protected route
    const profileResponse = await apiClient.get('/api/users/profile');
    
    expect(profileResponse.success).toBe(true);
    expect(profileResponse.data).toHaveProperty('email');
    expect(profileResponse.data.email).toBe(testUser.email);
  });

  test('Token refresh functionality', async () => {
    // Register and login
    const registerResponse = await apiClient.post('/api/auth/register', {
      email: testUser.email,
      username: testUser.username,
      password: 'TestPassword123!'
    });

    console.log('🔍 Token refresh - Register response:', JSON.stringify(registerResponse, null, 2));

    const loginResponse = await apiClient.post('/api/auth/login', {
      email: testUser.email,
      password: 'TestPassword123!'
    });

    console.log('🔍 Token refresh - Login response:', JSON.stringify(loginResponse, null, 2));

    if (!loginResponse.success || !loginResponse.data) {
      throw new Error(`Login failed for token refresh test: ${JSON.stringify(loginResponse, null, 2)}`);
    }

    const originalToken = loginResponse.data.token;
    apiClient.setAuthToken(originalToken);

    // Wait a moment for token to be different
    await sleep(1000);

    // Refresh token
    const refreshResponse = await apiClient.post('/api/auth/refresh', {
      refreshToken: loginResponse.data.refreshToken
    });
    
    expect(refreshResponse.success).toBe(true);
    expect(refreshResponse.data).toHaveProperty('token');
    
    const newToken = refreshResponse.data.token;
    expect(newToken).toBeTruthy();
    expect(newToken).not.toBe(originalToken);

    // Verify new token works
    apiClient.setAuthToken(newToken);
    const profileResponse = await apiClient.get('/api/users/profile');
    expect(profileResponse.success).toBe(true);
  });

  test('Logout invalidates token', async () => {
    // Register and login
    const registerResponse = await apiClient.post('/api/auth/register', {
      email: testUser.email,
      username: testUser.username,
      password: 'TestPassword123!'
    });

    console.log('🔍 Logout test - Register response:', JSON.stringify(registerResponse, null, 2));

    const loginResponse = await apiClient.post('/api/auth/login', {
      email: testUser.email,
      password: 'TestPassword123!'
    });

    console.log('🔍 Logout test - Login response:', JSON.stringify(loginResponse, null, 2));

    if (!loginResponse.success || !loginResponse.data) {
      throw new Error(`Login failed for logout test: ${JSON.stringify(loginResponse, null, 2)}`);
    }

    apiClient.setAuthToken(loginResponse.data.token);

    // Verify token works
    let profileResponse = await apiClient.get('/api/users/profile');
    expect(profileResponse.success).toBe(true);

    // Logout
    const logoutResponse = await apiClient.post('/api/auth/logout');
    expect(logoutResponse.success).toBe(true);

    // Clear the auth token from client (since JWT tokens don't have server-side invalidation)
    apiClient.setAuthToken('');

    // Verify token no longer works
    profileResponse = await apiClient.get('/api/users/profile');
    expect(profileResponse.success).toBe(false);
    expect(profileResponse.status).toBe(401);
  });

  test('Registration validation errors', async () => {
    // Test missing required fields
    const invalidRegister = await apiClient.post('/api/auth/register', {
      email: 'invalid-email',
      password: 'weak'
    });

    expect(invalidRegister.success).toBe(false);
    expect(invalidRegister.status).toBe(400);
    expect(invalidRegister.error).toBeTruthy();
  });

  test('Duplicate registration prevention', async () => {
    const userData = {
      email: testUser.email,
      username: testUser.username,
      password: 'TestPassword123!'
    };

    console.log('🔍 Duplicate test - User data:', JSON.stringify(userData, null, 2));

    // First registration should succeed
    const firstRegister = await apiClient.post('/api/auth/register', userData);
    console.log('🔍 Duplicate test - First register response:', JSON.stringify(firstRegister, null, 2));
    expect(firstRegister.success).toBe(true);

    // Second registration with same email should fail
    const secondRegister = await apiClient.post('/api/auth/register', userData);
    console.log('🔍 Duplicate test - Second register response:', JSON.stringify(secondRegister, null, 2));
    expect(secondRegister.success).toBe(false);
    expect(secondRegister.status).toBe(409); // Conflict
  });
});