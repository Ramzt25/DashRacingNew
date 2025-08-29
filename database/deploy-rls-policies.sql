-- DASH RACING RLS Policies and Permissions Setup
-- Run this AFTER the safe schema deployment

-- Enable Row Level Security on all tables
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

-- Drop existing policies if they exist, then create new ones
-- Users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view public profiles" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;

CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can view public profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Vehicles policies
DROP POLICY IF EXISTS "Users can manage their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can view all active vehicles" ON vehicles;

CREATE POLICY "Users can manage their own vehicles" ON vehicles
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view all active vehicles" ON vehicles
    FOR SELECT USING (is_active = true);

-- Friendships policies
DROP POLICY IF EXISTS "Users can manage their friendships" ON friendships;

CREATE POLICY "Users can manage their friendships" ON friendships
    FOR ALL USING (
        requester_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
        addressee_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    );

-- Races policies
DROP POLICY IF EXISTS "Users can create races" ON races;
DROP POLICY IF EXISTS "Users can view public races" ON races;
DROP POLICY IF EXISTS "Race creators can manage their races" ON races;

CREATE POLICY "Users can create races" ON races
    FOR INSERT WITH CHECK (created_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view public races" ON races
    FOR SELECT USING (is_private = false OR created_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Race creators can manage their races" ON races
    FOR ALL USING (created_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create trigger functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers (drop first if they exist)
DROP TRIGGER IF EXISTS users_updated_at ON users;
DROP TRIGGER IF EXISTS vehicles_updated_at ON vehicles;
DROP TRIGGER IF EXISTS friendships_updated_at ON friendships;
DROP TRIGGER IF EXISTS races_updated_at ON races;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER friendships_updated_at BEFORE UPDATE ON friendships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER races_updated_at BEFORE UPDATE ON races
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();