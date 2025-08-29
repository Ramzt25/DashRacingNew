/**
 * Test Utilities for DASH RACING
 * Common functions and helpers used across all test suites
 */

import { ChildProcess, spawn } from 'child_process';

// Counter to ensure unique IDs in tests
let testIdCounter = 0;

export interface TestUser {
  id: string;
  email: string;
  username: string;
  token?: string;
}

export interface TestVehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  userId: string;
}

export interface TestRace {
  id: string;
  name: string;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  status: 'pending' | 'active' | 'completed';
  createdBy: string;
  maxParticipants?: number;
  raceType?: 'street' | 'circuit' | 'drag';
}

/**
 * Create a test user with valid credentials
 */
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  const uniqueId = `${Date.now()}_${++testIdCounter}`;
  return {
    id: `test-user-${uniqueId}`,
    email: `test${uniqueId}@gmail.com`, // Use gmail.com for Supabase compatibility
    username: `testuser${uniqueId}`,
    ...overrides
  };
}

/**
 * Create a test vehicle
 */
export function createTestVehicle(userId: string, overrides: Partial<TestVehicle> = {}): TestVehicle {
  const uniqueId = `${Date.now()}_${++testIdCounter}`;
  return {
    id: `test-vehicle-${uniqueId}`,
    name: 'Test Car',
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    userId,
    ...overrides
  };
}

/**
 * Create a test race
 */
export function createTestRace(createdBy: string, overrides: Partial<TestRace> = {}): TestRace {
  const uniqueId = `${Date.now()}_${++testIdCounter}`;
  return {
    id: `test-race-${uniqueId}`,
    name: 'Test Race',
    startLocation: { lat: 40.7128, lng: -74.0060 }, // NYC
    endLocation: { lat: 40.7589, lng: -73.9851 }, // Times Square
    status: 'pending',
    createdBy,
    ...overrides
  };
}

/**
 * Wait for a condition to be true with timeout
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Generate random coordinates for testing
 */
export function generateRandomLocation(): { lat: number; lng: number } {
  return {
    lat: 40.7128 + (Math.random() - 0.5) * 0.1, // NYC area
    lng: -74.0060 + (Math.random() - 0.5) * 0.1
  };
}

/**
 * Sleep utility for tests
 */
export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if server is responding
 */
export async function isServerReady(url: string): Promise<boolean> {
  try {
    // Using fetch instead of axios to avoid dependency issues
    const response = await fetch(`${url}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Kill process by name (Windows compatible)
 */
export function killProcess(name: string): Promise<void> {
  return new Promise((resolve) => {
    const killCmd = process.platform === 'win32' 
      ? `taskkill /F /IM ${name}.exe /T`
      : `pkill -f ${name}`;
    
    const proc = spawn(killCmd, { shell: true, stdio: 'ignore' });
    proc.on('close', () => resolve());
    proc.on('error', () => resolve()); // Don't fail if process doesn't exist
  });
}

/**
 * Clean up test data patterns
 */
export const TEST_DATA_PATTERNS = {
  users: /^test-user-\d+$/,
  vehicles: /^test-vehicle-\d+$/,
  races: /^test-race-\d+$/,
  emails: /^test\d+@gmail\.com$/ // Updated for gmail.com
};