/**
 * API Client for Testing
 * Simplified HTTP client for API testing without external dependencies
 */

import { TestUtils } from './test-utils';

// Ensure fetch is available in Node.js test environment
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string; // Add message field for backend responses
  error?: string;
  status: number;
}

export class TestApiClient {
  private baseUrl: string;
  private authToken?: string;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  clearAuth(): void {
    this.authToken = undefined;
  }

  /**
   * Make HTTP request using native fetch
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Add rate limiting delay before each request
    await TestUtils.rateLimitDelay();
    
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {})
    };

    // Only add Content-Type if we have a body
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => null);

      // If response contains a backend success/error structure, extract it
      if (data && typeof data === 'object' && 'success' in data) {
        return {
          success: data.success,
          data: data.success ? data.data : undefined,
          message: data.message, // Preserve message field
          error: !data.success ? (data.error || data.message || `HTTP ${response.status}`) : undefined,
          status: response.status
        };
      }

      // Fallback to HTTP status-based success
      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: !response.ok ? (data?.error || `HTTP ${response.status}`) : undefined,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        status: 0
      };
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health');
      return response.success;
    } catch {
      return false;
    }
  }
}

/**
 * Default API client instance
 */
export const apiClient = new TestApiClient();