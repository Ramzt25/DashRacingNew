-- DASH RACING Complete Database Schema
-- This script creates all tables, indexes, RLS policies, and triggers needed for the app

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (core user profiles)
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    phone VARCHAR(20),
    location JSONB, -- {lat, lng, city, state, country}
    
    -- Preferences
    units VARCHAR(10) DEFAULT 'imperial' CHECK (units IN ('imperial', 'metric')),
    notifications_enabled BOOLEAN DEFAULT true,
    location_sharing_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    vibration_enabled BOOLEAN DEFAULT true,
    
    -- Subscription
    is_pro BOOLEAN DEFAULT false,
    pro_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Statistics
    total_races INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_distance DECIMAL(10,2) DEFAULT 0.0,
    win_rate DECIMAL(5,2) DEFAULT 0.0,
    average_speed DECIMAL(6,2) DEFAULT 0.0,
    best_quarter_mile DECIMAL(6,3),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE vehicles (
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
CREATE TABLE vehicle_modifications (
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
CREATE TABLE friendships (
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
CREATE TABLE races (
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
CREATE TABLE race_participants (
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
CREATE TABLE race_results (
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
CREATE TABLE messages (
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
CREATE TABLE achievements (
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
CREATE TABLE notifications (
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

-- Create indexes for performance
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_last_active ON users(last_active_at DESC);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_active ON vehicles(user_id, is_active) WHERE is_active = true;

CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);

CREATE INDEX idx_races_created_by ON races(created_by);
CREATE INDEX idx_races_status ON races(status);
CREATE INDEX idx_races_scheduled_start ON races(scheduled_start);
CREATE INDEX idx_races_location ON races USING gin(start_location);

CREATE INDEX idx_race_participants_race ON race_participants(race_id);
CREATE INDEX idx_race_participants_user ON race_participants(user_id);
CREATE INDEX idx_race_participants_status ON race_participants(status);

CREATE INDEX idx_race_results_race ON race_results(race_id);
CREATE INDEX idx_race_results_position ON race_results(race_id, position);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_race ON messages(race_id) WHERE race_id IS NOT NULL;
CREATE INDEX idx_messages_recipient ON messages(recipient_id) WHERE recipient_id IS NOT NULL;
CREATE INDEX idx_messages_created ON messages(created_at DESC);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can view public profiles" ON users
    FOR SELECT USING (true); -- Allow viewing all profiles

CREATE POLICY "Service role can manage users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for vehicles
CREATE POLICY "Users can manage their own vehicles" ON vehicles
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view all active vehicles" ON vehicles
    FOR SELECT USING (is_active = true);

-- RLS Policies for friendships
CREATE POLICY "Users can manage their friendships" ON friendships
    FOR ALL USING (
        requester_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
        addressee_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    );

-- RLS Policies for races
CREATE POLICY "Users can create races" ON races
    FOR INSERT WITH CHECK (created_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view public races" ON races
    FOR SELECT USING (is_private = false OR created_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Race creators can manage their races" ON races
    FOR ALL USING (created_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- RLS Policies for race participants
CREATE POLICY "Users can manage their race participation" ON race_participants
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view race participants for races they can see" ON race_participants
    FOR SELECT USING (
        race_id IN (
            SELECT id FROM races WHERE 
            is_private = false OR 
            created_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
            id IN (SELECT race_id FROM race_participants WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()))
        )
    );

-- RLS Policies for messages
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (sender_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT USING (
        sender_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
        recipient_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
        (race_id IS NOT NULL AND race_id IN (
            SELECT race_id FROM race_participants 
            WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
        ))
    );

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Create trigger functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER friendships_updated_at BEFORE UPDATE ON friendships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER races_updated_at BEFORE UPDATE ON races
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create function to update user statistics
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user statistics when race results change
    UPDATE users SET
        total_races = (
            SELECT COUNT(*) FROM race_participants 
            WHERE user_id = users.id AND status = 'finished'
        ),
        total_wins = (
            SELECT COUNT(*) FROM race_results 
            WHERE participant_id IN (
                SELECT id FROM race_participants WHERE user_id = users.id
            ) AND position = 1
        ),
        win_rate = CASE 
            WHEN (SELECT COUNT(*) FROM race_participants WHERE user_id = users.id AND status = 'finished') > 0
            THEN (
                SELECT COUNT(*) FROM race_results 
                WHERE participant_id IN (
                    SELECT id FROM race_participants WHERE user_id = users.id
                ) AND position = 1
            ) * 100.0 / (
                SELECT COUNT(*) FROM race_participants 
                WHERE user_id = users.id AND status = 'finished'
            )
            ELSE 0
        END,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update user stats
CREATE TRIGGER update_user_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON race_results
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- Function to automatically accept friend requests between users who race together
CREATE OR REPLACE FUNCTION auto_friend_racers()
RETURNS TRIGGER AS $$
BEGIN
    -- When two users race together, create friendship if it doesn't exist
    INSERT INTO friendships (requester_id, addressee_id, status)
    SELECT DISTINCT 
        rp1.user_id as requester_id,
        rp2.user_id as addressee_id,
        'accepted' as status
    FROM race_participants rp1
    JOIN race_participants rp2 ON rp1.race_id = rp2.race_id
    WHERE rp1.race_id = NEW.race_id
        AND rp1.user_id != rp2.user_id
        AND NOT EXISTS (
            SELECT 1 FROM friendships f 
            WHERE (f.requester_id = rp1.user_id AND f.addressee_id = rp2.user_id)
               OR (f.requester_id = rp2.user_id AND f.addressee_id = rp1.user_id)
        )
    ON CONFLICT (requester_id, addressee_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for auto-friending racers
CREATE TRIGGER auto_friend_racers_trigger
    AFTER INSERT ON race_participants
    FOR EACH ROW EXECUTE FUNCTION auto_friend_racers();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;