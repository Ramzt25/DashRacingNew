import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { User, Vehicle, UserPreferences, Race, Friend } from '../../../shared/types';
import { storageService } from '../services/storage';
import { apiService } from '../services/api';

// App State Interface
interface AppState {
  // Authentication
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;

  // User Data
  preferences: UserPreferences;
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;

  // Racing Data
  nearbyRaces: Race[];
  recentRaces: Race[];
  activeRace: Race | null;

  // Social Data
  friends: Friend[];
  onlineFriends: Friend[];

  // App State
  isOnboardingComplete: boolean;
  hasLocationPermission: boolean;
  isConnected: boolean;
  lastSync: Date | null;

  // UI State
  activeTab: string;
  isMapVisible: boolean;
  notifications: any[];
}

// Initial State
const initialState: AppState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,

  preferences: {
    notifications: true,
    location: true,
    units: 'imperial',
    soundEnabled: true,
    vibrationEnabled: true,
  },
  vehicles: [],
  selectedVehicle: null,

  nearbyRaces: [],
  recentRaces: [],
  activeRace: null,

  friends: [],
  onlineFriends: [],

  isOnboardingComplete: false,
  hasLocationPermission: false,
  isConnected: true,
  lastSync: null,

  activeTab: 'Home',
  isMapVisible: false,
  notifications: [],
};

// Action Types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_PREFERENCES'; payload: UserPreferences }
  | { type: 'SET_VEHICLES'; payload: Vehicle[] }
  | { type: 'ADD_VEHICLE'; payload: Vehicle }
  | { type: 'REMOVE_VEHICLE'; payload: string }
  | { type: 'SET_SELECTED_VEHICLE'; payload: Vehicle | null }
  | { type: 'SET_NEARBY_RACES'; payload: Race[] }
  | { type: 'SET_RECENT_RACES'; payload: Race[] }
  | { type: 'SET_ACTIVE_RACE'; payload: Race | null }
  | { type: 'SET_FRIENDS'; payload: Friend[] }
  | { type: 'SET_ONLINE_FRIENDS'; payload: Friend[] }
  | { type: 'SET_ONBOARDING_COMPLETE'; payload: boolean }
  | { type: 'SET_LOCATION_PERMISSION'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_LAST_SYNC'; payload: Date }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'SET_MAP_VISIBLE'; payload: boolean }
  | { type: 'ADD_NOTIFICATION'; payload: any }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'RESET_STATE' };

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };

    case 'SET_USER':
      return { ...state, user: action.payload };

    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload };

    case 'SET_VEHICLES':
      return { ...state, vehicles: action.payload };

    case 'ADD_VEHICLE':
      return { 
        ...state, 
        vehicles: [...state.vehicles, action.payload],
        selectedVehicle: state.vehicles.length === 0 ? action.payload : state.selectedVehicle
      };

    case 'REMOVE_VEHICLE':
      const filteredVehicles = state.vehicles.filter(v => v.id !== action.payload);
      const newSelectedVehicle = state.selectedVehicle?.id === action.payload 
        ? (filteredVehicles.length > 0 ? filteredVehicles[0] : null)
        : state.selectedVehicle;
      
      return { 
        ...state, 
        vehicles: filteredVehicles,
        selectedVehicle: newSelectedVehicle
      };

    case 'SET_SELECTED_VEHICLE':
      return { ...state, selectedVehicle: action.payload };

    case 'SET_NEARBY_RACES':
      return { ...state, nearbyRaces: action.payload };

    case 'SET_RECENT_RACES':
      return { ...state, recentRaces: action.payload };

    case 'SET_ACTIVE_RACE':
      return { ...state, activeRace: action.payload };

    case 'SET_FRIENDS':
      return { ...state, friends: action.payload };

    case 'SET_ONLINE_FRIENDS':
      return { ...state, onlineFriends: action.payload };

    case 'SET_ONBOARDING_COMPLETE':
      return { ...state, isOnboardingComplete: action.payload };

    case 'SET_LOCATION_PERMISSION':
      return { ...state, hasLocationPermission: action.payload };

    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };

    case 'SET_LAST_SYNC':
      return { ...state, lastSync: action.payload };

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };

    case 'SET_MAP_VISIBLE':
      return { ...state, isMapVisible: action.payload };

    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [action.payload, ...state.notifications].slice(0, 50) // Keep last 50
      };

    case 'REMOVE_NOTIFICATION':
      return { 
        ...state, 
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };

    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };

    case 'RESET_STATE':
      return { ...initialState, isLoading: false };

    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: AppActions;
} | null>(null);

