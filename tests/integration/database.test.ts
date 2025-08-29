/**
 * Integration Tests for Database Operations
 * Tests database service integration with mock data
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { createTestUser, createTestVehicle, createTestRace } from '../utils/test-helpers';

// Mock the database service for integration testing
class MockDatabaseService {
  private users: Map<string, any> = new Map();
  private vehicles: Map<string, any> = new Map();
  private races: Map<string, any> = new Map();
  private friendships: Map<string, string[]> = new Map();

  // User operations
  async createUser(userData: any) {
    const user = {
      id: `user_${Date.now()}`,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.set(user.id, user);
    return { data: user, error: null };
  }

  async getUserByEmail(email: string) {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    return { data: user || null, error: null };
  }

  async getUserById(id: string) {
    const user = this.users.get(id);
    return { data: user || null, error: null };
  }

  async updateUser(id: string, updates: any) {
    const user = this.users.get(id);
    if (!user) return { data: null, error: 'User not found' };
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
    this.users.set(id, updatedUser);
    return { data: updatedUser, error: null };
  }

  async deleteUser(id: string) {
    const deleted = this.users.delete(id);
    return { data: deleted, error: deleted ? null : 'User not found' };
  }

  // Vehicle operations
  async createVehicle(vehicleData: any) {
    const vehicle = {
      id: `vehicle_${Date.now()}`,
      ...vehicleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.vehicles.set(vehicle.id, vehicle);
    return { data: vehicle, error: null };
  }

  async getVehiclesByUserId(userId: string) {
    const userVehicles = Array.from(this.vehicles.values()).filter(v => v.userId === userId);
    return { data: userVehicles, error: null };
  }

  async getVehicleById(id: string) {
    const vehicle = this.vehicles.get(id);
    return { data: vehicle || null, error: null };
  }

  async updateVehicle(id: string, updates: any) {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return { data: null, error: 'Vehicle not found' };
    
    const updatedVehicle = { ...vehicle, ...updates, updatedAt: new Date().toISOString() };
    this.vehicles.set(id, updatedVehicle);
    return { data: updatedVehicle, error: null };
  }

  async deleteVehicle(id: string) {
    const deleted = this.vehicles.delete(id);
    return { data: deleted, error: deleted ? null : 'Vehicle not found' };
  }

  // Race operations
  async createRace(raceData: any) {
    const race = {
      id: `race_${Date.now()}`,
      ...raceData,
      status: 'pending',
      participants: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.races.set(race.id, race);
    return { data: race, error: null };
  }

  async getRaces(filters: any = {}) {
    let races = Array.from(this.races.values());
    
    if (filters.status) {
      races = races.filter(r => r.status === filters.status);
    }
    if (filters.raceType) {
      races = races.filter(r => r.raceType === filters.raceType);
    }
    
    return { data: races, error: null };
  }

  async getRaceById(id: string) {
    const race = this.races.get(id);
    return { data: race || null, error: null };
  }

  async updateRace(id: string, updates: any) {
    const race = this.races.get(id);
    if (!race) return { data: null, error: 'Race not found' };
    
    const updatedRace = { ...race, ...updates, updatedAt: new Date().toISOString() };
    this.races.set(id, updatedRace);
    return { data: updatedRace, error: null };
  }

  async joinRace(raceId: string, userId: string) {
    const race = this.races.get(raceId);
    if (!race) return { data: null, error: 'Race not found' };
    
    if (race.participants.includes(userId)) {
      return { data: null, error: 'Already joined' };
    }
    
    if (race.participants.length >= race.maxParticipants) {
      return { data: null, error: 'Race full' };
    }
    
    race.participants.push(userId);
    this.races.set(raceId, race);
    return { data: race, error: null };
  }

  async leaveRace(raceId: string, userId: string) {
    const race = this.races.get(raceId);
    if (!race) return { data: null, error: 'Race not found' };
    
    const index = race.participants.indexOf(userId);
    if (index === -1) return { data: null, error: 'Not in race' };
    
    race.participants.splice(index, 1);
    this.races.set(raceId, race);
    return { data: race, error: null };
  }

  // Friend operations
  async addFriend(userId: string, friendId: string) {
    if (!this.friendships.has(userId)) {
      this.friendships.set(userId, []);
    }
    if (!this.friendships.has(friendId)) {
      this.friendships.set(friendId, []);
    }
    
    this.friendships.get(userId)!.push(friendId);
    this.friendships.get(friendId)!.push(userId);
    
    return { data: true, error: null };
  }

  async getFriends(userId: string) {
    const friendIds = this.friendships.get(userId) || [];
    const friends = friendIds.map(id => this.users.get(id)).filter(Boolean);
    return { data: friends, error: null };
  }

  // Cleanup for testing
  clearAll() {
    this.users.clear();
    this.vehicles.clear();
    this.races.clear();
    this.friendships.clear();
  }
}

describe('Database Integration Tests', () => {
  let db: MockDatabaseService;

  beforeEach(() => {
    db = new MockDatabaseService();
  });

  describe('User Management', () => {
    test('Create and retrieve user', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: 'hashedpassword'
      };

      const createResult = await db.createUser(userData);
      expect(createResult.error).toBeNull();
      expect(createResult.data).toHaveProperty('id');
      expect(createResult.data.email).toBe(userData.email);

      const getResult = await db.getUserByEmail(userData.email);
      expect(getResult.error).toBeNull();
      expect(getResult.data?.email).toBe(userData.email);
    });

    test('Update user profile', async () => {
      const user = createTestUser();
      const createResult = await db.createUser(user);
      const userId = createResult.data.id;

      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'New bio'
      };

      const updateResult = await db.updateUser(userId, updates);
      expect(updateResult.error).toBeNull();
      expect(updateResult.data.firstName).toBe(updates.firstName);
      expect(updateResult.data.bio).toBe(updates.bio);

      const getResult = await db.getUserById(userId);
      expect(getResult.data.firstName).toBe(updates.firstName);
    });

    test('Handle non-existent user operations', async () => {
      const getResult = await db.getUserById('non-existent-id');
      expect(getResult.data).toBeNull();

      const updateResult = await db.updateUser('non-existent-id', { firstName: 'Test' });
      expect(updateResult.error).toBe('User not found');

      const deleteResult = await db.deleteUser('non-existent-id');
      expect(deleteResult.error).toBe('User not found');
    });
  });

  describe('Vehicle Management', () => {
    test('Create and manage vehicles', async () => {
      const user = createTestUser();
      const userResult = await db.createUser(user);
      const userId = userResult.data.id;

      const vehicleData = createTestVehicle(userId);
      const createResult = await db.createVehicle(vehicleData);
      
      expect(createResult.error).toBeNull();
      expect(createResult.data).toHaveProperty('id');
      expect(createResult.data.userId).toBe(userId);

      const getUserVehiclesResult = await db.getVehiclesByUserId(userId);
      expect(getUserVehiclesResult.data).toHaveLength(1);
      expect(getUserVehiclesResult.data[0].name).toBe(vehicleData.name);
    });

    test('Update vehicle information', async () => {
      const user = createTestUser();
      const userResult = await db.createUser(user);
      const userId = userResult.data.id;

      const vehicleData = createTestVehicle(userId);
      const createResult = await db.createVehicle(vehicleData);
      const vehicleId = createResult.data.id;

      const updates = {
        name: 'Updated Car Name',
        color: 'Blue',
        mileage: 25000
      };

      const updateResult = await db.updateVehicle(vehicleId, updates);
      expect(updateResult.error).toBeNull();
      expect(updateResult.data.name).toBe(updates.name);
      expect(updateResult.data.color).toBe(updates.color);
    });

    test('Vehicle ownership isolation', async () => {
      const user1 = createTestUser();
      const user2 = createTestUser();
      
      const user1Result = await db.createUser(user1);
      const user2Result = await db.createUser(user2);
      
      const user1Id = user1Result.data.id;
      const user2Id = user2Result.data.id;

      // Create vehicles for both users
      await db.createVehicle(createTestVehicle(user1Id, { name: 'User1 Car' }));
      await db.createVehicle(createTestVehicle(user2Id, { name: 'User2 Car' }));

      // Each user should only see their own vehicles
      const user1Vehicles = await db.getVehiclesByUserId(user1Id);
      const user2Vehicles = await db.getVehiclesByUserId(user2Id);

      expect(user1Vehicles.data).toHaveLength(1);
      expect(user2Vehicles.data).toHaveLength(1);
      expect(user1Vehicles.data[0].name).toBe('User1 Car');
      expect(user2Vehicles.data[0].name).toBe('User2 Car');
    });
  });

  describe('Race Management', () => {
    test('Create and manage race lifecycle', async () => {
      const user = createTestUser();
      const userResult = await db.createUser(user);
      const userId = userResult.data.id;

      const raceData = createTestRace(userId);
      const createResult = await db.createRace(raceData);

      expect(createResult.error).toBeNull();
      expect(createResult.data).toHaveProperty('id');
      expect(createResult.data.status).toBe('pending');
      expect(createResult.data.participants).toEqual([]);

      const raceId = createResult.data.id;

      // Join race
      const joinResult = await db.joinRace(raceId, userId);
      expect(joinResult.error).toBeNull();
      expect(joinResult.data.participants).toContain(userId);

      // Leave race
      const leaveResult = await db.leaveRace(raceId, userId);
      expect(leaveResult.error).toBeNull();
      expect(leaveResult.data.participants).not.toContain(userId);
    });

    test('Race capacity management', async () => {
      const user1 = createTestUser();
      const user2 = createTestUser();
      
      const user1Result = await db.createUser(user1);
      const user2Result = await db.createUser(user2);
      
      const user1Id = user1Result.data.id;
      const user2Id = user2Result.data.id;

      // Create race with max 1 participant
      const raceData = createTestRace(user1Id, { maxParticipants: 1 });
      const createResult = await db.createRace(raceData);
      const raceId = createResult.data.id;

      // First user joins successfully
      const join1Result = await db.joinRace(raceId, user1Id);
      expect(join1Result.error).toBeNull();

      // Second user should be rejected
      const join2Result = await db.joinRace(raceId, user2Id);
      expect(join2Result.error).toBe('Race full');
    });

    test('Race filtering and search', async () => {
      const user = createTestUser();
      const userResult = await db.createUser(user);
      const userId = userResult.data.id;

      // Create different types of races
      await db.createRace(createTestRace(userId, { name: 'Street Race', raceType: 'street' }));
      await db.createRace(createTestRace(userId, { name: 'Circuit Race', raceType: 'circuit' }));
      await db.createRace(createTestRace(userId, { name: 'Drag Race', raceType: 'drag' }));

      // Filter by race type
      const streetRaces = await db.getRaces({ raceType: 'street' });
      const circuitRaces = await db.getRaces({ raceType: 'circuit' });

      expect(streetRaces.data).toHaveLength(1);
      expect(circuitRaces.data).toHaveLength(1);
      expect(streetRaces.data[0].raceType).toBe('street');
      expect(circuitRaces.data[0].raceType).toBe('circuit');

      // Filter by status
      const pendingRaces = await db.getRaces({ status: 'pending' });
      expect(pendingRaces.data).toHaveLength(3); // All created races are pending
    });

    test('Prevent duplicate race participation', async () => {
      const user = createTestUser();
      const userResult = await db.createUser(user);
      const userId = userResult.data.id;

      const raceData = createTestRace(userId);
      const createResult = await db.createRace(raceData);
      const raceId = createResult.data.id;

      // Join race first time
      const join1Result = await db.joinRace(raceId, userId);
      expect(join1Result.error).toBeNull();

      // Try to join again
      const join2Result = await db.joinRace(raceId, userId);
      expect(join2Result.error).toBe('Already joined');
    });
  });

  describe('Social Features', () => {
    test('Friend management', async () => {
      const user1 = createTestUser();
      const user2 = createTestUser();
      
      const user1Result = await db.createUser(user1);
      const user2Result = await db.createUser(user2);
      
      const user1Id = user1Result.data.id;
      const user2Id = user2Result.data.id;

      // Add friendship
      const addFriendResult = await db.addFriend(user1Id, user2Id);
      expect(addFriendResult.error).toBeNull();

      // Check friends lists
      const user1Friends = await db.getFriends(user1Id);
      const user2Friends = await db.getFriends(user2Id);

      expect(user1Friends.data).toHaveLength(1);
      expect(user2Friends.data).toHaveLength(1);
      expect(user1Friends.data[0].id).toBe(user2Id);
      expect(user2Friends.data[0].id).toBe(user1Id);
    });
  });

  describe('Data Consistency and Validation', () => {
    test('Timestamp tracking', async () => {
      const user = createTestUser();
      const createResult = await db.createUser(user);
      const userId = createResult.data.id;

      const originalCreatedAt = createResult.data.createdAt;
      const originalUpdatedAt = createResult.data.updatedAt;

      expect(originalCreatedAt).toBeTruthy();
      expect(originalUpdatedAt).toBeTruthy();

      // Wait a moment then update
      await new Promise(resolve => setTimeout(resolve, 10));

      const updateResult = await db.updateUser(userId, { firstName: 'Updated' });
      const newUpdatedAt = updateResult.data.updatedAt;

      expect(updateResult.data.createdAt).toBe(originalCreatedAt); // Should not change
      expect(newUpdatedAt).not.toBe(originalUpdatedAt); // Should be updated
      expect(new Date(newUpdatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());
    });

    test('Data integrity across operations', async () => {
      const user = createTestUser();
      const userResult = await db.createUser(user);
      const userId = userResult.data.id;

      // Create multiple vehicles
      const vehicle1 = await db.createVehicle(createTestVehicle(userId, { name: 'Car 1' }));
      const vehicle2 = await db.createVehicle(createTestVehicle(userId, { name: 'Car 2' }));

      // Create race
      const race = await db.createRace(createTestRace(userId));
      const raceId = race.data.id;

      // Join race
      await db.joinRace(raceId, userId);

      // Verify all data is consistent
      const userVehicles = await db.getVehiclesByUserId(userId);
      const userRace = await db.getRaceById(raceId);

      expect(userVehicles.data).toHaveLength(2);
      expect(userRace.data.participants).toContain(userId);
      expect(userRace.data.createdBy).toBe(userId);
    });
  });
});