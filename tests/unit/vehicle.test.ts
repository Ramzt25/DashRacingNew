/**
 * Unit Tests for Vehicle Service
 * Tests vehicle management logic and validation
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  userId: string;
  performance?: {
    horsePower?: number;
    torque?: number;
    topSpeed?: number;
    acceleration?: number;
    weight?: number;
  };
  stats?: {
    totalRaces: number;
    wins: number;
    totalDistance: number;
    bestTime?: number;
  };
}

class VehicleService {
  validateVehicleData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Vehicle name is required');
    }

    if (!data.make || typeof data.make !== 'string' || data.make.trim().length === 0) {
      errors.push('Vehicle make is required');
    }

    if (!data.model || typeof data.model !== 'string' || data.model.trim().length === 0) {
      errors.push('Vehicle model is required');
    }

    if (!data.year || typeof data.year !== 'number') {
      errors.push('Vehicle year is required and must be a number');
    }

    if (!data.userId || typeof data.userId !== 'string') {
      errors.push('User ID is required');
    }

    // Year validation
    const currentYear = new Date().getFullYear();
    if (data.year && (data.year < 1900 || data.year > currentYear + 1)) {
      errors.push(`Vehicle year must be between 1900 and ${currentYear + 1}`);
    }

    // Optional field validation
    if (data.color && typeof data.color !== 'string') {
      errors.push('Vehicle color must be a string');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validatePerformanceData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.horsePower !== undefined) {
      if (typeof data.horsePower !== 'number' || data.horsePower < 0 || data.horsePower > 2000) {
        errors.push('Horse power must be a number between 0 and 2000');
      }
    }

    if (data.torque !== undefined) {
      if (typeof data.torque !== 'number' || data.torque < 0 || data.torque > 1500) {
        errors.push('Torque must be a number between 0 and 1500');
      }
    }

    if (data.topSpeed !== undefined) {
      if (typeof data.topSpeed !== 'number' || data.topSpeed < 0 || data.topSpeed > 400) {
        errors.push('Top speed must be a number between 0 and 400 mph');
      }
    }

    if (data.acceleration !== undefined) {
      if (typeof data.acceleration !== 'number' || data.acceleration < 0 || data.acceleration > 20) {
        errors.push('Acceleration (0-60) must be a number between 0 and 20 seconds');
      }
    }

    if (data.weight !== undefined) {
      if (typeof data.weight !== 'number' || data.weight < 500 || data.weight > 10000) {
        errors.push('Weight must be a number between 500 and 10000 pounds');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  calculatePerformanceScore(performance: any): number {
    if (!performance) return 0;

    let score = 0;
    let factors = 0;

    // Horse power contribution (0-40 points)
    if (performance.horsePower) {
      score += Math.min(performance.horsePower / 25, 40);
      factors++;
    }

    // Top speed contribution (0-30 points)
    if (performance.topSpeed) {
      score += Math.min(performance.topSpeed / 5, 30);
      factors++;
    }

    // Acceleration contribution (0-30 points, lower is better)
    if (performance.acceleration) {
      score += Math.max(30 - (performance.acceleration * 3), 0);
      factors++;
    }

    // Weight penalty (lighter is better)
    if (performance.weight) {
      const weightPenalty = Math.max((performance.weight - 2500) / 100, 0);
      score = Math.max(score - weightPenalty, 0);
    }

    return factors > 0 ? Math.round(score / factors * 10) / 10 : 0;
  }

  generateVehicleStats(vehicle: Vehicle, raceHistory: any[] = []): any {
    const stats = {
      totalRaces: raceHistory.length,
      wins: raceHistory.filter(race => race.position === 1).length,
      totalDistance: raceHistory.reduce((sum, race) => sum + (race.distance || 0), 0),
      bestTime: raceHistory.length > 0 ? Math.min(...raceHistory.map(race => race.time || Infinity)) : undefined,
      averageSpeed: 0,
      winRate: 0
    };

    if (stats.totalRaces > 0) {
      stats.winRate = Math.round((stats.wins / stats.totalRaces) * 100);
      
      const totalTime = raceHistory.reduce((sum, race) => sum + (race.time || 0), 0);
      if (totalTime > 0 && stats.totalDistance > 0) {
        stats.averageSpeed = Math.round((stats.totalDistance / totalTime) * 3600 * 100) / 100; // mph
      }
    }

    return stats;
  }

  sanitizeVehicleData(vehicle: any): Vehicle {
    return {
      id: vehicle.id,
      name: vehicle.name?.trim(),
      make: vehicle.make?.trim(),
      model: vehicle.model?.trim(),
      year: vehicle.year,
      color: vehicle.color?.trim(),
      userId: vehicle.userId,
      performance: vehicle.performance,
      stats: vehicle.stats
    };
  }

  searchVehicles(vehicles: Vehicle[], query: string): Vehicle[] {
    if (!query || query.trim().length === 0) {
      return vehicles;
    }

    const searchTerm = query.toLowerCase().trim();
    
    return vehicles.filter(vehicle => 
      vehicle.name.toLowerCase().includes(searchTerm) ||
      vehicle.make.toLowerCase().includes(searchTerm) ||
      vehicle.model.toLowerCase().includes(searchTerm) ||
      vehicle.year.toString().includes(searchTerm) ||
      (vehicle.color && vehicle.color.toLowerCase().includes(searchTerm))
    );
  }

  filterVehicles(vehicles: Vehicle[], filters: any): Vehicle[] {
    let filtered = [...vehicles];

    if (filters.make) {
      filtered = filtered.filter(v => v.make.toLowerCase() === filters.make.toLowerCase());
    }

    if (filters.model) {
      filtered = filtered.filter(v => v.model.toLowerCase() === filters.model.toLowerCase());
    }

    if (filters.year) {
      filtered = filtered.filter(v => v.year === parseInt(filters.year));
    }

    if (filters.minYear && filters.maxYear) {
      filtered = filtered.filter(v => v.year >= filters.minYear && v.year <= filters.maxYear);
    }

    if (filters.color) {
      filtered = filtered.filter(v => v.color && v.color.toLowerCase() === filters.color.toLowerCase());
    }

    if (filters.minHorsePower) {
      filtered = filtered.filter(v => 
        v.performance?.horsePower && v.performance.horsePower >= filters.minHorsePower
      );
    }

    return filtered;
  }

  sortVehicles(vehicles: Vehicle[], sortBy: string, order: 'asc' | 'desc' = 'asc'): Vehicle[] {
    const sorted = [...vehicles];

    sorted.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortBy) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'make':
          valueA = a.make.toLowerCase();
          valueB = b.make.toLowerCase();
          break;
        case 'year':
          valueA = a.year;
          valueB = b.year;
          break;
        case 'horsePower':
          valueA = a.performance?.horsePower || 0;
          valueB = b.performance?.horsePower || 0;
          break;
        case 'performanceScore':
          valueA = this.calculatePerformanceScore(a.performance);
          valueB = this.calculatePerformanceScore(b.performance);
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return order === 'asc' ? -1 : 1;
      if (valueA > valueB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }
}

describe('VehicleService Unit Tests', () => {
  let vehicleService: VehicleService;

  beforeEach(() => {
    vehicleService = new VehicleService();
  });

  describe('Vehicle Data Validation', () => {
    test('Validate complete vehicle data', () => {
      const validVehicle = {
        name: 'My Race Car',
        make: 'Toyota',
        model: 'Supra',
        year: 2023,
        color: 'Red',
        userId: 'user123'
      };

      const result = vehicleService.validateVehicleData(validVehicle);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('Validate required fields', () => {
      const invalidVehicle = {
        color: 'Blue'
      };

      const result = vehicleService.validateVehicleData(invalidVehicle);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Vehicle name is required');
      expect(result.errors).toContain('Vehicle make is required');
      expect(result.errors).toContain('Vehicle model is required');
      expect(result.errors).toContain('Vehicle year is required and must be a number');
      expect(result.errors).toContain('User ID is required');
    });

    test('Validate year range', () => {
      const currentYear = new Date().getFullYear();
      
      const invalidYears = [
        { year: 1800, expectedError: true },
        { year: currentYear + 5, expectedError: true },
        { year: 2000, expectedError: false },
        { year: currentYear, expectedError: false }
      ];

      invalidYears.forEach(({ year, expectedError }) => {
        const vehicle = {
          name: 'Test Car',
          make: 'Test',
          model: 'Test',
          year,
          userId: 'user123'
        };

        const result = vehicleService.validateVehicleData(vehicle);
        
        if (expectedError) {
          expect(result.valid).toBe(false);
          expect(result.errors.some(error => error.includes('year must be between'))).toBe(true);
        } else {
          expect(result.valid).toBe(true);
        }
      });
    });
  });

  describe('Performance Data Validation', () => {
    test('Validate performance specifications', () => {
      const validPerformance = {
        horsePower: 400,
        torque: 350,
        topSpeed: 180,
        acceleration: 4.2,
        weight: 3200
      };

      const result = vehicleService.validatePerformanceData(validPerformance);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('Validate performance value ranges', () => {
      const invalidSpecs = [
        { horsePower: -100, expectedError: 'Horse power must be a number between 0 and 2000' },
        { horsePower: 3000, expectedError: 'Horse power must be a number between 0 and 2000' },
        { topSpeed: -50, expectedError: 'Top speed must be a number between 0 and 400 mph' },
        { acceleration: -1, expectedError: 'Acceleration (0-60) must be a number between 0 and 20 seconds' },
        { weight: 100, expectedError: 'Weight must be a number between 500 and 10000 pounds' }
      ];

      invalidSpecs.forEach(spec => {
        const result = vehicleService.validatePerformanceData(spec);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(spec.expectedError);
      });
    });
  });

  describe('Performance Score Calculation', () => {
    test('Calculate performance score with all data', () => {
      const performance = {
        horsePower: 500,
        topSpeed: 200,
        acceleration: 3.5,
        weight: 3000
      };

      const score = vehicleService.calculatePerformanceScore(performance);
      expect(score).toBeGreaterThan(0);
      expect(typeof score).toBe('number');
    });

    test('Handle missing performance data', () => {
      const score = vehicleService.calculatePerformanceScore(null);
      expect(score).toBe(0);

      const emptyPerformance = {};
      const emptyScore = vehicleService.calculatePerformanceScore(emptyPerformance);
      expect(emptyScore).toBe(0);
    });

    test('Score calculation consistency', () => {
      const highPerformance = {
        horsePower: 800,
        topSpeed: 250,
        acceleration: 2.5,
        weight: 2800
      };

      const lowPerformance = {
        horsePower: 200,
        topSpeed: 120,
        acceleration: 8.0,
        weight: 4000
      };

      const highScore = vehicleService.calculatePerformanceScore(highPerformance);
      const lowScore = vehicleService.calculatePerformanceScore(lowPerformance);

      expect(highScore).toBeGreaterThan(lowScore);
    });
  });

  describe('Vehicle Statistics Generation', () => {
    test('Generate stats from race history', () => {
      const vehicle: Vehicle = {
        id: 'v1',
        name: 'Test Car',
        make: 'Test',
        model: 'Car',
        year: 2023,
        userId: 'user1'
      };

      const raceHistory = [
        { position: 1, distance: 10, time: 600 }, // 1st place, 10 miles, 10 minutes
        { position: 2, distance: 15, time: 900 }, // 2nd place, 15 miles, 15 minutes
        { position: 1, distance: 8, time: 480 }   // 1st place, 8 miles, 8 minutes
      ];

      const stats = vehicleService.generateVehicleStats(vehicle, raceHistory);

      expect(stats.totalRaces).toBe(3);
      expect(stats.wins).toBe(2);
      expect(stats.totalDistance).toBe(33);
      expect(stats.bestTime).toBe(480);
      expect(stats.winRate).toBe(67); // 2/3 * 100
    });

    test('Handle empty race history', () => {
      const vehicle: Vehicle = {
        id: 'v1',
        name: 'Test Car',
        make: 'Test',
        model: 'Car',
        year: 2023,
        userId: 'user1'
      };

      const stats = vehicleService.generateVehicleStats(vehicle, []);

      expect(stats.totalRaces).toBe(0);
      expect(stats.wins).toBe(0);
      expect(stats.totalDistance).toBe(0);
      expect(stats.bestTime).toBeUndefined();
      expect(stats.winRate).toBe(0);
    });
  });

  describe('Data Sanitization', () => {
    test('Sanitize vehicle input data', () => {
      const dirtyData = {
        id: 'v1',
        name: '  My Car  ',
        make: '  Toyota  ',
        model: '  Camry  ',
        year: 2023,
        color: '  Blue  ',
        userId: 'user1',
        extraField: 'should be removed'
      };

      const sanitized = vehicleService.sanitizeVehicleData(dirtyData);

      expect(sanitized.name).toBe('My Car');
      expect(sanitized.make).toBe('Toyota');
      expect(sanitized.model).toBe('Camry');
      expect(sanitized.color).toBe('Blue');
      expect(sanitized).not.toHaveProperty('extraField');
    });
  });

  describe('Vehicle Search and Filtering', () => {
    const sampleVehicles: Vehicle[] = [
      {
        id: 'v1',
        name: 'Red Speed',
        make: 'Ferrari',
        model: '488 GTB',
        year: 2022,
        color: 'Red',
        userId: 'user1',
        performance: { horsePower: 661 }
      },
      {
        id: 'v2',
        name: 'Blue Thunder',
        make: 'BMW',
        model: 'M3',
        year: 2023,
        color: 'Blue',
        userId: 'user1',
        performance: { horsePower: 473 }
      },
      {
        id: 'v3',
        name: 'Green Machine',
        make: 'Porsche',
        model: '911',
        year: 2022,
        color: 'Green',
        userId: 'user1',
        performance: { horsePower: 379 }
      }
    ];

    test('Search vehicles by text', () => {
      const searchResults = vehicleService.searchVehicles(sampleVehicles, 'Ferrari');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].make).toBe('Ferrari');

      const colorSearch = vehicleService.searchVehicles(sampleVehicles, 'Blue');
      expect(colorSearch).toHaveLength(1);
      expect(colorSearch[0].color).toBe('Blue');

      const yearSearch = vehicleService.searchVehicles(sampleVehicles, '2023');
      expect(yearSearch).toHaveLength(1);
      expect(yearSearch[0].year).toBe(2023);
    });

    test('Filter vehicles by criteria', () => {
      const makeFilter = vehicleService.filterVehicles(sampleVehicles, { make: 'BMW' });
      expect(makeFilter).toHaveLength(1);
      expect(makeFilter[0].make).toBe('BMW');

      const yearFilter = vehicleService.filterVehicles(sampleVehicles, { year: 2022 });
      expect(yearFilter).toHaveLength(2);

      const powerFilter = vehicleService.filterVehicles(sampleVehicles, { minHorsePower: 500 });
      expect(powerFilter).toHaveLength(1);
      expect(powerFilter[0].performance?.horsePower).toBeGreaterThanOrEqual(500);
    });

    test('Sort vehicles by different criteria', () => {
      const sortedByName = vehicleService.sortVehicles(sampleVehicles, 'name', 'asc');
      expect(sortedByName[0].name).toBe('Blue Thunder');
      expect(sortedByName[2].name).toBe('Red Speed');

      const sortedByYear = vehicleService.sortVehicles(sampleVehicles, 'year', 'desc');
      expect(sortedByYear[0].year).toBe(2023);

      const sortedByPower = vehicleService.sortVehicles(sampleVehicles, 'horsePower', 'desc');
      expect(sortedByPower[0].performance?.horsePower).toBe(661);
    });

    test('Handle edge cases in search and filter', () => {
      const emptySearch = vehicleService.searchVehicles(sampleVehicles, '');
      expect(emptySearch).toHaveLength(3);

      const noResults = vehicleService.searchVehicles(sampleVehicles, 'Tesla');
      expect(noResults).toHaveLength(0);

      const emptyFilter = vehicleService.filterVehicles(sampleVehicles, {});
      expect(emptyFilter).toHaveLength(3);
    });
  });
});