// Actions Interface
interface AppActions {
  // Authentication
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, username: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  loadUserData: () => Promise<void>;

  // User Management
  updateUser: (updates: Partial<User>) => Promise<void>;
  updatePreferences: (preferences: UserPreferences) => Promise<void>;

  // Vehicle Management
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt'>) => Promise<void>;
  removeVehicle: (vehicleId: string) => Promise<void>;
  selectVehicle: (vehicleId: string) => Promise<void>;
  loadVehicles: () => Promise<void>;

  // Race Management
  loadNearbyRaces: (lat: number, lng: number) => Promise<void>;
  loadRecentRaces: () => Promise<void>;
  joinRace: (raceId: string) => Promise<boolean>;
  leaveRace: (raceId: string) => Promise<boolean>;

  // App State
  setOnboardingComplete: (complete: boolean) => Promise<void>;
  setLocationPermission: (granted: boolean) => Promise<void>;
  syncData: () => Promise<void>;

  // UI Actions
  setActiveTab: (tab: string) => void;
  showNotification: (message: string, type?: 'info' | 'success' | 'error') => void;
  clearNotifications: () => void;
  clearCache: () => Promise<void>;
}

// Provider Component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Load cached data first
      await loadCachedData();

      // Check authentication
      try {
        const verifyResponse = await apiService.verifyToken();
        if (verifyResponse.success && verifyResponse.data) {
          const profileResponse = await apiService.getUserProfile();
          if (profileResponse.success && profileResponse.data) {
            dispatch({ type: 'SET_USER', payload: profileResponse.data });
            dispatch({ type: 'SET_AUTHENTICATED', payload: true });
            await loadUserDataHelper();
          }
        }
      } catch (error) {
        // Token is invalid or expired, user needs to login again
        console.log('No valid session found');
      }

      // Check onboarding status
      const onboardingComplete = await storageService.isOnboardingComplete();
      dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: onboardingComplete });

      // Check permissions
      const locationPermission = await storageService.getLocationPermission();
      dispatch({ type: 'SET_LOCATION_PERMISSION', payload: locationPermission });

    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadCachedData = async () => {
    try {
      const [cachedPreferences, cachedVehicles] = await Promise.all([
        storageService.getUserPreferences(),
        storageService.getVehicles(),
      ]);

      if (cachedPreferences) {
        dispatch({ type: 'SET_PREFERENCES', payload: cachedPreferences });
      }

      if (cachedVehicles.length > 0) {
        dispatch({ type: 'SET_VEHICLES', payload: cachedVehicles });
        
        const selectedVehicleId = await storageService.getSelectedVehicle();
        const selectedVehicle = cachedVehicles.find(v => v.id === selectedVehicleId) || cachedVehicles[0];
        dispatch({ type: 'SET_SELECTED_VEHICLE', payload: selectedVehicle });
      }
    } catch (error) {
      console.error('Failed to load cached data:', error);
    }
  };

  // Helper function for loading user data
  const loadUserDataHelper = async (): Promise<void> => {
    try {
      if (!state.user?.id) return;
      
      // Load vehicles
      const vehiclesResponse = await apiService.getUserVehicles();
      if (vehiclesResponse.success && vehiclesResponse.data) {
        dispatch({ type: 'SET_VEHICLES', payload: vehiclesResponse.data.vehicles });
      }

      // Load friends - simplified for now
      dispatch({ type: 'SET_FRIENDS', payload: [] });
      dispatch({ type: 'SET_RECENT_RACES', payload: [] });
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const actions: AppActions = {
    // Authentication
    signIn: async (email: string, password: string): Promise<boolean> => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const response = await apiService.login(email, password);
        if (response.success && response.data) {
          const user = response.data as User & { token: string };
          dispatch({ type: 'SET_USER', payload: user });
          dispatch({ type: 'SET_AUTHENTICATED', payload: true });
          
          await storageService.setUser(user);
          await loadUserDataHelper();
          
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Sign in failed:', error);
        return false;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    signUp: async (email: string, password: string, username: string): Promise<boolean> => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const response = await apiService.register(email, password, username);
        if (response.success && response.data) {
          const user = response.data as User & { token: string };
          dispatch({ type: 'SET_USER', payload: user });
          dispatch({ type: 'SET_AUTHENTICATED', payload: true });
          
          await storageService.setUser(user);
          
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Sign up failed:', error);
        return false;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    signOut: async (): Promise<void> => {
      try {
        await apiService.logout();
        await storageService.clearUserData();
        
        dispatch({ type: 'RESET_STATE' });
      } catch (error) {
        console.error('Sign out failed:', error);
      }
    },

    loadUserData: async (): Promise<void> => {
      try {
        if (!state.user) return;

        // Load user vehicles
        const vehiclesResponse = await apiService.getUserVehicles();
        if (vehiclesResponse.success && vehiclesResponse.data) {
          dispatch({ type: 'SET_VEHICLES', payload: vehiclesResponse.data.vehicles });
          await storageService.setVehicles(vehiclesResponse.data.vehicles);
          
          const selectedVehicleId = await storageService.getSelectedVehicle();
          const selectedVehicle = vehiclesResponse.data.vehicles.find((v: Vehicle) => v.id === selectedVehicleId) || vehiclesResponse.data.vehicles[0];
          if (selectedVehicle) {
            dispatch({ type: 'SET_SELECTED_VEHICLE', payload: selectedVehicle });
          }
        }

        dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    },

    // User Management
    updateUser: async (updates: Partial<User>): Promise<void> => {
      if (!state.user) return;

      try {
        const response = await apiService.updateUserProfile(updates);
        if (response.success && response.data) {
          dispatch({ type: 'SET_USER', payload: response.data });
          await storageService.setUser(response.data);
        }
      } catch (error) {
        console.error('Failed to update user:', error);
      }
    },

    updatePreferences: async (preferences: UserPreferences): Promise<void> => {
      try {
        dispatch({ type: 'SET_PREFERENCES', payload: preferences });
        await storageService.setUserPreferences(preferences);

        if (state.user) {
          await actions.updateUser({ preferences });
        }
      } catch (error) {
        console.error('Failed to update preferences:', error);
      }
    },

    // Vehicle Management
    addVehicle: async (vehicle: Omit<Vehicle, 'id' | 'createdAt'>): Promise<void> => {
      if (!state.user) return;

      try {
        const response = await apiService.createVehicle(vehicle);

        if (response.success && response.data) {
          dispatch({ type: 'ADD_VEHICLE', payload: response.data });
          await storageService.addVehicle(response.data);
          
          // Auto-select if it's the first vehicle
          if (state.vehicles.length === 0) {
            await actions.selectVehicle(response.data.id);
          }
        }
      } catch (error) {
        console.error('Failed to add vehicle:', error);
      }
    },

    removeVehicle: async (vehicleId: string): Promise<void> => {
      try {
        const response = await apiService.deleteVehicle(vehicleId);
        if (response.success) {
          dispatch({ type: 'REMOVE_VEHICLE', payload: vehicleId });
          await storageService.removeVehicle(vehicleId);
        }
      } catch (error) {
        console.error('Failed to remove vehicle:', error);
      }
    },

    selectVehicle: async (vehicleId: string): Promise<void> => {
      try {
        const vehicle = state.vehicles.find((v: Vehicle) => v.id === vehicleId);
        if (vehicle) {
          dispatch({ type: 'SET_SELECTED_VEHICLE', payload: vehicle });
          await storageService.setSelectedVehicle(vehicleId);
        }
      } catch (error) {
        console.error('Failed to select vehicle:', error);
      }
    },

    loadVehicles: async (): Promise<void> => {
      if (!state.user) return;

      try {
        const response = await apiService.getUserVehicles();
        if (response.success && response.data) {
          dispatch({ type: 'SET_VEHICLES', payload: response.data.vehicles });
          await storageService.setVehicles(response.data.vehicles);
        }
      } catch (error) {
        console.error('Failed to load vehicles:', error);
      }
    },

    // Race Management
    loadNearbyRaces: async (lat: number, lng: number): Promise<void> => {
      try {
        const response = await apiService.getRaces();
        if (response.success && response.data) {
          dispatch({ type: 'SET_NEARBY_RACES', payload: response.data.races });
        }
      } catch (error) {
        console.error('Failed to load nearby races:', error);
      }
    },

    loadRecentRaces: async (): Promise<void> => {
      try {
        const cachedRaces = await storageService.getRecentRaces();
        dispatch({ type: 'SET_RECENT_RACES', payload: cachedRaces });
      } catch (error) {
        console.error('Failed to load recent races:', error);
      }
    },

    joinRace: async (raceId: string): Promise<boolean> => {
      if (!state.user || !state.selectedVehicle) return false;

      try {
        const response = await apiService.joinRace(raceId, state.selectedVehicle.id);
        return response.success;
      } catch (error) {
        console.error('Failed to join race:', error);
        return false;
      }
    },

    leaveRace: async (raceId: string): Promise<boolean> => {
      if (!state.user) return false;

      try {
        const response = await apiService.leaveRace(raceId);
        return response.success;
      } catch (error) {
        console.error('Failed to leave race:', error);
        return false;
      }
    },

    // App State
    setOnboardingComplete: async (complete: boolean): Promise<void> => {
      dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: complete });
      await storageService.setOnboardingComplete(complete);
    },

    setLocationPermission: async (granted: boolean): Promise<void> => {
      dispatch({ type: 'SET_LOCATION_PERMISSION', payload: granted });
      await storageService.setLocationPermission(granted);
    },

    syncData: async (): Promise<void> => {
      try {
        dispatch({ type: 'SET_CONNECTED', payload: true });
        await actions.loadUserData();
        dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
      } catch (error) {
        console.error('Failed to sync data:', error);
        dispatch({ type: 'SET_CONNECTED', payload: false });
      }
    },

    // UI Actions
    setActiveTab: (tab: string): void => {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
    },

    showNotification: (message: string, type: 'info' | 'success' | 'error' = 'info'): void => {
      const notification = {
        id: Date.now().toString(),
        message,
        type,
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });

      // Auto-remove after 5 seconds
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id });
      }, 5000);
    },

    clearNotifications: (): void => {
      dispatch({ type: 'CLEAR_NOTIFICATIONS' });
    },

    clearCache: async (): Promise<void> => {
      try {
        await storageService.clearCache();
        // Reset relevant state
        dispatch({ type: 'SET_VEHICLES', payload: [] });
        dispatch({ type: 'SET_NEARBY_RACES', payload: [] });
        dispatch({ type: 'SET_RECENT_RACES', payload: [] });
        dispatch({ type: 'SET_FRIENDS', payload: [] });
        dispatch({ type: 'SET_ONLINE_FRIENDS', payload: [] });
      } catch (error) {
        console.error('Failed to clear cache:', error);
      }
    },
  };

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export default AppContext;