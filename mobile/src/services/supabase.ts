import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { User, Vehicle, Race, Friendship, Meetup, ApiResponse, PaginatedResponse, RaceParticipant } from '../../../shared/types';

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

class SupabaseService {
  private client: SupabaseClient;
  private channels: Map<string, RealtimeChannel> = new Map();

  constructor() {
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  // Authentication
  async signUp(email: string, password: string, username: string): Promise<ApiResponse<User>> {
    try {
      const { data: authData, error: authError } = await this.client.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user account' };
      }

      // Create user profile
      const userData: Partial<User> = {
        id: authData.user.id,
        email,
        username,
        preferences: {
          notifications: true,
          location: true,
          units: 'imperial',
          soundEnabled: true,
          vibrationEnabled: true,
        },
        stats: {
          totalRaces: 0,
          wins: 0,
          bestTime: null,
          totalDistance: 0,
          winRate: 0,
          racesWon: 0,
          bestLapTime: null,
          averageSpeed: 0,
        },
        isPro: false,
        createdAt: new Date(),
      };

      const { data: profileData, error: profileError } = await this.client
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (profileError) {
        return { success: false, error: profileError.message };
      }

      return { success: true, data: profileData };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async signIn(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      const { data: authData, error: authError } = await this.client.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Authentication failed' };
      }

      // Get user profile
      const { data: profileData, error: profileError } = await this.client
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        return { success: false, error: profileError.message };
      }

      return { success: true, data: profileData };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async signOut(): Promise<ApiResponse> {
    try {
      // Clean up subscriptions
      this.channels.forEach(channel => {
        this.client.removeChannel(channel);
      });
      this.channels.clear();

      const { error } = await this.client.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await this.client.auth.getUser();
      
      if (!user) return null;

      const { data: profileData, error } = await this.client
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Failed to get user profile:', error);
        return null;
      }

      return profileData;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  // User Management
  async updateUser(userId: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await this.client
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async updateUserLocation(userId: string, lat: number, lng: number): Promise<ApiResponse> {
    try {
      const { error } = await this.client
        .from('users')
        .update({ location: `POINT(${lng} ${lat})` })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  // Vehicle Management
  async createVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt'>): Promise<ApiResponse<Vehicle>> {
    try {
      const { data, error } = await this.client
        .from('vehicles')
        .insert([{
          ...vehicle,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async getUserVehicles(userId: string): Promise<ApiResponse<Vehicle[]>> {
    try {
      const { data, error } = await this.client
        .from('vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
    try {
      const { data, error } = await this.client
        .from('vehicles')
        .update(updates)
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async deleteVehicle(vehicleId: string): Promise<ApiResponse> {
    try {
      const { error } = await this.client
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  // Race Management
  async createRace(race: Omit<Race, 'id' | 'createdAt' | 'participants' | 'results'>): Promise<ApiResponse<Race>> {
    try {
      const { data, error } = await this.client
        .from('races')
        .insert([{
          creator_id: race.creatorId,
          type: race.type,
          distance: race.distance,
          location: `POINT(${race.location.lng} ${race.location.lat})`,
          address: race.location.address,
          start_time: race.startTime.toISOString(),
          max_participants: race.maxParticipants,
          entry_requirements: race.entryRequirements,
          status: race.status,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async getNearbyRaces(lat: number, lng: number, radiusKm: number = 25): Promise<ApiResponse<Race[]>> {
    try {
      const { data, error } = await this.client
        .rpc('get_nearby_races', {
          lat,
          lng,
          radius_km: radiusKm
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async joinRace(raceId: string, userId: string, vehicleId: string): Promise<ApiResponse> {
    try {
      const { error } = await this.client
        .from('race_participants')
        .insert([{
          race_id: raceId,
          user_id: userId,
          vehicle_id: vehicleId,
          joined_at: new Date().toISOString(),
        }]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async leaveRace(raceId: string, userId: string): Promise<ApiResponse> {
    try {
      const { error } = await this.client
        .from('race_participants')
        .delete()
        .eq('race_id', raceId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async getRaceParticipants(raceId: string): Promise<ApiResponse<RaceParticipant[]>> {
    try {
      const { data, error } = await this.client
        .from('race_participants')
        .select(`
          *,
          users:user_id (username, avatar_url),
          vehicles:vehicle_id (*)
        `)
        .eq('race_id', raceId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  // Real-time Subscriptions
  subscribeToRaces(callback: (payload: any) => void): void {
    const channel = this.client
      .channel('races-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'races' },
        callback
      )
      .subscribe();

    this.channels.set('races', channel);
  }

  subscribeToRaceParticipants(raceId: string, callback: (payload: any) => void): void {
    const channel = this.client
      .channel(`race-${raceId}-participants`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'race_participants',
          filter: `race_id=eq.${raceId}`
        },
        callback
      )
      .subscribe();

    this.channels.set(`race-${raceId}-participants`, channel);
  }

  subscribeToFriends(userId: string, callback: (payload: any) => void): void {
    const channel = this.client
      .channel(`user-${userId}-friends`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `requester_id=eq.${userId},addressee_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    this.channels.set(`friends-${userId}`, channel);
  }

  unsubscribeFromChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      this.client.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  unsubscribeFromAll(): void {
    this.channels.forEach((channel, name) => {
      this.client.removeChannel(channel);
    });
    this.channels.clear();
  }

  // Friendship Management
  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<ApiResponse> {
    try {
      const { error } = await this.client
        .from('friendships')
        .insert([{
          requester_id: requesterId,
          addressee_id: addresseeId,
          status: 'pending',
          created_at: new Date().toISOString(),
        }]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async acceptFriendRequest(friendshipId: string): Promise<ApiResponse> {
    try {
      const { error } = await this.client
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async getUserFriends(userId: string): Promise<ApiResponse<Friendship[]>> {
    try {
      const { data, error } = await this.client
        .from('friendships')
        .select(`
          *,
          requester:requester_id (id, username, avatar_url, stats),
          addressee:addressee_id (id, username, avatar_url, stats)
        `)
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  // Utility functions
  getAuthUser() {
    return this.client.auth.getUser();
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.client.auth.onAuthStateChange(callback);
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();
export default supabaseService;