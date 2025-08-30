import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Vehicle, Race, Meetup, Friendship, ApiResponse } from '../types';
import { randomUUID } from 'crypto';

export class SupabaseService {
  public supabase: SupabaseClient;
  private mockMode: boolean = false;
  private mockUsers: Map<string, any> = new Map();
  private mockUsersByEmail: Map<string, any> = new Map();
  private mockUsersByUsername: Map<string, any> = new Map();
  private mockVehicles: Map<string, any> = new Map();
  private mockRaces: Map<string, any> = new Map();
  private mockUserCounter = 1;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Check if we're in mock mode
    this.mockMode = process.env.NODE_ENV === 'development' && supabaseUrl.includes('example');

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async initialize(): Promise<void> {
    try {
      // Skip connection test in development with example credentials
      if (this.mockMode) {
        console.log('⚠️  Using mock Supabase credentials for development');
        console.log('📝 Mock database mode enabled - all operations will use in-memory storage');
        return;
      }

      // Test connection
      const { data, error } = await this.supabase.from('users').select('id').limit(1);
      if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist"
        throw error;
      }
      console.log('✅ Supabase connection established');
    } catch (error) {
      console.error('❌ Supabase connection failed:', error);
      
      // Don't throw in development - allow server to start with mock data
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️  Continuing with mock database for development');
        this.mockMode = true;
        return;
      }
      
