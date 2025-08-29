/**
 * WebSocket Client for Testing
 * Test utility for WebSocket connections
 */

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: number;
}

export class TestWebSocketClient {
  private ws?: WebSocket;
  private url: string;
  private messages: WebSocketMessage[] = [];
  private listeners: Map<string, Function[]> = new Map();
  private connectionPromise?: Promise<void>;

  constructor(url: string = 'ws://localhost:3001') {
    this.url = url;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(token?: string): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      const wsUrl = token ? `${this.url}?token=${token}` : this.url;
      
      if (typeof WebSocket === 'undefined') {
        // Node.js environment - use ws package
        const WS = require('ws');
        this.ws = new WS(wsUrl);
      } else {
        // Browser environment
        this.ws = new WebSocket(wsUrl);
      }

      if (!this.ws) {
        reject(new Error('Failed to create WebSocket'));
        return;
      }

      this.ws.onopen = () => {
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data.toString());
          message.timestamp = Date.now();
          this.messages.push(message);
          
          // Notify listeners
          const listeners = this.listeners.get(message.type) || [];
          listeners.forEach(listener => listener(message));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        this.connectionPromise = undefined;
      };
    });

    return this.connectionPromise;
  }

  /**
   * Send message through WebSocket
   */
  send(type: string, data: any): void {
    if (!this.ws || this.ws.readyState !== this.ws.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const message: WebSocketMessage = { type, data };
    this.ws.send(JSON.stringify(message));
  }

  /**
   * Listen for specific message types
   */
  on(type: string, listener: (message: WebSocketMessage) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);
  }

  /**
   * Remove listener
   */
  off(type: string, listener: Function): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Wait for specific message type
   */
  waitForMessage(type: string, timeout: number = 5000): Promise<WebSocketMessage> {
    return new Promise((resolve, reject) => {
      // Check if message already exists
      const existingMessage = this.messages.find(msg => msg.type === type);
      if (existingMessage) {
        resolve(existingMessage);
        return;
      }

      const timer = setTimeout(() => {
        this.off(type, listener);
        reject(new Error(`Timeout waiting for message type: ${type}`));
      }, timeout);

      const listener = (message: WebSocketMessage) => {
        clearTimeout(timer);
        this.off(type, listener);
        resolve(message);
      };

      this.on(type, listener);
    });
  }

  /**
   * Get all received messages
   */
  getMessages(): WebSocketMessage[] {
    return [...this.messages];
  }

  /**
   * Get messages of specific type
   */
  getMessagesByType(type: string): WebSocketMessage[] {
    return this.messages.filter(msg => msg.type === type);
  }

  /**
   * Clear message history
   */
  clearMessages(): void {
    this.messages = [];
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws ? this.ws.readyState === 1 : false; // 1 is WebSocket.OPEN
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
    this.connectionPromise = undefined;
    this.messages = [];
    this.listeners.clear();
  }
}