import { API_BASE_URL, WS_URL } from '@env';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkConfig {
  apiBaseUrl: string;
  wsUrl: string;
  isConnected: boolean;
  networkType: string;
}

class NetworkService {
  private listeners: ((config: NetworkConfig) => void)[] = [];
  private currentConfig: NetworkConfig = {
    apiBaseUrl: '',
    wsUrl: '',
    isConnected: false,
    networkType: 'unknown'
  };

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Set initial configuration
    this.updateNetworkConfig();
    
    // Listen for network changes
    NetInfo.addEventListener(this.handleNetworkChange.bind(this));
  }

  private handleNetworkChange = (state: NetInfoState) => {
    console.log('🌐 Network state changed:', state);
    this.updateNetworkConfig(state);
  };

  private updateNetworkConfig(netInfo?: NetInfoState) {
    const baseUrl = this.getApiBaseUrl();
    const wsUrl = this.getWebSocketUrl();
    
    this.currentConfig = {
      apiBaseUrl: baseUrl,
      wsUrl: wsUrl,
      isConnected: netInfo?.isConnected ?? true,
      networkType: netInfo?.type ?? 'unknown'
    };

    console.log('🔧 Network configuration updated:', this.currentConfig);
    
    // Notify listeners
    this.listeners.forEach(listener => listener(this.currentConfig));
  }

  private getApiBaseUrl(): string {
    // Priority: Environment variable -> Development fallback -> Production fallback
    if (API_BASE_URL) {
      return API_BASE_URL;
    }
    
    if (__DEV__) {
      // For development, try to detect local network
      return this.getLocalNetworkUrl();
    }
    
    return 'https://your-production-backend.com';
  }

  private getWebSocketUrl(): string {
    if (WS_URL) {
      return WS_URL;
    }
    
    if (__DEV__) {
      // Convert HTTP URL to WebSocket URL
      const httpUrl = this.getLocalNetworkUrl();
      return httpUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    }
    
    return 'wss://your-production-backend.com';
  }

  private getLocalNetworkUrl(): string {
    // Default local network development URL
    // This will be overridden by environment variables in practice
    return 'http://10.1.0.150:3000';
  }

  public getConfig(): NetworkConfig {
    return { ...this.currentConfig };
  }

  public isNetworkAvailable(): boolean {
    return this.currentConfig.isConnected;
  }

  public getApiUrl(endpoint: string): string {
    const baseUrl = this.currentConfig.apiBaseUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
  }

  public getWebSocketConnectionUrl(): string {
    return this.currentConfig.wsUrl;
  }

  public onNetworkChange(callback: (config: NetworkConfig) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public async testConnection(): Promise<boolean> {
    try {
      const testUrl = this.getApiUrl('/health');
      console.log('🔍 Testing connection to:', testUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      const isConnected = response.ok;
      console.log(isConnected ? '✅ Connection test successful' : '❌ Connection test failed');
      
      return isConnected;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }

  public async autoDetectNetwork(): Promise<NetworkConfig> {
    console.log('🔍 Auto-detecting network configuration...');
    
    // If environment variables are set, use them
    if (API_BASE_URL && WS_URL) {
      console.log('📝 Using environment configuration');
      return this.getConfig();
    }
    
    // Try common local network IPs
    const commonIPs = [
      '10.1.0.150', // Current detected IP
      '192.168.1.100', // Common router IP range
      '192.168.0.100',
      '10.0.0.100',
      'localhost'
    ];
    
    for (const ip of commonIPs) {
      const testUrl = `http://${ip}:3000`;
      console.log(`🔍 Testing ${testUrl}...`);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${testUrl}/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`✅ Found backend at ${testUrl}`);
          this.currentConfig.apiBaseUrl = testUrl;
          this.currentConfig.wsUrl = testUrl.replace('http://', 'ws://');
          return this.getConfig();
        }
      } catch (error) {
        console.log(`❌ ${testUrl} not accessible`);
      }
    }
    
    console.log('⚠️ Could not auto-detect backend, using environment configuration');
    return this.getConfig();
  }
}

// Export singleton instance
export const networkService = new NetworkService();
export default networkService;