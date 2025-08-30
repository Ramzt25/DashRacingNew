import { networkService } from '../utils/network';
import { apiService } from './api';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: number;
}

export interface WebSocketConfig {
  autoReconnect: boolean;
  reconnectDelay: number;
  maxReconnectAttempts: number;
  pingInterval: number;
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private config: WebSocketConfig = {
    autoReconnect: true,
    reconnectDelay: 3000,
    maxReconnectAttempts: 5,
    pingInterval: 30000,
  };
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private authToken: string | null = null;

  constructor(config?: Partial<WebSocketConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    // Listen for network changes
    networkService.onNetworkChange((networkConfig) => {
      if (networkConfig.isConnected && this.ws?.readyState !== WebSocket.OPEN) {
        console.log('🌐 Network reconnected, attempting WebSocket reconnection...');
        this.reconnect();
      }
    });
  }

  async connect(token?: string): Promise<boolean> {
    if (this.isConnected) {
      console.log('🔌 WebSocket already connected');
      return true;
    }

    this.authToken = token;
    
    try {
      const wsUrl = this.buildWebSocketUrl(token);
      console.log('🔌 Connecting to WebSocket:', wsUrl);

      this.ws = new WebSocket(wsUrl);
      
      return new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('Failed to create WebSocket'));
          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('✅ WebSocket connected successfully');
          
          this.startPing();
          resolve(true);
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error('❌ WebSocket connection error:', error);
          this.isConnected = false;
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket connection closed:', event.code, event.reason);
          this.isConnected = false;
          this.stopPing();
          
          if (this.config.autoReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };
      });
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      return false;
    }
  }

  disconnect(): void {
    console.log('🔌 Disconnecting WebSocket');
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopPing();
    
    if (this.ws) {
      this.ws.close(1000, 'User disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  send(type: string, data: any): boolean {
    if (!this.isConnected || !this.ws) {
      console.warn('⚠️ Cannot send message - WebSocket not connected');
      return false;
    }

    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now(),
    };

    try {
      this.ws.send(JSON.stringify(message));
      console.log('📤 WebSocket message sent:', type);
      return true;
    } catch (error) {
      console.error('❌ Failed to send WebSocket message:', error);
      return false;
    }
  }

  on(messageType: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    
    this.messageHandlers.get(messageType)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(messageType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  off(messageType: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  getConnectionState(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'error';
    }
  }

  isConnectionActive(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  // Race-specific methods
  joinRace(raceId: string): void {
    this.send('join_race', { raceId });
  }

  leaveRace(raceId: string): void {
    this.send('leave_race', { raceId });
  }

  sendLocationUpdate(location: { latitude: number; longitude: number; speed?: number }): void {
    this.send('location_update', { location });
  }

  // Private methods
  private buildWebSocketUrl(token?: string): string {
    const baseUrl = networkService.getWebSocketConnectionUrl();
    
    if (token) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}token=${token}`;
    }
    
    return baseUrl;
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      message.timestamp = Date.now();
      
      console.log('📥 WebSocket message received:', message.type);
      
      // Handle ping/pong messages
      if (message.type === 'ping') {
        this.send('pong', {});
        return;
      }
      
      // Notify message handlers
      const handlers = this.messageHandlers.get(message.type) || [];
      const globalHandlers = this.messageHandlers.get('*') || [];
      
      [...handlers, ...globalHandlers].forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('❌ Error in message handler:', error);
        }
      });
    } catch (error) {
      console.error('❌ Failed to parse WebSocket message:', error);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectAttempts++;
    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`⏰ Scheduling WebSocket reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnect();
    }, delay);
  }

  private async reconnect(): Promise<void> {
    if (this.isConnected) {
      return;
    }
    
    console.log('🔄 Attempting WebSocket reconnection...');
    
    try {
      await this.connect(this.authToken || undefined);
    } catch (error) {
      console.error('❌ WebSocket reconnection failed:', error);
      
      if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.scheduleReconnect();
      } else {
        console.error('❌ Max reconnection attempts reached');
      }
    }
  }

  private startPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }
    
    this.pingTimer = setInterval(() => {
      if (this.isConnected) {
        this.send('ping', {});
      }
    }, this.config.pingInterval);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;