import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserPreferences, Vehicle, Race } from '../../../shared/types';

// Storage Keys
const STORAGE_KEYS = {
  USER: '@dash_racing_user',
  USER_PREFERENCES: '@dash_racing_preferences',
  VEHICLES: '@dash_racing_vehicles',
  SELECTED_VEHICLE: '@dash_racing_selected_vehicle',
  RECENT_RACES: '@dash_racing_recent_races',
  FRIENDS: '@dash_racing_friends',
  ONBOARDING_COMPLETE: '@dash_racing_onboarding',
  LOCATION_PERMISSION: '@dash_racing_location_permission',
  NOTIFICATION_SETTINGS: '@dash_racing_notifications',
  THEME_SETTINGS: '@dash_racing_theme',
  APP_VERSION: '@dash_racing_app_version',
  CACHE_TIMESTAMP: '@dash_racing_cache_timestamp',
} as const;

class StorageService {
  // User Management
  async setUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user:', error);
      throw new Error('Failed to save user data');
    }
  }

  async getUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
      console.error('Failed to remove user:', error);
    }
  }

  // User Preferences
  async setUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw new Error('Failed to save user preferences');
    }
  }

  async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const preferencesData = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return preferencesData ? JSON.parse(preferencesData) : null;
    } catch (error) {
      console.error('Failed to get preferences:', error);
      return null;
    }
  }

  // Default preferences for new users
  getDefaultPreferences(): UserPreferences {
    return {
      notifications: true,
      location: true,
      units: 'imperial',
      soundEnabled: true,
      vibrationEnabled: true,
    };
  }

  // Vehicle Management
  async setVehicles(vehicles: Vehicle[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
    } catch (error) {
      console.error('Failed to save vehicles:', error);
      throw new Error('Failed to save vehicles');
    }
  }

  async getVehicles(): Promise<Vehicle[]> {
    try {
      const vehiclesData = await AsyncStorage.getItem(STORAGE_KEYS.VEHICLES);
      return vehiclesData ? JSON.parse(vehiclesData) : [];
    } catch (error) {
      console.error('Failed to get vehicles:', error);
      return [];
    }
  }

  async addVehicle(vehicle: Vehicle): Promise<void> {
    try {
      const vehicles = await this.getVehicles();
      vehicles.push(vehicle);
      await this.setVehicles(vehicles);
    } catch (error) {
      console.error('Failed to add vehicle:', error);
      throw new Error('Failed to add vehicle');
    }
  }

  async removeVehicle(vehicleId: string): Promise<void> {
    try {
      const vehicles = await this.getVehicles();
      const filteredVehicles = vehicles.filter(v => v.id !== vehicleId);
      await this.setVehicles(filteredVehicles);
    } catch (error) {
      console.error('Failed to remove vehicle:', error);
      throw new Error('Failed to remove vehicle');
    }
  }

  async setSelectedVehicle(vehicleId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_VEHICLE, vehicleId);
    } catch (error) {
      console.error('Failed to set selected vehicle:', error);
      throw new Error('Failed to set selected vehicle');
    }
  }

  async getSelectedVehicle(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_VEHICLE);
    } catch (error) {
      console.error('Failed to get selected vehicle:', error);
      return null;
    }
  }

  // Race Management
  async setRecentRaces(races: Race[]): Promise<void> {
    try {
      // Keep only last 50 races for performance
      const recentRaces = races.slice(0, 50);
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_RACES, JSON.stringify(recentRaces));
    } catch (error) {
      console.error('Failed to save recent races:', error);
    }
  }

  async getRecentRaces(): Promise<Race[]> {
    try {
      const racesData = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_RACES);
      return racesData ? JSON.parse(racesData) : [];
    } catch (error) {
      console.error('Failed to get recent races:', error);
      return [];
    }
  }

  // App State Management
  async setOnboardingComplete(complete: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, complete.toString());
    } catch (error) {
      console.error('Failed to set onboarding status:', error);
    }
  }

  async isOnboardingComplete(): Promise<boolean> {
    try {
      const status = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
      return status === 'true';
    } catch (error) {
      console.error('Failed to get onboarding status:', error);
      return false;
    }
  }

  async setLocationPermission(granted: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_PERMISSION, granted.toString());
    } catch (error) {
      console.error('Failed to set location permission:', error);
    }
  }

  async getLocationPermission(): Promise<boolean> {
    try {
      const permission = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION_PERMISSION);
      return permission === 'true';
    } catch (error) {
      console.error('Failed to get location permission:', error);
      return false;
    }
  }

  // Cache Management
  async setCacheTimestamp(key: string): Promise<void> {
    try {
      const timestamp = Date.now().toString();
      await AsyncStorage.setItem(`${STORAGE_KEYS.CACHE_TIMESTAMP}_${key}`, timestamp);
    } catch (error) {
      console.error('Failed to set cache timestamp:', error);
    }
  }

  async getCacheTimestamp(key: string): Promise<number> {
    try {
      const timestamp = await AsyncStorage.getItem(`${STORAGE_KEYS.CACHE_TIMESTAMP}_${key}`);
      return timestamp ? parseInt(timestamp, 10) : 0;
    } catch (error) {
      console.error('Failed to get cache timestamp:', error);
      return 0;
    }
  }

  async isCacheValid(key: string, maxAgeMinutes: number = 30): Promise<boolean> {
    try {
      const timestamp = await this.getCacheTimestamp(key);
      const now = Date.now();
      const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds
      return (now - timestamp) < maxAge;
    } catch (error) {
      console.error('Failed to check cache validity:', error);
      return false;
    }
  }

  // Bulk Operations
  async clearUserData(): Promise<void> {
    try {
      const keysToRemove = [
        STORAGE_KEYS.USER,
        STORAGE_KEYS.USER_PREFERENCES,
        STORAGE_KEYS.VEHICLES,
        STORAGE_KEYS.SELECTED_VEHICLE,
        STORAGE_KEYS.RECENT_RACES,
        STORAGE_KEYS.FRIENDS,
      ];
      
      await AsyncStorage.multiRemove(keysToRemove);
    } catch (error) {
      console.error('Failed to clear user data:', error);
      throw new Error('Failed to clear user data');
    }
  }

  async clearCache(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((key: string) => key.includes(STORAGE_KEYS.CACHE_TIMESTAMP));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // Backup and Restore
  async exportUserData(): Promise<string> {
    try {
      const userData = {
        user: await this.getUser(),
        preferences: await this.getUserPreferences(),
        vehicles: await this.getVehicles(),
        selectedVehicle: await this.getSelectedVehicle(),
        recentRaces: await this.getRecentRaces(),
        exportDate: new Date().toISOString(),
      };
      
      return JSON.stringify(userData, null, 2);
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw new Error('Failed to export user data');
    }
  }

  async importUserData(dataString: string): Promise<void> {
    try {
      const data = JSON.parse(dataString);
      
      if (data.user) await this.setUser(data.user);
      if (data.preferences) await this.setUserPreferences(data.preferences);
      if (data.vehicles) await this.setVehicles(data.vehicles);
      if (data.selectedVehicle) await this.setSelectedVehicle(data.selectedVehicle);
      if (data.recentRaces) await this.setRecentRaces(data.recentRaces);
      
    } catch (error) {
      console.error('Failed to import user data:', error);
      throw new Error('Failed to import user data');
    }
  }

  // Utility Methods
  async getStorageSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to calculate storage size:', error);
      return 0;
    }
  }

  async logStorageInfo(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const size = await this.getStorageSize();
      
      console.log('=== DASH RACING STORAGE INFO ===');
      console.log(`Total Keys: ${keys.length}`);
      console.log(`Total Size: ${(size / 1024).toFixed(2)} KB`);
      console.log('Keys:', keys.filter((key: string) => key.includes('@dash_racing')));
      console.log('==============================');
    } catch (error) {
      console.error('Failed to log storage info:', error);
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;