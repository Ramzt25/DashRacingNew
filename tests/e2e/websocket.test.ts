/**
 * End-to-End WebSocket Real-Time Features Tests
 * Tests all real-time functionality including notifications, race updates, and location tracking
 */

import { describe, test, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import { apiClient } from '../utils/api-client';
import { TestWebSocketClient } from '../utils/websocket-client';
import { TestUtils } from '../utils/test-utils';
import { generateRandomLocation, sleep } from '../utils/test-helpers';

describe('E2E WebSocket Real-Time Features', () => {
  let token1: string;
  let token2: string;
  let user1: any;
  let user2: any;
  let wsClient1: TestWebSocketClient;
  let wsClient2: TestWebSocketClient;

  beforeEach(async () => {
    // Initialize WebSocket clients
    wsClient1 = new TestWebSocketClient();
    wsClient2 = new TestWebSocketClient();

    // Check if backend is reachable
    try {
      const healthCheck = await apiClient.get('/health');
      if (!healthCheck.success) {
        throw new Error('Backend health check failed');
      }
    } catch (error) {
      console.error('Backend health check failed:', error);
      throw error;
    }

    // Generate unique test data
    const timestamp = Date.now();
    user1 = {
      email: `test${timestamp}${Math.floor(Math.random() * 1000)}@gmail.com`,
      username: `test${timestamp}${Math.floor(Math.random() * 1000)}`,
      password: 'TestPassword123!'
    };
    
    user2 = {
      email: `test${timestamp}${Math.floor(Math.random() * 1000)}@gmail.com`,
      username: `test${timestamp}${Math.floor(Math.random() * 1000)}`,
      password: 'TestPassword123!'
    };

    // Register both users
    const register1 = await apiClient.post('/api/auth/register', {
      email: user1.email,
      username: user1.username,
      password: user1.password
    });

    const register2 = await apiClient.post('/api/auth/register', {
      email: user2.email,
      username: user2.username,
      password: user2.password
    });

    // Login both users
    const login1 = await apiClient.post('/api/auth/login', {
      email: user1.email,
      password: user1.password
    });

    const login2 = await apiClient.post('/api/auth/login', {
      email: user2.email,
      password: user2.password
    });

    token1 = login1.data.token;
    token2 = login2.data.token;
    
    // Verify tokens exist
    if (!token1 || !token2) {
      throw new Error('Failed to obtain login tokens');
    }
  });  afterEach(async () => {
    if (wsClient1) {
      wsClient1.disconnect();
    }
    if (wsClient2) {
      wsClient2.disconnect();
    }
    await apiClient.post('/api/auth/logout').catch(() => {});
    apiClient.clearAuth();
    await sleep(100);
  });

  afterAll(async () => {
    await TestUtils.cleanup();
  });

  test('Real-time friend request notifications', async () => {
    // Connect both users
    await wsClient1.connect(token1);
    await wsClient2.connect(token2);

    // Wait for connections to be fully established and server setup completed
    await sleep(3000);

    // User 1 sends friend request to User 2
    apiClient.setAuthToken(token1);
    
    const friendRequestResponse = await apiClient.post('/api/friends/request', {
      username: user2.username
    });
    
    expect(friendRequestResponse.success).toBe(true);

    // User 2 should receive notification
    const notificationMessage = await wsClient2.waitForMessage('friend_request_received', 5000);
    expect(notificationMessage.data).toHaveProperty('from');
    expect(notificationMessage.data.from.username).toBe(user1.username);
    expect(notificationMessage.data.type).toBe('friend_request');
  });
});
