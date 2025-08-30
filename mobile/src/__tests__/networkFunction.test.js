import { networkService } from '../src/utils/network';
import { apiService } from '../src/services/api';
import { webSocketService } from '../src/services/websocket';

// Mock React Native environment
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  getCurrentState: jest.fn(() => Promise.resolve({
    isConnected: true,
    type: 'wifi'
  }))
}));

jest.mock('react-native-keychain', () => ({
  getInternetCredentials: jest.fn(() => Promise.resolve(false)),
  setInternetCredentials: jest.fn(() => Promise.resolve()),
  resetInternetCredentials: jest.fn(() => Promise.resolve())
}));

// Mock environment variables
const mockEnv = {
  API_BASE_URL: 'http://10.1.0.150:3000',
  WS_URL: 'ws://10.1.0.150:3000'
};

jest.doMock('@env', () => mockEnv, { virtual: true });

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  readyState: 1,
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'test'
    }),
  })
);

describe('Mobile Network Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Network Service', () => {
    test('should have valid configuration', () => {
      const config = networkService.getConfig();
      
      expect(config.apiBaseUrl).toBe('http://10.1.0.150:3000');
      expect(config.wsUrl).toBe('ws://10.1.0.150:3000');
      expect(config.isConnected).toBe(true);
    });

    test('should detect network availability', () => {
      const isAvailable = networkService.isNetworkAvailable();
      expect(isAvailable).toBe(true);
    });

    test('should build correct API URLs', () => {
      const url = networkService.getApiUrl('/test');
      expect(url).toBe('http://10.1.0.150:3000/test');
    });

    test('should provide WebSocket connection URL', () => {
      const wsUrl = networkService.getWebSocketConnectionUrl();
      expect(wsUrl).toBe('ws://10.1.0.150:3000');
    });
  });

  describe('API Service', () => {
    test('should make requests using network service', async () => {
      const config = apiService.getNetworkConfig();
      
      expect(config.apiBaseUrl).toBe('http://10.1.0.150:3000');
      expect(config.wsUrl).toBe('ws://10.1.0.150:3000');
    });

    test('should handle health check request', async () => {
      const result = await apiService.healthCheck();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('status', 'ok');
    });

    test('should test connection successfully', async () => {
      const connected = await apiService.testConnection();
      expect(connected).toBe(true);
    });
  });

  describe('WebSocket Service', () => {
    test('should build correct WebSocket URL', () => {
      const wsUrl = networkService.getWebSocketConnectionUrl();
      expect(wsUrl).toBe('ws://10.1.0.150:3000');
    });

    test('should handle connection state', () => {
      const state = webSocketService.getConnectionState();
      expect(['connecting', 'connected', 'disconnected', 'error']).toContain(state);
    });
  });

  describe('E2E Mobile Function', () => {
    test('should support network-based communication without cable', async () => {
      // Test network configuration
      const networkConfig = networkService.getConfig();
      expect(networkConfig.apiBaseUrl).not.toContain('localhost');
      expect(networkConfig.apiBaseUrl).not.toContain('127.0.0.1');
      
      // Test API connectivity
      const apiConnected = await apiService.testConnection();
      expect(apiConnected).toBe(true);
      
      // Test that WebSocket URL is network-accessible
      const wsUrl = networkService.getWebSocketConnectionUrl();
      expect(wsUrl).not.toContain('localhost');
      expect(wsUrl).not.toContain('127.0.0.1');
      
      // Verify mobile app can function without cable connection
      expect(networkConfig.isConnected).toBe(true);
    });
  });
});