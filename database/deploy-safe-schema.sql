-- DASH RACING Safe Database Schema Deployment
-- This script creates tables using IF NOT EXISTS to avoid conflicts

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (skip if exists since it's already there)
-- CREATE TABLE IF NOT EXISTS users (...) -- Skipping since it exists

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    -- Basic info
    year INTEGER NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    trim VARCHAR(50),
    color VARCHAR(30),
    
    -- Specifications
    engine_size DECIMAL(4,2), -- in liters
    horsepower INTEGER,
    torque INTEGER,
    weight INTEGER, -- in pounds
    drivetrain VARCHAR(10) CHECK (drivetrain IN ('FWD', 'RWD', 'AWD', '4WD')),
    transmission VARCHAR(20),
    fuel_type VARCHAR(20) DEFAULT 'gasoline',
    
    -- Performance
    quarter_mile_time DECIMAL(6,3),
    zero_to_sixty DECIMAL(4,2),
    top_speed INTEGER,
    
    -- Media
    image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle modifications table
CREATE TABLE IF NOT EXISTS vehicle_modifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    
    category VARCHAR(50) NOT NULL, -- engine, exhaust, suspension, etc.
    name VARCHAR(100) NOT NULL,
    description TEXT,
    brand VARCHAR(50),
    part_number VARCHAR(50),
    cost DECIMAL(10,2),
    installation_date DATE,
    
    -- Performance impact
    horsepower_gain INTEGER DEFAULT 0,
    torque_gain INTEGER DEFAULT 0,
    weight_change INTEGER DEFAULT 0, -- can be negative
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friends/social relationships
CREATE TABLE IF NOT EXISTS friendships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    addressee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(requester_id, addressee_id),
    CHECK (requester_id != addressee_id)
);

-- Races table
CREATE TABLE IF NOT EXISTS races (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    -- Basic info
    name VARCHAR(100) NOT NULL,
    description TEXT,
    race_type VARCHAR(20) DEFAULT 'drag' CHECK (race_type IN ('drag', 'circuit', 'street', 'autocross')),
    
    -- Location and route
    start_location JSONB NOT NULL, -- {lat, lng, address}
    end_location JSONB, -- for point-to-point races
    route JSONB, -- array of waypoints for complex routes
    distance DECIMAL(8,2), -- in miles or km
    
    -- Timing
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    finish_time TIMESTAMP WITH TIME ZONE,
    
    -- Settings
    max_participants INTEGER DEFAULT 8,
    entry_fee DECIMAL(8,2) DEFAULT 0.0,
    is_private BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    
    -- Status
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'finished', 'cancelled')),
    weather_conditions JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Race participants
CREATE TABLE IF NOT EXISTS race_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    race_id UUID REFERENCES races(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    
    -- Participation details
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'ready', 'racing', 'finished', 'dnf', 'withdrawn')),
    lane_number INTEGER,
    
    -- Performance data
    reaction_time DECIMAL(5,3),
    sixty_foot_time DECIMAL(5,3),
    quarter_mile_time DECIMAL(6,3),
    trap_speed DECIMAL(6,2),
    final_time DECIMAL(8,3),
    position INTEGER,
    
    -- Location tracking during race
    location_data JSONB, -- array of {timestamp, lat, lng, speed}
    
    UNIQUE(race_id, user_id)
);

-- Race results and rankings
CREATE TABLE IF NOT EXISTS race_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    race_id UUID REFERENCES races(id) ON DELETE CASCADE NOT NULL,
    participant_id UUID REFERENCES race_participants(id) ON DELETE CASCADE NOT NULL,
    
    position INTEGER NOT NULL,
    time_result DECIMAL(8,3) NOT NULL,
    speed_result DECIMAL(6,2),
    
    -- Detailed timing splits
    splits JSONB, -- array of split times
    
    -- Awards/achievements
    is_winner BOOLEAN DEFAULT false,
    awards JSONB DEFAULT '[]'::jsonb, -- array of award names
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(race_id, participant_id),
    UNIQUE(race_id, position)
);

-- Chat messages (for race lobbies and friend chats)
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    -- Message context
    race_id UUID REFERENCES races(id) ON DELETE CASCADE, -- for race chat
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE, -- for direct messages
    
    -- Content
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system', 'location')),
    metadata JSONB, -- for image URLs, location data, etc.
    
    -- Status
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure message has either race_id or recipient_id but not both
    CHECK (
        (race_id IS NOT NULL AND recipient_id IS NULL) OR 
        (race_id IS NULL AND recipient_id IS NOT NULL)
    )
);

-- User achievements/trophies
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    achievement_type VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    
    -- Achievement data
    value INTEGER, -- number of wins, races, etc.
    metadata JSONB, -- additional achievement data
    
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_type, achievement_name)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    type VARCHAR(50) NOT NULL, -- friend_request, race_invite, race_result, etc.
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    
    -- Related entities
    related_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    related_race_id UUID REFERENCES races(id) ON DELETE SET NULL,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    action_url TEXT, -- deep link for notification action
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance (using IF NOT EXISTS equivalents)
DO $$ 
BEGIN
    -- Users indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_auth_user_id') THEN
        CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
        CREATE INDEX idx_users_email ON users(email);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_username') THEN
        CREATE INDEX idx_users_username ON users(username);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_last_active') THEN
        CREATE INDEX idx_users_last_active ON users(last_active_at DESC);
    END IF;
    
    -- Vehicles indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vehicles_user_id') THEN
        CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vehicles_active') THEN
        CREATE INDEX idx_vehicles_active ON vehicles(user_id, is_active) WHERE is_active = true;
    END IF;
    
    -- Friendships indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_friendships_requester') THEN
        CREATE INDEX idx_friendships_requester ON friendships(requester_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_friendships_addressee') THEN
        CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_friendships_status') THEN
        CREATE INDEX idx_friendships_status ON friendships(status);
    END IF;
    
    -- Additional indexes for other tables...
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_races_created_by') THEN
        CREATE INDEX idx_races_created_by ON races(created_by);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_races_status') THEN
        CREATE INDEX idx_races_status ON races(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_races_scheduled_start') THEN
        CREATE INDEX idx_races_scheduled_start ON races(scheduled_start);
    END IF;
END $$;