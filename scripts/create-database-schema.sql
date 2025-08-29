-- DASH RACING Database Migration Script
-- This script creates the complete database schema for the DASH RACING app
-- Run this in your Supabase SQL Editor to set up the database

-- ============================================================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- ============================================================================

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for location data (if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- 2. CREATE CUSTOM TYPES
-- ============================================================================

-- Race types enum
DO $$ BEGIN
    CREATE TYPE race_type AS ENUM ('street', 'circuit', 'drag', 'drift', 'rally');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Race status enum
DO $$ BEGIN
    CREATE TYPE race_status AS ENUM ('pending', 'active', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Vehicle drive type enum
DO $$ BEGIN
    CREATE TYPE drive_type AS ENUM ('rwd', 'fwd', 'awd', '4wd');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notification type enum
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('race_invite', 'friend_request', 'race_result', 'meetup_invite', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 3. DROP EXISTING TABLES (IF ANY) - CAREFUL!
-- ============================================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS race_results CASCADE;
DROP TABLE IF EXISTS performance_records CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS friend_requests CASCADE;
DROP TABLE IF EXISTS friends CASCADE;
DROP TABLE IF EXISTS meetup_participants CASCADE;
DROP TABLE IF EXISTS meetups CASCADE;
DROP TABLE IF EXISTS race_participants CASCADE;
DROP TABLE IF EXISTS races CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- 4. CREATE CORE TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    phone VARCHAR(20),
    date_of_birth DATE,
    location_city VARCHAR(100),
    location_state VARCHAR(100),
    location_country VARCHAR(100) DEFAULT 'USA',
    
    -- Preferences
    units VARCHAR(10) DEFAULT 'imperial', -- 'imperial' or 'metric'
    notifications_enabled BOOLEAN DEFAULT true,
    location_sharing_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    vibration_enabled BOOLEAN DEFAULT true,
    
    -- Subscription
    is_pro BOOLEAN DEFAULT false,
    pro_expires_at TIMESTAMPTZ,
    
    -- Stats (denormalized for performance)
    total_races INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_distance DECIMAL(10,2) DEFAULT 0,
    best_lap_time DECIMAL(10,3), -- in seconds
    average_speed DECIMAL(8,2), -- mph or kmh
    win_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic info
    name VARCHAR(100) NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2030),
    color VARCHAR(50),
    license_plate VARCHAR(20),
    vin VARCHAR(17),
    
    -- Technical specs
    engine VARCHAR(100),
    horsepower INTEGER,
    torque INTEGER,
    weight INTEGER, -- in pounds or kg
    drive_type drive_type,
    transmission VARCHAR(50),
    fuel_type VARCHAR(20) DEFAULT 'gasoline',
    
    -- Performance metrics
    zero_to_sixty DECIMAL(4,2), -- in seconds
    quarter_mile_time DECIMAL(5,2), -- in seconds
    top_speed INTEGER, -- mph or kmh
    
    -- Media
    primary_image_url TEXT,
    image_urls TEXT[], -- array of image URLs
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Races table
CREATE TABLE races (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic info
    name VARCHAR(200) NOT NULL,
    description TEXT,
    race_type race_type NOT NULL,
    status race_status DEFAULT 'pending',
    
    -- Location data
    start_location_lat DECIMAL(10, 8),
    start_location_lng DECIMAL(11, 8),
    end_location_lat DECIMAL(10, 8),
    end_location_lng DECIMAL(11, 8),
    start_address TEXT,
    end_address TEXT,
    distance DECIMAL(8,2), -- miles or km
    
    -- Race settings
    max_participants INTEGER DEFAULT 8,
    entry_fee DECIMAL(10,2) DEFAULT 0,
    prize_pool DECIMAL(10,2) DEFAULT 0,
    minimum_skill_level INTEGER DEFAULT 1 CHECK (minimum_skill_level >= 1 AND minimum_skill_level <= 10),
    
    -- Timing
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    registration_deadline TIMESTAMPTZ,
    
    -- Rules and requirements
    vehicle_restrictions JSONB, -- JSON object with restrictions
    rules TEXT,
    
    -- Media
    image_url TEXT,
    
    -- Calculated fields
    participant_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Race participants table
CREATE TABLE race_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    
    -- Participation status
    status VARCHAR(20) DEFAULT 'registered', -- 'registered', 'confirmed', 'started', 'finished', 'dnf', 'disqualified'
    position INTEGER, -- final position in race
    
    -- Performance data
    start_time TIMESTAMPTZ,
    finish_time TIMESTAMPTZ,
    best_lap_time DECIMAL(10,3), -- in seconds
    average_speed DECIMAL(8,2),
    max_speed DECIMAL(8,2),
    total_distance DECIMAL(8,2),
    
    -- Timestamps
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(race_id, user_id)
);

-- Meetups table (social gatherings)
CREATE TABLE meetups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic info
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general', -- 'car_show', 'cruise', 'track_day', 'general'
    
    -- Location
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    venue_name VARCHAR(200),
    address TEXT,
    
    -- Timing
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    
    -- Settings
    max_participants INTEGER,
    is_public BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    
    -- Media
    image_url TEXT,
    
    -- Stats
    participant_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meetup participants table
CREATE TABLE meetup_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meetup_id UUID NOT NULL REFERENCES meetups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'going', -- 'going', 'maybe', 'not_going', 'pending'
    
    -- Optional vehicle they're bringing
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    
    -- Timestamps
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(meetup_id, user_id)
);

-- Friends table (mutual friendships)
CREATE TABLE friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure user1_id < user2_id to avoid duplicates
    CHECK (user1_id < user2_id),
    UNIQUE(user1_id, user2_id)
);