      throw error;
    }
  }

  // User Management
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<ApiResponse<User>> {
    try {
      if (this.mockMode) {
        const mockUser = {
          id: `user_${this.mockUserCounter++}`,
          ...userData,
          created_at: new Date().toISOString(),
        };
        this.mockUsers.set(mockUser.id, mockUser);
        this.mockUsersByEmail.set(mockUser.email, mockUser);
        this.mockUsersByUsername.set(mockUser.username, mockUser);
        
        console.log('📝 Mock: Created user', mockUser.username, 'with ID', mockUser.id);
        
        return {
          success: true,
          data: this.mapUserFromDb(mockUser),
        };
      }

      const { data, error } = await this.supabase
        .from('users')
        .insert([{
          ...userData,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: this.mapUserFromDb(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create user: ${error}`,
      };
    }
  }

  async registerUser(email: string, username: string, password: string): Promise<ApiResponse<User>> {
    try {
      if (this.mockMode) {
        // Check if username already exists
        const existingUser = await this.getUserByUsername(username);
        if (existingUser.success) {
          return {
            success: false,
            error: 'Username already taken',
          };
        }

        // Check if email already exists
        const existingEmail = await this.getUserByEmail(email);
        if (existingEmail.success) {
          return {
            success: false,
            error: 'Email already registered',
          };
        }

        // Create mock user
        const mockUser = {
          id: `user_${this.mockUserCounter++}`,
          auth_user_id: `auth_${this.mockUserCounter}`,
          email,
          username,
          avatar: null,
          location: null,
          preferences: JSON.stringify({
            notifications: true,
            location: true,
            units: 'imperial',
            soundEnabled: true,
            vibrationEnabled: true,
          }),
          stats: JSON.stringify({
            totalRaces: 0,
            wins: 0,
            bestTime: null,
            totalDistance: 0,
            winRate: 0,
            racesWon: 0,
            bestLapTime: null,
            averageSpeed: 0,
          }),
          is_pro: false,
          created_at: new Date().toISOString(),
        };

        this.mockUsers.set(mockUser.id, mockUser);
        this.mockUsersByEmail.set(mockUser.email, mockUser);
        this.mockUsersByUsername.set(mockUser.username, mockUser);
        
        console.log('📝 Mock: Registered user', mockUser.username, 'with ID', mockUser.id);
        
        return {
          success: true,
          data: this.mapUserFromDb(mockUser),
        };
      }

      // Real Supabase implementation
      // Check if username already exists
      const { data: existingUsername, error: usernameError } = await this.supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (existingUsername) {
        return {
          success: false,
          error: 'Username already taken',
        };
      }

      // Check if email already exists
      const { data: existingEmail, error: emailError } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingEmail) {
        return {
          success: false,
          error: 'Email already registered',
        };
      }

      // Create new user
      const newUser = {
        // auth_user_id: randomUUID(), // Skip auth_user_id for now
        email,
        username,
        display_name: username, // Use username as display name initially
        units: 'imperial',
        notifications_enabled: true,
        location_sharing_enabled: true,
        sound_enabled: true,
        vibration_enabled: true,
        is_pro: false,
        total_races: 0,
        total_wins: 0,
        total_distance: 0.0,
        win_rate: 0.0,
        average_speed: 0.0,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: this.mapUserFromDb(data),
      };
      
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: `Registration failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      };
    }
  }

  async getUserById(userId: string): Promise<ApiResponse<User>> {
    try {
      if (this.mockMode) {
        const mockUser = this.mockUsers.get(userId);
        if (!mockUser) {
          return {
            success: false,
            error: 'User not found',
          };
        }
        
        console.log('📝 Mock: Found user by ID', userId, '→', mockUser.username);
        
        return {
          success: true,
          data: this.mapUserFromDb(mockUser),
        };
      }

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: this.mapUserFromDb(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `User not found: ${error}`,
      };
    }
  }

  async getUserByUsername(username: string): Promise<ApiResponse<User>> {
    try {
      if (this.mockMode) {
        console.log('📝 Mock: getUserByUsername called with:', username);
        console.log('📝 Mock: Available usernames:', Array.from(this.mockUsersByUsername.keys()));
        
        const mockUser = this.mockUsersByUsername.get(username);
        if (!mockUser) {
          console.log('📝 Mock: Username', username, 'not found');
          return {
            success: false,
            error: 'User not found',
          };
        }
        
        console.log('📝 Mock: Found user by username', username, '→', mockUser.id);
        return {
          success: true,
          data: this.mapUserFromDb(mockUser),
        };
      }

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: this.mapUserFromDb(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `User not found: ${error}`,
      };
    }
  }

  async getUserByEmail(email: string): Promise<ApiResponse<User>> {
    try {
      if (this.mockMode) {
        const mockUser = this.mockUsersByEmail.get(email);
        if (!mockUser) {
          return {
            success: false,
            error: 'User not found',
          };
        }
        
        console.log('📝 Mock: Found user by email', email, '→', mockUser.username);
        
        return {
          success: true,
          data: this.mapUserFromDb(mockUser),
        };
      }

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: this.mapUserFromDb(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `User not found: ${error}`,
      };
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update(this.mapUserToDb(updates))
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: this.mapUserFromDb(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update user: ${error}`,
      };
    }
  }

  // Vehicle Management
  async createVehicle(vehicleData: Omit<Vehicle, 'id' | 'createdAt'>): Promise<ApiResponse<Vehicle>> {
    try {
      console.log('Creating vehicle with input data:', JSON.stringify(vehicleData, null, 2));
      
      const dbVehicleData = {
        user_id: vehicleData.userId,
        year: vehicleData.year,
        make: vehicleData.make,
        model: vehicleData.model,
        trim: (vehicleData as any).name, // Store custom name in trim field
        image_url: vehicleData.imageUrl,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      console.log('Database insert data:', JSON.stringify(dbVehicleData, null, 2));

      const { data, error } = await this.supabase
        .from('vehicles')
        .insert([dbVehicleData])
        .select()
        .single();

      if (error) {
        console.error('Vehicle creation database error:', error);
        throw error;
      }

      console.log('Vehicle created successfully:', data);
      return {
        success: true,
        data: this.mapVehicleFromDb(data),
      };
    } catch (error) {
      console.error('Full error in createVehicle:', error);
      return {
        success: false,
        error: `Failed to create vehicle: ${error}`,
      };
    }
  }

  async getUserVehicles(userId: string, filters?: any): Promise<ApiResponse<Vehicle[]>> {
    try {
      let query = this.supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId);

      // Apply filters if provided
      if (filters) {
        if (filters.make) query = query.eq('make', filters.make);
        if (filters.model) query = query.eq('model', filters.model);
        if (filters.year) query = query.eq('year', parseInt(filters.year));
        if (filters.color) query = query.eq('color', filters.color);
      }

      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data.map(vehicle => this.mapVehicleFromDb(vehicle)),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get vehicles: ${error}`,
      };
    }
  }

  async updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
    try {
      console.log('🚗 Updating vehicle:', vehicleId, 'with updates:', updates);
      
      const updateData: any = {};
      
      // Map camelCase to snake_case
      if (updates.userId !== undefined) updateData.user_id = updates.userId;
      if (updates.year !== undefined) updateData.year = updates.year;
      if (updates.make !== undefined) updateData.make = updates.make;
      if (updates.model !== undefined) updateData.model = updates.model;
      if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
      if ((updates as any).name !== undefined) updateData.trim = (updates as any).name; // Store name in trim field
      if ((updates as any).color !== undefined) updateData.color = (updates as any).color;
      
      // Handle specs mapping to database fields
      if (updates.specs !== undefined) {
        console.log('📊 Mapping specs:', updates.specs);
        if (updates.specs.horsepower !== undefined) updateData.horsepower = updates.specs.horsepower;
        if (updates.specs.torque !== undefined) updateData.torque = updates.specs.torque;
        if (updates.specs.acceleration !== undefined) updateData.zero_to_sixty = updates.specs.acceleration;
        if (updates.specs.topSpeed !== undefined) updateData.top_speed = updates.specs.topSpeed;
        if (updates.specs.weight !== undefined) updateData.weight = updates.specs.weight;
        if (updates.specs.transmission !== undefined && updates.specs.transmission) updateData.transmission = updates.specs.transmission;
        if (updates.specs.drivetrain !== undefined && updates.specs.drivetrain) updateData.drivetrain = updates.specs.drivetrain;
      }

      console.log('🔧 Final update data for database:', updateData);

      const { data, error } = await this.supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) {
        console.error('❌ Database update error:', error);
        throw error;
      }

      console.log('✅ Vehicle updated successfully:', data);

      return {
        success: true,
        data: this.mapVehicleFromDb(data),
      };
    } catch (error) {
      console.error('💥 Update vehicle error:', error);
      return {
        success: false,
        error: `Failed to update vehicle: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      };
    }
  }

  async getVehicle(vehicleId: string): Promise<ApiResponse<Vehicle>> {
    try {
      const { data, error } = await this.supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: this.mapVehicleFromDb(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get vehicle: ${error}`,
      };
    }
  }

  async deleteVehicle(vehicleId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await this.supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete vehicle: ${error}`,
      };
    }
  }

  // Race Management
  async createRace(raceData: any): Promise<ApiResponse<any>> {
    try {
      console.log('🏁 Creating race with data:', raceData);
      
      // Map the test data format to database schema
      const insertData: any = {
        name: raceData.name,
        description: raceData.description || '',
        created_by: raceData.createdBy,
        race_type: raceData.raceType || 'street',
        status: 'scheduled', // Use valid status from database constraint
        
        // Use JSONB format for locations (as per schema)
        start_location: JSON.stringify(raceData.startLocation),
        end_location: JSON.stringify(raceData.endLocation),
        
        max_participants: raceData.maxParticipants,
        entry_fee: raceData.entryFee || 0,
        scheduled_start: raceData.startTime instanceof Date ? raceData.startTime.toISOString() : raceData.startTime,
      };

      console.log('📊 Insert data for database:', insertData);

      const { data, error } = await this.supabase
        .from('races')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      console.log('✅ Race created in database:', data);

      return {
        success: true,
        data: this.mapRaceFromDb(data),
      };
    } catch (error) {
      console.error('💥 Create race error:', error);
      return {
        success: false,
        error: `Failed to create race: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      };
    }
  }

  async getAllRaces(): Promise<ApiResponse<any[]>> {
    try {
      console.log('📋 Getting all races...');
      
      const { data, error } = await this.supabase
        .from('races')
        .select('*')
        .in('status', ['scheduled', 'active']) // Use correct status values
        .order('scheduled_start', { ascending: true }); // Fixed column name

      if (error) {
        console.error('❌ Get races error:', error);
        throw error;
      }

      console.log('✅ Retrieved races:', data?.length || 0);

      return {
        success: true,
        data: data.map(race => this.mapRaceFromDb(race)),
      };
    } catch (error) {
      console.error('💥 Get all races error:', error);
      return {
        success: false,
        error: `Failed to get races: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      };
    }
  }

  async getRace(raceId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await this.supabase
        .from('races')
        .select('*, race_participants(*)')
        .eq('id', raceId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: this.mapRaceFromDb(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get race: ${error}`,
      };
    }
  }

  async joinRace(raceId: string, userId: string): Promise<ApiResponse<any>> {
    try {
      console.log('🚗 Joining race:', { raceId, userId });
      
      // Get current race data
      const raceResult = await this.getRace(raceId);
      if (!raceResult.success) {
        console.log('❌ Race not found');
        return { success: false, error: 'Race not found' };
      }

      const race = raceResult.data;
      console.log('📊 Race data:', { 
        name: race.name, 
        maxParticipants: race.maxParticipants,
        currentParticipants: race.participants?.length || 0 
      });

      // Check if race is full
      if (race.participants.length >= race.maxParticipants) {
        console.log('❌ Race is full');
        return { success: false, error: 'Race is full' };
      }

      // Check if user already joined
      if (race.participants.some((p: any) => p.user_id === userId)) {
        console.log('❌ User already in race');
        return { success: false, error: 'User already in race' };
      }

      // Get user's selected vehicle
      const vehiclesResult = await this.getUserVehicles(userId);
      if (!vehiclesResult.success || !vehiclesResult.data?.length) {
        console.log('❌ No vehicle found for user');
        return { success: false, error: 'No vehicle found' };
      }

      const selectedVehicle = vehiclesResult.data.find(v => v.isSelected) || vehiclesResult.data[0];
      console.log('🚙 Selected vehicle:', selectedVehicle.id);

      // Add participant using race_participants table
      const { data, error } = await this.supabase
        .from('race_participants')
        .insert([{
          race_id: raceId,
          user_id: userId,
          vehicle_id: selectedVehicle.id,
          status: 'registered',
          joined_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding participant:', error);
        throw error;
      }

      console.log('✅ User joined race successfully');

      // Return updated race data
      return await this.getRace(raceId);
    } catch (error) {
      console.error('💥 Join race error:', error);
      return {
        success: false,
        error: `Failed to join race: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      };
    }
  }

  async leaveRace(raceId: string, userId: string): Promise<ApiResponse<any>> {
    try {
      // Remove participant from race_participants table
      const { error } = await this.supabase
        .from('race_participants')
        .delete()
        .eq('race_id', raceId)
        .eq('user_id', userId);

      if (error) throw error;

      // Return updated race data
      return await this.getRace(raceId);
    } catch (error) {
      return {
        success: false,
        error: `Failed to leave race: ${error}`,
      };
    }
  }

  async startRace(raceId: string, userId: string): Promise<ApiResponse<any>> {
    try {
      // Get current race data
      const raceResult = await this.getRace(raceId);
      if (!raceResult.success) {
        return { success: false, error: 'Race not found' };
      }

      const race = raceResult.data;

      // Check if user is race creator
      if (race.createdBy !== userId) {
        return { success: false, error: 'Only race creator can start the race' };
      }

      // Update race status to active
      const { data, error } = await this.supabase
        .from('races')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', raceId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: this.mapRaceFromDb(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to start race: ${error}`,
      };
    }
  }

  async updateRaceLocation(raceId: string, userId: string, locationData: any): Promise<ApiResponse<any>> {
    try {
      // Get current race data
      const raceResult = await this.getRace(raceId);
      if (!raceResult.success) {
        return { success: false, error: 'Race not found' };
      }

      const race = raceResult.data;

      // Check if user is participant
      if (!race.participants.some((p: any) => p.user_id === userId)) {
        return { success: false, error: 'User not in race' };
      }

      // For now, just return success (WebSocket would handle real-time updates)
      return {
        success: true,
        data: {
          raceId,
          userId,
          location: locationData,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update location: ${error}`,
      };
    }
  }

  async finishRace(raceId: string, userId: string, finishData: any): Promise<ApiResponse<any>> {
    try {
      // Get current race data
      const raceResult = await this.getRace(raceId);
      if (!raceResult.success) {
        return { success: false, error: 'Race not found' };
      }

      const race = raceResult.data;

      // Check if user is participant
      const participant = race.participants.find((p: any) => p.user_id === userId);
      if (!participant) {
        return { success: false, error: 'User not in race' };
      }

      // Calculate position (simplified - count existing finishers + 1)
      const { data: existingResults, error: countError } = await this.supabase
        .from('race_results')
        .select('*')
        .eq('race_id', raceId);

      if (countError) throw countError;

      const position = existingResults.length + 1;

      // Insert race result
      const { data, error } = await this.supabase
        .from('race_results')
        .insert([{
          race_id: raceId,
          user_id: userId,
          vehicle_id: participant.vehicle_id,
          final_position: position,
          finish_time: finishData.finishTime,
          total_race_time: finishData.totalTime,
          average_speed: finishData.averageSpeed,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      // Update participant status
      await this.supabase
        .from('race_participants')
        .update({ 
          status: 'finished',
          position: position,
          finish_time: finishData.finishTime,
          average_speed: finishData.averageSpeed,
          updated_at: new Date().toISOString()
        })
        .eq('race_id', raceId)
        .eq('user_id', userId);

      return {
        success: true,
        data: {
          position,
          totalTime: finishData.totalTime,
          averageSpeed: finishData.averageSpeed,
          finishTime: finishData.finishTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to finish race: ${error}`,
      };
    }
  }

  async getNearbyRaces(lat: number, lng: number, radius: number = 50): Promise<ApiResponse<Race[]>> {
    try {
      // For now, get all races and filter client-side
      // In production, use PostGIS for geo queries
      const { data, error } = await this.supabase
        .from('races')
        .select('*')
        .eq('status', 'scheduled')
        .order('start_time', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: data.map(this.mapRaceFromDb),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get nearby races: ${error}`,
      };
    }
  }

  async getUserRaces(userId: string): Promise<ApiResponse<Race[]>> {
    try {
      const { data, error } = await this.supabase
        .from('races')
        .select('*')
        .or(`creator_id.eq.${userId},participants.cs.[{"userId":"${userId}"}]`)
        .order('start_time', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data.map(this.mapRaceFromDb),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get user races: ${error}`,
      };
    }
  }

  // Data mapping helpers
  private mapUserFromDb(dbUser: any): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      avatar: dbUser.avatar_url,
      location: dbUser.location ? JSON.parse(dbUser.location) : undefined,
      preferences: {
        notifications: dbUser.notifications_enabled ?? true,
        location: dbUser.location_sharing_enabled ?? true,
        units: dbUser.units || 'imperial',
        soundEnabled: dbUser.sound_enabled ?? true,
        vibrationEnabled: dbUser.vibration_enabled ?? true,
      },
      stats: {
        totalRaces: dbUser.total_races || 0,
        wins: dbUser.total_wins || 0,
        bestTime: dbUser.best_quarter_mile || null,
        totalDistance: dbUser.total_distance || 0,
        winRate: dbUser.win_rate || 0,
        racesWon: dbUser.total_wins || 0,
        bestLapTime: dbUser.best_quarter_mile || null,
        averageSpeed: dbUser.average_speed || 0,
      },
      isPro: dbUser.is_pro || false,
      createdAt: new Date(dbUser.created_at),
    };
  }

  private mapUserToDb(user: Partial<User>): any {
    const dbUser: any = {};
    
    if (user.username) dbUser.username = user.username;
    if (user.email) dbUser.email = user.email;
    if (user.avatar) dbUser.avatar = user.avatar;
    if (user.location) dbUser.location = JSON.stringify(user.location);
    if (user.preferences) dbUser.preferences = JSON.stringify(user.preferences);
    if (user.stats) dbUser.stats = JSON.stringify(user.stats);
    if (user.isPro !== undefined) dbUser.is_pro = user.isPro;

    return dbUser;
  }

  private mapVehicleFromDb(dbVehicle: any, providedName?: string): Vehicle {
    const hasPerformanceData = dbVehicle.horsepower > 0 || dbVehicle.top_speed > 0 || dbVehicle.zero_to_sixty > 0 || dbVehicle.weight > 0;
    
    return {
      id: dbVehicle.id,
      userId: dbVehicle.user_id,
      name: providedName || dbVehicle.trim || `${dbVehicle.year} ${dbVehicle.make} ${dbVehicle.model}`,
      year: dbVehicle.year,
      make: dbVehicle.make,
      model: dbVehicle.model,
      imageUrl: dbVehicle.image_url,
      color: dbVehicle.color,
      specs: {
        horsepower: dbVehicle.horsepower || 0,
        torque: dbVehicle.torque || 0,
        acceleration: dbVehicle.zero_to_sixty || 0,
        topSpeed: dbVehicle.top_speed || 0,
        weight: dbVehicle.weight || 0,
        transmission: dbVehicle.transmission || '',
        drivetrain: dbVehicle.drivetrain || '',
      },
      performance: hasPerformanceData ? {
        topSpeed: dbVehicle.top_speed || 0,
        acceleration: dbVehicle.zero_to_sixty || 0,
        horsePower: dbVehicle.horsepower || 0,
        weight: dbVehicle.weight || 0,
      } : undefined,
      isSelected: false, // We'll handle vehicle selection separately
      createdAt: new Date(dbVehicle.created_at),
    };
  }

  private mapRaceFromDb(dbRace: any): any {
    return {
      id: dbRace.id,
      name: dbRace.name,
      description: dbRace.description || '',
      createdBy: dbRace.created_by,
      startLocation: typeof dbRace.start_location === 'string' 
        ? JSON.parse(dbRace.start_location) 
        : dbRace.start_location,
      endLocation: typeof dbRace.end_location === 'string'
        ? JSON.parse(dbRace.end_location)
        : dbRace.end_location,
      maxParticipants: dbRace.max_participants,
      entryFee: dbRace.entry_fee || 0,
      prizePool: dbRace.prize_pool || 0,
      startTime: new Date(dbRace.scheduled_start || dbRace.start_time),
      raceType: dbRace.race_type || 'street',
      status: dbRace.status || 'scheduled', // Use 'scheduled' as default to match database constraint
      participants: dbRace.race_participants || dbRace.participants || [], // Try both field names
      results: dbRace.results || [],
      createdAt: new Date(dbRace.created_at),
    };
  }
}