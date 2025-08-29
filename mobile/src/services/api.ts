import { User, Vehicle, Race, Friendship, ApiResponse } from '../../../shared/types';

// Backend API configuration
// For development: Use PC's IP address so mobile devices on same network can connect
// For production: Replace with your actual deployed backend URL
const API_BASE_URL = __DEV__ ? 'http://192.168.168.28:8000' : 'https://your-production-backend.com';
const API_TIMEOUT = 10000;

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

class ApiService {
  private authToken: string | null = null;

  constructor() {
    // Initialize with stored token if available
    this.loadAuthToken();
  }

  private async loadAuthToken() {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      this.authToken = await AsyncStorage.default.getItem('auth_token');
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  private async saveAuthToken(token: string) {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem('auth_token', token);
      this.authToken = token;
    } catch (error) {
      console.error('Failed to save auth token:', error);
    }
  }

  private async clearAuthToken() {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.removeItem('auth_token');
      this.authToken = null;
    } catch (error) {
      console.error('Failed to clear auth token:', error);
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Request failed',
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<User & { token: string }>> {
    const response = await this.request<User & { token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.token) {
      await this.saveAuthToken(response.data.token);
    }

    return response;
  }

  async register(email: string, password: string, username: string): Promise<ApiResponse<User & { token: string }>> {
    const response = await this.request<User & { token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    });

    if (response.success && response.data?.token) {
      await this.saveAuthToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/api/auth/logout', {
      method: 'POST',
    });

    await this.clearAuthToken();
    return response;
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await this.request<{ token: string }>('/api/auth/refresh', {
      method: 'POST',
    });

    if (response.success && response.data?.token) {
      await this.saveAuthToken(response.data.token);
    }

    return response;
  }

  async verifyToken(): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>('/api/auth/verify');
  }

  // User Management
  async getUserProfile(): Promise<ApiResponse<User>> {
    return this.request<User>('/api/users/profile');
  }

  async updateUserProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getUserStats(): Promise<ApiResponse<any>> {
    return this.request('/api/users/stats');
  }

  async updateUserLocation(lat: number, lng: number): Promise<ApiResponse> {
    return this.request('/api/users/location', {
      method: 'PUT',
      body: JSON.stringify({ lat, lng }),
    });
  }

  // Vehicle Management
  async getUserVehicles(): Promise<ApiResponse<{ vehicles: Vehicle[] }>> {
    return this.request<{ vehicles: Vehicle[] }>('/api/vehicles');
  }

  async createVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt'>): Promise<ApiResponse<Vehicle>> {
    return this.request<Vehicle>('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle),
    });
  }

  async updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
    return this.request<Vehicle>(`/api/vehicles/${vehicleId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteVehicle(vehicleId: string): Promise<ApiResponse> {
    return this.request(`/api/vehicles/${vehicleId}`, {
      method: 'DELETE',
    });
  }

  // Race Management
  async getRaces(params?: { page?: number; limit?: number; type?: string }): Promise<ApiResponse<{ races: Race[] }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);

    const queryString = queryParams.toString();
    const url = `/api/races${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{ races: Race[] }>(url);
  }

  async createRace(race: Omit<Race, 'id' | 'createdAt'>): Promise<ApiResponse<Race>> {
    return this.request<Race>('/api/races', {
      method: 'POST',
      body: JSON.stringify(race),
    });
  }

  async joinRace(raceId: string, vehicleId: string): Promise<ApiResponse> {
    return this.request(`/api/races/${raceId}/join`, {
      method: 'POST',
      body: JSON.stringify({ vehicleId }),
    });
  }

  async leaveRace(raceId: string): Promise<ApiResponse> {
    return this.request(`/api/races/${raceId}/leave`, {
      method: 'POST',
    });
  }

  async getRaceDetails(raceId: string): Promise<ApiResponse<Race>> {
    return this.request<Race>(`/api/races/${raceId}`);
  }

  async startRace(raceId: string): Promise<ApiResponse> {
    return this.request(`/api/races/${raceId}/start`, {
      method: 'POST',
    });
  }

  // Friends Management
  async getFriends(): Promise<ApiResponse<Friendship[]>> {
    return this.request<Friendship[]>('/api/friends');
  }

  async sendFriendRequest(userId: string): Promise<ApiResponse> {
    return this.request('/api/friends/request', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async acceptFriendRequest(requestId: string): Promise<ApiResponse> {
    return this.request(`/api/friends/accept/${requestId}`, {
      method: 'POST',
    });
  }

  async rejectFriendRequest(requestId: string): Promise<ApiResponse> {
    return this.request(`/api/friends/reject/${requestId}`, {
      method: 'POST',
    });
  }

  async removeFriend(friendshipId: string): Promise<ApiResponse> {
    return this.request(`/api/friends/${friendshipId}`, {
      method: 'DELETE',
    });
  }

  // AI Features
  async getAIRaceAnalysis(raceId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/ai/race-analysis/${raceId}`);
  }

  async getAIPerformanceTips(vehicleId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/ai/performance-tips/${vehicleId}`);
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>('/health');
  }

  // Utility Methods
  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
    if (token) {
      this.saveAuthToken(token);
    } else {
      this.clearAuthToken();
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;