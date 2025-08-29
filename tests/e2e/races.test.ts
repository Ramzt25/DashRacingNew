/**
 * End-to-End Race Management Tests
 * Tests complete race creation, joining, and lifecycle management
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { apiClient } from '../utils/api-client';
import { TestWebSocketClient } from '../utils/websocket-client';
import { TestUtils } from '../utils/test-utils';
import { createTestRace, generateRandomLocation, sleep, waitFor } from '../utils/test-helpers';

describe('E2E Race Management', () => {
  let testUser: any;
  let authToken: string;
  let wsClient: TestWebSocketClient;

  beforeEach(async () => {
    testUser = TestUtils.generateTestUser();
    
    // Register and login user
    await apiClient.post('/api/auth/register', {
      email: testUser.email,
      username: testUser.username,
      password: testUser.password
    });

    const loginResponse = await apiClient.post('/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });

    authToken = loginResponse.data.token;
    apiClient.setAuthToken(authToken);

    // Setup WebSocket client
    wsClient = new TestWebSocketClient();
  });

  afterEach(async () => {
    if (wsClient) {
      wsClient.disconnect();
    }
    await apiClient.post('/api/auth/logout').catch(() => {});
    apiClient.clearAuth();
    await sleep(100);
  });

  afterAll(async () => {
    await TestUtils.cleanup();
  });

  test('Create race with valid data', async () => {
    const raceData = {
      name: 'Test Race',
      description: 'A test race for E2E testing',
      startLocation: { lat: 40.7128, lng: -74.0060 },
      endLocation: { lat: 40.7589, lng: -73.9851 },
      maxParticipants: 10,
      entryFee: 25.00,
      prizePool: 200.00,
      startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      raceType: 'street'
    };

    const response = await apiClient.post('/api/races', raceData);

    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('race');
    expect(response.data.race.name).toBe(raceData.name);
    expect(response.data.race.startLocation).toEqual(raceData.startLocation);
    expect(response.data.race.endLocation).toEqual(raceData.endLocation);
    expect(response.data.race.status).toBe('scheduled');
    expect(response.data.race).toHaveProperty('id');
    expect(response.data.race).toHaveProperty('createdBy');
  });

  test('List available races', async () => {
    // Create multiple races
    const races = [
      { name: 'Race 1', startLocation: generateRandomLocation(), endLocation: generateRandomLocation() },
      { name: 'Race 2', startLocation: generateRandomLocation(), endLocation: generateRandomLocation() },
      { name: 'Race 3', startLocation: generateRandomLocation(), endLocation: generateRandomLocation() }
    ];

    for (const race of races) {
      await apiClient.post('/api/races', {
        ...race,
        maxParticipants: 5,
        startTime: new Date(Date.now() + 3600000).toISOString()
      });
    }

    // List races
    const response = await apiClient.get('/api/races');

    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('races');
    expect(response.data.races.length).toBeGreaterThanOrEqual(3);
    
    const names = response.data.races.map((r: any) => r.name);
    expect(names).toContain('Race 1');
    expect(names).toContain('Race 2');
    expect(names).toContain('Race 3');
  });

  test('Join race as participant', async () => {
    // Create a vehicle first
    await apiClient.post('/api/vehicles', {
      name: 'Race Car',
      make: 'Toyota',
      model: 'Supra',
      year: 2023
    });

    // Create race
    const raceData = {
      name: 'Joinable Race',
      startLocation: generateRandomLocation(),
      endLocation: generateRandomLocation(),
      maxParticipants: 5,
      startTime: new Date(Date.now() + 3600000).toISOString()
    };

    const createResponse = await apiClient.post('/api/races', raceData);
    const raceId = createResponse.data.race.id;

    // Join race
    const joinResponse = await apiClient.post(`/api/races/${raceId}/join`);

    expect(joinResponse.success).toBe(true);
    expect(joinResponse.message).toBe('Successfully joined race');
    
    // Verify race shows user as participant
    const getRaceResponse = await apiClient.get(`/api/races/${raceId}`);
    expect(getRaceResponse.success).toBe(true);
    expect(getRaceResponse.data.race.participants).toHaveLength(1);
  });

  test('Leave race before start', async () => {
    // Create vehicle
    await apiClient.post('/api/vehicles', {
      name: 'Race Car',
      make: 'Honda',
      model: 'Civic Type R',
      year: 2024
    });

    // Create race
    const raceData = {
      name: 'Leaveable Race',
      startLocation: generateRandomLocation(),
      endLocation: generateRandomLocation(),
      maxParticipants: 5,
      startTime: new Date(Date.now() + 3600000).toISOString()
    };

    const createResponse = await apiClient.post('/api/races', raceData);
    const raceId = createResponse.data.race.id;

    // Join race
    await apiClient.post(`/api/races/${raceId}/join`);

    // Leave race
    const leaveResponse = await apiClient.post(`/api/races/${raceId}/leave`);
    expect(leaveResponse.success).toBe(true);

    // Verify race shows no participants
    const getRaceResponse = await apiClient.get(`/api/races/${raceId}`);
    expect(getRaceResponse.success).toBe(true);
    expect(getRaceResponse.data.race.participants).toHaveLength(0);
  });

  test('Start race with real-time updates', async () => {
    // Connect WebSocket first
    await wsClient.connect(authToken);

    // Create vehicle
    await apiClient.post('/api/vehicles', {
      name: 'Racing Vehicle',
      make: 'Ferrari',
      model: '488 GTB',
      year: 2023
    });

    // Create race with immediate start time
    const raceData = {
      name: 'Real-time Race',
      startLocation: generateRandomLocation(),
      endLocation: generateRandomLocation(),
      maxParticipants: 2,
      startTime: new Date(Date.now() + 5000).toISOString() // 5 seconds from now
    };

    const createResponse = await apiClient.post('/api/races', raceData);
    const raceId = createResponse.data.race.id;

    // Join race
    await apiClient.post(`/api/races/${raceId}/join`);

    // Join race room via WebSocket to receive notifications
    wsClient.send('join_race', { raceId: raceId });
    
    // Wait a moment for the join to be processed
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Start race manually (for testing)
    const startResponse = await apiClient.post(`/api/races/${raceId}/start`);
    expect(startResponse.success).toBe(true);

    // Wait for race start WebSocket message
    const raceStartMessage = await wsClient.waitForMessage('race_started', 10000);
    expect(raceStartMessage.data.raceId).toBe(raceId);
    expect(raceStartMessage.data.status).toBe('active');
  });

  test('Race location updates via WebSocket', async () => {
    // Connect WebSocket
    await wsClient.connect(authToken);

    // Create and join race
    await apiClient.post('/api/vehicles', {
      name: 'GPS Car', make: 'BMW', model: 'M3', year: 2023
    });

    const raceData = {
      name: 'Location Test Race',
      startLocation: generateRandomLocation(),
      endLocation: generateRandomLocation(),
      maxParticipants: 3,
      startTime: new Date(Date.now() + 2000).toISOString()
    };

    const createResponse = await apiClient.post('/api/races', raceData);
    const raceId = createResponse.data.race.id;

    await apiClient.post(`/api/races/${raceId}/join`);

    // Join race room via WebSocket to receive notifications  
    wsClient.send('join_race', { raceId: raceId });

    await apiClient.post(`/api/races/${raceId}/start`);

    // Send location update
    const locationData = {
      lat: 40.7500,
      lng: -73.9900,
      speed: 65,
      heading: 90
    };

    const locationResponse = await apiClient.post(`/api/races/${raceId}/location`, locationData);
    expect(locationResponse.success).toBe(true);

    // Wait for location update via WebSocket
    const locationMessage = await wsClient.waitForMessage('location_update', 5000);
    expect(locationMessage.data.raceId).toBe(raceId);
    expect(locationMessage.data.location.lat).toBe(locationData.lat);
    expect(locationMessage.data.location.lng).toBe(locationData.lng);
  });

  test('Complete race and calculate results', async () => {
    // Connect WebSocket
    await wsClient.connect(authToken);

    // Create vehicle
    await apiClient.post('/api/vehicles', {
      name: 'Winning Car', make: 'Lamborghini', model: 'Huracan', year: 2024
    });

    // Create race
    const raceData = {
      name: 'Completable Race',
      startLocation: { lat: 40.7128, lng: -74.0060 },
      endLocation: { lat: 40.7589, lng: -73.9851 },
      maxParticipants: 1,
      startTime: new Date(Date.now() + 1000).toISOString()
    };

    const createResponse = await apiClient.post('/api/races', raceData);
    const raceId = createResponse.data.race.id;

    await apiClient.post(`/api/races/${raceId}/join`);

    // Join race room via WebSocket to receive notifications  
    wsClient.send('join_race', { raceId: raceId });

    await apiClient.post(`/api/races/${raceId}/start`);

    // Simulate reaching finish line
    const finishResponse = await apiClient.post(`/api/races/${raceId}/finish`, {
      finishTime: new Date().toISOString(),
      totalTime: 125.5, // seconds
      averageSpeed: 45.2 // mph
    });

    console.log('🔍 Debug - Finish response:', JSON.stringify(finishResponse, null, 2));

    expect(finishResponse.success).toBe(true);
    expect(finishResponse.data).toHaveProperty('result');
    expect(finishResponse.data.result.position).toBe(1);
    expect(finishResponse.data.result.totalTime).toBe(125.5);
  });

  test('Race validation and error handling', async () => {
    // Test creating race without required fields
    const invalidRaceData = {
      name: 'Invalid Race'
      // Missing required fields
    };

    const response = await apiClient.post('/api/races', invalidRaceData);
    expect(response.success).toBe(false);
    expect(response.status).toBe(400);
    expect(response.error).toBeTruthy();
  });

  test('Race capacity limits', async () => {
    // Create race with max 1 participant
    const raceData = {
      name: 'Limited Race',
      startLocation: generateRandomLocation(),
      endLocation: generateRandomLocation(),
      maxParticipants: 1,
      startTime: new Date(Date.now() + 3600000).toISOString()
    };

    const createResponse = await apiClient.post('/api/races', raceData);
    const raceId = createResponse.data.race.id;

    // Create vehicle for current user
    await apiClient.post('/api/vehicles', {
      name: 'User 1 Car', make: 'Toyota', model: 'Camry', year: 2023
    });

    // Join race as first user
    const joinResponse1 = await apiClient.post(`/api/races/${raceId}/join`);
    expect(joinResponse1.success).toBe(true);

    // Create second user
    const secondUser = TestUtils.generateTestUser();
    await apiClient.post('/api/auth/register', {
      email: secondUser.email,
      username: secondUser.username,
      password: secondUser.password
    });

    const secondLoginResponse = await apiClient.post('/api/auth/login', {
      email: secondUser.email,
      password: secondUser.password
    });

    // Debug the login response structure
    console.log('Second login response:', JSON.stringify(secondLoginResponse, null, 2));

    if (secondLoginResponse.data && secondLoginResponse.data.token) {
      apiClient.setAuthToken(secondLoginResponse.data.token);
    } else {
      throw new Error('Failed to get token from second user login');
    }

    // Create vehicle for second user
    await apiClient.post('/api/vehicles', {
      name: 'User 2 Car', make: 'Honda', model: 'Civic', year: 2023
    });

    // Try to join full race
    const joinResponse2 = await apiClient.post(`/api/races/${raceId}/join`);
    expect(joinResponse2.success).toBe(false);
    expect(joinResponse2.status).toBe(409); // Conflict - race full
  });
});