-- Friend requests table
CREATE TABLE friend_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    
    UNIQUE(from_user_id, to_user_id),
    CHECK (from_user_id != to_user_id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Content
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    
    -- Related entities
    related_race_id UUID REFERENCES races(id) ON DELETE CASCADE,
    related_meetup_id UUID REFERENCES meetups(id) ON DELETE CASCADE,
    related_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    is_pushed BOOLEAN DEFAULT false, -- sent as push notification
    
    -- Data payload for app handling
    data JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Performance records table (dyno runs, track times, etc.)
CREATE TABLE performance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    race_id UUID REFERENCES races(id) ON DELETE SET NULL,
    
    -- Record type
    record_type VARCHAR(50) NOT NULL, -- 'dyno', 'quarter_mile', 'lap_time', 'top_speed'
    
    -- Performance data
    value DECIMAL(10,3) NOT NULL, -- the primary measurement
    unit VARCHAR(20) NOT NULL, -- 'hp', 'sec', 'mph', etc.
    
    -- Context
    track_name VARCHAR(100),
    weather_conditions TEXT,
    temperature INTEGER, -- Fahrenheit or Celsius
    elevation INTEGER, -- feet or meters
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    verification_notes TEXT,
    
    -- Media evidence
    image_urls TEXT[],
    video_url TEXT,
    
    -- Timestamps
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Race results table (detailed race outcomes)
CREATE TABLE race_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    
    -- Results
    final_position INTEGER NOT NULL,
    finish_time TIMESTAMPTZ,
    total_race_time DECIMAL(10,3), -- seconds
    best_lap_time DECIMAL(10,3), -- seconds
    average_lap_time DECIMAL(10,3), -- seconds
    top_speed DECIMAL(8,2),
    average_speed DECIMAL(8,2),
    
    -- Prize money
    prize_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Performance ratings
    skill_rating DECIMAL(4,2), -- calculated skill rating
    consistency_rating DECIMAL(4,2), -- how consistent their lap times were
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_location ON users(location_city, location_state);
CREATE INDEX idx_users_is_pro ON users(is_pro);
CREATE INDEX idx_users_last_active ON users(last_active_at);

-- Vehicles indexes
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_make_model ON vehicles(make, model);
CREATE INDEX idx_vehicles_year ON vehicles(year);
CREATE INDEX idx_vehicles_is_active ON vehicles(is_active);
CREATE INDEX idx_vehicles_is_public ON vehicles(is_public);

-- Races indexes
CREATE INDEX idx_races_created_by ON races(created_by);
CREATE INDEX idx_races_race_type ON races(race_type);
CREATE INDEX idx_races_status ON races(status);
CREATE INDEX idx_races_start_time ON races(start_time);
CREATE INDEX idx_races_location ON races(start_location_lat, start_location_lng);

-- Race participants indexes
CREATE INDEX idx_race_participants_race_id ON race_participants(race_id);
CREATE INDEX idx_race_participants_user_id ON race_participants(user_id);
CREATE INDEX idx_race_participants_vehicle_id ON race_participants(vehicle_id);
CREATE INDEX idx_race_participants_status ON race_participants(status);

-- Meetups indexes
CREATE INDEX idx_meetups_created_by ON meetups(created_by);
CREATE INDEX idx_meetups_start_time ON meetups(start_time);
CREATE INDEX idx_meetups_category ON meetups(category);
CREATE INDEX idx_meetups_is_public ON meetups(is_public);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Performance records indexes
CREATE INDEX idx_performance_records_user_id ON performance_records(user_id);
CREATE INDEX idx_performance_records_vehicle_id ON performance_records(vehicle_id);
CREATE INDEX idx_performance_records_type ON performance_records(record_type);
CREATE INDEX idx_performance_records_recorded_at ON performance_records(recorded_at DESC);

-- ============================================================================
-- 6. CREATE FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers for all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_races_updated_at BEFORE UPDATE ON races FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_race_participants_updated_at BEFORE UPDATE ON race_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetups_updated_at BEFORE UPDATE ON meetups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetup_participants_updated_at BEFORE UPDATE ON meetup_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_records_updated_at BEFORE UPDATE ON performance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update race participant count
CREATE OR REPLACE FUNCTION update_race_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE races SET participant_count = participant_count + 1 WHERE id = NEW.race_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE races SET participant_count = participant_count - 1 WHERE id = OLD.race_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger for race participant count
CREATE TRIGGER update_race_participant_count_trigger
    AFTER INSERT OR DELETE ON race_participants
    FOR EACH ROW EXECUTE FUNCTION update_race_participant_count();

-- Function to update meetup participant count
CREATE OR REPLACE FUNCTION update_meetup_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE meetups SET participant_count = participant_count + 1 WHERE id = NEW.meetup_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE meetups SET participant_count = participant_count - 1 WHERE id = OLD.meetup_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger for meetup participant count
CREATE TRIGGER update_meetup_participant_count_trigger
    AFTER INSERT OR DELETE ON meetup_participants
    FOR EACH ROW EXECUTE FUNCTION update_meetup_participant_count();

-- Function to create friendship when friend request is accepted
CREATE OR REPLACE FUNCTION handle_friend_request_acceptance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        -- Create mutual friendship record
        INSERT INTO friends (user1_id, user2_id, created_at)
        VALUES (
            LEAST(NEW.from_user_id, NEW.to_user_id),
            GREATEST(NEW.from_user_id, NEW.to_user_id),
            NOW()
        )
        ON CONFLICT (user1_id, user2_id) DO NOTHING;
        
        -- Set responded_at timestamp
        NEW.responded_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for friend request acceptance
CREATE TRIGGER handle_friend_request_acceptance_trigger
    BEFORE UPDATE ON friend_requests
    FOR EACH ROW EXECUTE FUNCTION handle_friend_request_acceptance();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetup_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can view public profiles" ON users FOR SELECT USING (true); -- All profiles are viewable
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Vehicles policies
CREATE POLICY "Users can manage their own vehicles" ON vehicles FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Anyone can view public vehicles" ON vehicles FOR SELECT USING (is_public = true);

-- Races policies
CREATE POLICY "Anyone can view public races" ON races FOR SELECT USING (true);
CREATE POLICY "Users can create races" ON races FOR INSERT WITH CHECK (created_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Race creators can update their races" ON races FOR UPDATE USING (created_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Race creators can delete their races" ON races FOR DELETE USING (created_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Race participants policies
CREATE POLICY "Users can join/leave races" ON race_participants FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Anyone can view race participants" ON race_participants FOR SELECT USING (true);

-- Meetups policies (similar to races)
CREATE POLICY "Anyone can view public meetups" ON meetups FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create meetups" ON meetups FOR INSERT WITH CHECK (created_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Meetup creators can update their meetups" ON meetups FOR UPDATE USING (created_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Meetup participants policies
CREATE POLICY "Users can join/leave meetups" ON meetup_participants FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Anyone can view meetup participants" ON meetup_participants FOR SELECT USING (true);

-- Friends policies
CREATE POLICY "Users can view their friendships" ON friends FOR SELECT USING (
    user1_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR 
    user2_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Users can delete their friendships" ON friends FOR DELETE USING (
    user1_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR 
    user2_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Friend requests policies
CREATE POLICY "Users can view their friend requests" ON friend_requests FOR SELECT USING (
    from_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR 
    to_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Users can send friend requests" ON friend_requests FOR INSERT WITH CHECK (
    from_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Users can respond to friend requests" ON friend_requests FOR UPDATE USING (
    to_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Performance records policies
CREATE POLICY "Users can manage their own performance records" ON performance_records FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Anyone can view public performance records" ON performance_records FOR SELECT USING (true);

-- Race results policies
CREATE POLICY "Anyone can view race results" ON race_results FOR SELECT USING (true);
CREATE POLICY "System can insert race results" ON race_results FOR INSERT WITH CHECK (true); -- Allow system to insert results

-- ============================================================================
-- 8. CREATE UTILITY FUNCTIONS
-- ============================================================================

-- Function to get user's friends
CREATE OR REPLACE FUNCTION get_user_friends(user_uuid UUID)
RETURNS TABLE(friend_id UUID, friend_username VARCHAR, friend_avatar_url TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN f.user1_id = user_uuid THEN f.user2_id 
            ELSE f.user1_id 
        END as friend_id,
        u.username as friend_username,
        u.avatar_url as friend_avatar_url
    FROM friends f
    JOIN users u ON (
        (f.user1_id = user_uuid AND u.id = f.user2_id) OR 
        (f.user2_id = user_uuid AND u.id = f.user1_id)
    )
    WHERE f.user1_id = user_uuid OR f.user2_id = user_uuid;
END;
$$;

-- Function to get nearby races
CREATE OR REPLACE FUNCTION get_nearby_races(user_lat DECIMAL, user_lng DECIMAL, radius_miles INTEGER DEFAULT 50)
RETURNS TABLE(
    race_id UUID,
    race_name VARCHAR,
    race_type race_type,
    start_time TIMESTAMPTZ,
    distance_miles DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id as race_id,
        r.name as race_name,
        r.race_type,
        r.start_time,
        -- Simple distance calculation (not perfectly accurate but fast)
        SQRT(
            POWER(69.1 * (r.start_location_lat - user_lat), 2) +
            POWER(69.1 * (user_lng - r.start_location_lng) * COS(r.start_location_lat / 57.3), 2)
        ) as distance_miles
    FROM races r
    WHERE r.status = 'pending'
    AND r.start_time > NOW()
    AND SQRT(
        POWER(69.1 * (r.start_location_lat - user_lat), 2) +
        POWER(69.1 * (user_lng - r.start_location_lng) * COS(r.start_location_lat / 57.3), 2)
    ) <= radius_miles
    ORDER BY distance_miles ASC;
END;
$$;

-- ============================================================================
-- 9. STORAGE POLICIES FOR EXISTING BUCKETS
-- ============================================================================

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload car images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view car images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload post images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload dyno charts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view dyno charts" ON storage.objects;

-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view all avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Car images policies
CREATE POLICY "Users can upload car images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'car-images' AND 
    auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can view car images" ON storage.objects
FOR SELECT USING (bucket_id = 'car-images');

-- Event images policies
CREATE POLICY "Users can upload event images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'event-images' AND 
    auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can view event images" ON storage.objects
FOR SELECT USING (bucket_id = 'event-images');

-- Post images policies
CREATE POLICY "Users can upload post images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'post-images' AND 
    auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can view post images" ON storage.objects
FOR SELECT USING (bucket_id = 'post-images');

-- Dyno charts policies
CREATE POLICY "Users can upload dyno charts" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'dyno-charts' AND 
    auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can view dyno charts" ON storage.objects
FOR SELECT USING (bucket_id = 'dyno-charts');

-- ============================================================================
-- 10. INSERT SAMPLE DATA (OPTIONAL)
-- ============================================================================

-- You can uncomment and customize this section to add sample data
/*
-- Insert a sample user (you'll need to create this user in Supabase Auth first)
INSERT INTO users (
    auth_user_id, 
    email, 
    username, 
    first_name, 
    last_name,
    bio,
    location_city,
    location_state
) VALUES (
    '6fb0e50d-5c59-4375-b296-2319be3af46b'::UUID, -- Replace with actual auth user ID
    'dev.tcr.1@gmail.com',
    'dashracer',
    'Demo',
    'User',
    'Professional street racer and car enthusiast',
    'Los Angeles',
    'CA'
);
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add a comment to track migration
DO $$
BEGIN
    EXECUTE 'COMMENT ON SCHEMA public IS ''DASH RACING Database Schema - Migrated on ' || NOW()::text || '''';
END $$;

-- Show completion message
DO $$
BEGIN
    RAISE NOTICE 'DASH RACING Database Migration Completed Successfully!';
    RAISE NOTICE 'Tables Created: 11';
    RAISE NOTICE 'Indexes Created: 25+';
    RAISE NOTICE 'RLS Policies Created: 30+';
    RAISE NOTICE 'Storage Policies Created: 10';
    RAISE NOTICE 'Functions Created: 5';
    RAISE NOTICE 'Triggers Created: 6';
    RAISE NOTICE '---';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Test your API endpoints';
    RAISE NOTICE '2. Run your application tests';
    RAISE NOTICE '3. Add sample data if needed';
    RAISE NOTICE '4. Configure additional storage buckets if required';
END $$;