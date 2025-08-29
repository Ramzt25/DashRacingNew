/**
 * End-to-End Vehicle Management Tests
 * Tests complete vehicle CRUD operations and management flows
 */

import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { apiClient } from '../utils/api-client';
import { TestUtils } from '../utils/test-utils';
import { createTestVehicle, sleep } from '../utils/test-helpers';

describe('E2E Vehicle Management', () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    TestUtils.resetRateLimit();
  });

  beforeEach(async () => {
    testUser = TestUtils.generateTestUser('vehicle');
    
    // Register and login user
    const registerResponse = await apiClient.post('/api/auth/register', {
      email: testUser.email,
      username: testUser.username,
      password: testUser.password
    });

    if (!registerResponse.success) {
      throw new Error(`Registration failed: ${registerResponse.error}`);
    }

    const loginResponse = await apiClient.post('/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });

    if (!loginResponse.success) {
      throw new Error(`Login failed: ${loginResponse.error}`);
    }

    authToken = loginResponse.data.token;
    apiClient.setAuthToken(authToken);
    await sleep(100);
  });

  afterEach(async () => {
    await apiClient.post('/api/auth/logout').catch(() => {});
    apiClient.clearAuth();
    await sleep(100);
  });

  afterAll(async () => {
    await TestUtils.cleanup();
  });

  test('Create vehicle with valid data', async () => {
    const vehicleData = {
      name: 'My Test Car',
      make: 'Honda',
      model: 'Civic',
      year: 2023,
      color: 'Blue'
    };

    const response = await apiClient.post('/api/vehicles', vehicleData);

    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('vehicle');
    expect(response.data.vehicle.name).toBe(vehicleData.name);
    expect(response.data.vehicle.make).toBe(vehicleData.make);
    expect(response.data.vehicle.model).toBe(vehicleData.model);
    expect(response.data.vehicle.year).toBe(vehicleData.year);
    expect(response.data.vehicle).toHaveProperty('id');
    expect(response.data.vehicle).toHaveProperty('userId');
  });

  test('List user vehicles', async () => {
    // Create a few vehicles
    const vehicles = [
      { name: 'Car 1', make: 'Toyota', model: 'Camry', year: 2022 },
      { name: 'Car 2', make: 'Ford', model: 'Mustang', year: 2023 },
      { name: 'Car 3', make: 'BMW', model: 'X5', year: 2021 }
    ];

    // Create all vehicles
    for (const vehicle of vehicles) {
      await apiClient.post('/api/vehicles', vehicle);
    }

    // List vehicles
        const response = await apiClient.get('/api/vehicles');

    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('vehicles');
    expect(response.data.vehicles).toHaveLength(3);
    
    // Verify all vehicles are returned
    const names = response.data.vehicles.map((v: any) => v.name);
    expect(names).toContain('Car 1');
    expect(names).toContain('Car 2');
    expect(names).toContain('Car 3');
  });

  test('Get specific vehicle by ID', async () => {
    // Create vehicle
    const vehicleData = { name: 'Test Vehicle', make: 'Tesla', model: 'Model 3', year: 2024 };
    const createResponse = await apiClient.post('/api/vehicles', vehicleData);
    const vehicleId = createResponse.data.vehicle.id;

    // Get vehicle by ID
    const response = await apiClient.get(`/api/vehicles/${vehicleId}`);

    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('vehicle');
    expect(response.data.vehicle.id).toBe(vehicleId);
    expect(response.data.vehicle.name).toBe(vehicleData.name);
  });

  test('Update vehicle information', async () => {
    // Create vehicle
    const vehicleData = { name: 'Original Name', make: 'Honda', model: 'Accord', year: 2020 };
    const createResponse = await apiClient.post('/api/vehicles', vehicleData);
    const vehicleId = createResponse.data.vehicle.id;

    // Update vehicle
    const updateData = {
      name: 'Updated Name',
      color: 'Red'
    };

    const updateResponse = await apiClient.put(`/api/vehicles/${vehicleId}`, updateData);

    expect(updateResponse.success).toBe(true);
    expect(updateResponse.data.vehicle.name).toBe(updateData.name);
    expect(updateResponse.data.vehicle.color).toBe(updateData.color);
    
    // Original fields should remain
    expect(updateResponse.data.vehicle.make).toBe(vehicleData.make);
    expect(updateResponse.data.vehicle.model).toBe(vehicleData.model);
  });

  test('Delete vehicle', async () => {
    // Create vehicle
    const vehicleData = { name: 'To Be Deleted', make: 'Nissan', model: 'Altima', year: 2019 };
    const createResponse = await apiClient.post('/api/vehicles', vehicleData);
    const vehicleId = createResponse.data.vehicle.id;

    // Delete vehicle
    const deleteResponse = await apiClient.delete(`/api/vehicles/${vehicleId}`);
    expect(deleteResponse.success).toBe(true);

    // Verify vehicle is deleted
    const getResponse = await apiClient.get(`/api/vehicles/${vehicleId}`);
    expect(getResponse.success).toBe(false);
    expect(getResponse.status).toBe(404);
  });

  test('Vehicle creation validation', async () => {
    // Test missing required fields
    const invalidData = {
      name: 'Test Car'
      // Missing make, model, year
    };

    const response = await apiClient.post('/api/vehicles', invalidData);

    expect(response.success).toBe(false);
    expect(response.status).toBe(400);
    expect(response.error).toBeTruthy();
  });

  test('Cannot access other user vehicles', async () => {
    // Create vehicle as current user
    const vehicleData = { name: 'My Private Car', make: 'Mercedes', model: 'C-Class', year: 2023 };
    const createResponse = await apiClient.post('/api/vehicles', vehicleData);
    const vehicleId = createResponse.data.vehicle.id;

    // Create another user
    const otherUser = TestUtils.generateTestUser();
    const registerResponse = await apiClient.post('/api/auth/register', {
      email: otherUser.email,
      username: otherUser.username,
      password: otherUser.password
    });

    // Check if registration was successful
    if (!registerResponse.success) {
      throw new Error(`Registration failed for other user: ${registerResponse.error}`);
    }

    const otherLoginResponse = await apiClient.post('/api/auth/login', {
      email: otherUser.email,
      password: otherUser.password
    });

    // Switch to other user's token
    if (otherLoginResponse.success && otherLoginResponse.data && otherLoginResponse.data.token) {
      apiClient.setAuthToken(otherLoginResponse.data.token);
    } else {
      throw new Error(`Failed to get token from other user login. Success: ${otherLoginResponse.success}, Data: ${JSON.stringify(otherLoginResponse.data)}, Error: ${otherLoginResponse.error}`);
    }

    // Try to access first user's vehicle
    const response = await apiClient.get(`/api/vehicles/${vehicleId}`);
    expect(response.success).toBe(false);
    expect(response.status).toBe(403); // Should be forbidden, not reveal if vehicle exists
  });

  test('Vehicle search and filtering', async () => {
    // Create vehicles with different makes
    const vehicles = [
      { name: 'Honda 1', make: 'Honda', model: 'Civic', year: 2022 },
      { name: 'Honda 2', make: 'Honda', model: 'Accord', year: 2023 },
      { name: 'Toyota 1', make: 'Toyota', model: 'Camry', year: 2022 },
      { name: 'Ford 1', make: 'Ford', model: 'F150', year: 2021 }
    ];

    for (const vehicle of vehicles) {
      await apiClient.post('/api/vehicles', vehicle);
    }

    // Search by make
    const hondaResponse = await apiClient.get('/api/vehicles?make=Honda');
    expect(hondaResponse.success).toBe(true);
    expect(hondaResponse.data.vehicles).toHaveLength(2);
    
    // Search by year
    const year2022Response = await apiClient.get('/api/vehicles?year=2022');
    expect(year2022Response.success).toBe(true);
    expect(year2022Response.data.vehicles).toHaveLength(2);
  });

  test('Vehicle statistics and performance data', async () => {
    // Create vehicle
    const vehicleData = { name: 'Performance Car', make: 'Porsche', model: '911', year: 2024 };
    const createResponse = await apiClient.post('/api/vehicles', vehicleData);
    const vehicleId = createResponse.data.vehicle.id;

    // Add performance data
    const performanceData = {
      topSpeed: 200,
      acceleration: 3.2,
      horsePower: 450,
      weight: 1500
    };

    const updateResponse = await apiClient.put(`/api/vehicles/${vehicleId}/performance`, performanceData);
    expect(updateResponse.success).toBe(true);

    // Get vehicle with performance data
    const getResponse = await apiClient.get(`/api/vehicles/${vehicleId}`);
    expect(getResponse.success).toBe(true);
    expect(getResponse.data.vehicle.performance).toBeDefined();
    expect(getResponse.data.vehicle.performance.topSpeed).toBe(performanceData.topSpeed);
  });
});