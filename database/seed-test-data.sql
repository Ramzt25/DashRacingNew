-- DASH Racing Test Data Seeding Script
-- Creates 5 test users with complete profiles, vehicles, races, and relationships
-- This provides consistent test data for comprehensive API testing

-- Clear existing data (in correct order to respect foreign keys)
DELETE FROM race_participants WHERE 1=1;
DELETE FROM race_results WHERE 1=1;
DELETE FROM friendships WHERE 1=1;
DELETE FROM vehicles WHERE 1=1;
DELETE FROM races WHERE 1=1;
DELETE FROM meetups WHERE 1=1;
DELETE FROM users WHERE 1=1;

-- Reset sequences
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS vehicles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS races_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS meetups_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS friendships_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS race_participants_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS race_results_id_seq RESTART WITH 1;

-- Insert 5 Test Users
INSERT INTO users (auth_user_id, email, username, avatar, location, preferences, stats, is_pro, created_at) VALUES
-- User 1: Test Driver (Pro User)
('auth_test_1', 'test1@dashracingapp.com', 'speedracer', 'https://i.pravatar.cc/150?u=test1', 
 ST_SetSRID(ST_MakePoint(-118.2437, 34.0522), 4326), -- Los Angeles
 '{"notifications": true, "location": true, "units": "imperial", "soundEnabled": true, "vibrationEnabled": true}',
 '{"totalRaces": 45, "wins": 12, "bestTime": "2:34.567", "totalDistance": 892.5, "winRate": 26.7, "racesWon": 12, "bestLapTime": "1:12.345", "averageSpeed": 87.3}',
 true, NOW() - INTERVAL '6 months'),

-- User 2: Casual Racer
('auth_test_2', 'test2@dashracingapp.com', 'streetking', 'https://i.pravatar.cc/150?u=test2',
 ST_SetSRID(ST_MakePoint(-87.6298, 41.8781), 4326), -- Chicago
 '{"notifications": true, "location": true, "units": "metric", "soundEnabled": false, "vibrationEnabled": true}',
 '{"totalRaces": 28, "wins": 5, "bestTime": "2:45.123", "totalDistance": 567.8, "winRate": 17.9, "racesWon": 5, "bestLapTime": "1:18.901", "averageSpeed": 82.1}',
 false, NOW() - INTERVAL '4 months'),

-- User 3: Track Enthusiast
('auth_test_3', 'test3@dashracingapp.com', 'trackmaster', 'https://i.pravatar.cc/150?u=test3',
 ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326), -- San Francisco
 '{"notifications": false, "location": true, "units": "imperial", "soundEnabled": true, "vibrationEnabled": false}',
 '{"totalRaces": 67, "wins": 23, "bestTime": "2:28.890", "totalDistance": 1234.6, "winRate": 34.3, "racesWon": 23, "bestLapTime": "1:09.567", "averageSpeed": 91.7}',
 true, NOW() - INTERVAL '8 months'),

-- User 4: Weekend Warrior
('auth_test_4', 'test4@dashracingapp.com', 'weekendwarrior', 'https://i.pravatar.cc/150?u=test4',
 ST_SetSRID(ST_MakePoint(-73.9352, 40.7306), 4326), -- New York
 '{"notifications": true, "location": false, "units": "imperial", "soundEnabled": true, "vibrationEnabled": true}',
 '{"totalRaces": 19, "wins": 3, "bestTime": "2:52.456", "totalDistance": 345.2, "winRate": 15.8, "racesWon": 3, "bestLapTime": "1:25.234", "averageSpeed": 78.9}',
 false, NOW() - INTERVAL '2 months'),

-- User 5: Newcomer
('auth_test_5', 'test5@dashracingapp.com', 'newbie', 'https://i.pravatar.cc/150?u=test5',
 ST_SetSRID(ST_MakePoint(-80.1918, 25.7617), 4326), -- Miami
 '{"notifications": true, "location": true, "units": "metric", "soundEnabled": true, "vibrationEnabled": true}',
 '{"totalRaces": 7, "wins": 1, "bestTime": "3:05.789", "totalDistance": 134.7, "winRate": 14.3, "racesWon": 1, "bestLapTime": "1:32.678", "averageSpeed": 74.2}',
 false, NOW() - INTERVAL '3 weeks');

-- Insert Test Vehicles (2-3 vehicles per user)
INSERT INTO vehicles (user_id, make, model, year, color, license_plate, performance_data, is_primary, created_at) VALUES
-- User 1 vehicles (speedracer)
(1, 'Ferrari', '488 GTB', 2020, 'Rosso Corsa', 'SPEED001', 
 '{"horsepower": 661, "weight": 3252, "topSpeed": 205, "acceleration": 3.0, "handling": 9.2, "braking": 8.8, "tuning": {"engine": "Stage 2", "suspension": "Sport", "tires": "Racing", "aerodynamics": "Aggressive"}}',
 true, NOW() - INTERVAL '6 months'),
(1, 'Porsche', '911 GT3', 2021, 'Guards Red', 'SPEED002',
 '{"horsepower": 502, "weight": 3153, "topSpeed": 197, "acceleration": 3.4, "handling": 9.5, "braking": 9.0, "tuning": {"engine": "Stock", "suspension": "Track", "tires": "Semi-slick", "aerodynamics": "Balanced"}}',
 false, NOW() - INTERVAL '4 months'),

-- User 2 vehicles (streetking)
(2, 'BMW', 'M3 Competition', 2022, 'Alpine White', 'STREET01',
 '{"horsepower": 503, "weight": 3870, "topSpeed": 180, "acceleration": 3.9, "handling": 8.7, "braking": 8.5, "tuning": {"engine": "Stage 1", "suspension": "Comfort", "tires": "Performance", "aerodynamics": "Stock"}}',
 true, NOW() - INTERVAL '4 months'),
(2, 'Audi', 'RS5', 2021, 'Nardo Gray', 'STREET02',
 '{"horsepower": 444, "weight": 3792, "topSpeed": 174, "acceleration": 3.7, "handling": 8.3, "braking": 8.2, "tuning": {"engine": "Stock", "suspension": "Comfort", "tires": "All-season", "aerodynamics": "Stock"}}',
 false, NOW() - INTERVAL '2 months'),

-- User 3 vehicles (trackmaster)
(3, 'McLaren', '720S', 2020, 'Papaya Orange', 'TRACK001',
 '{"horsepower": 710, "weight": 3186, "topSpeed": 212, "acceleration": 2.9, "handling": 9.8, "braking": 9.5, "tuning": {"engine": "Stage 3", "suspension": "Race", "tires": "Slick", "aerodynamics": "Maximum"}}',
 true, NOW() - INTERVAL '8 months'),
(3, 'Lamborghini', 'Huracan Evo', 2021, 'Verde Mantis', 'TRACK002',
 '{"horsepower": 631, "weight": 3135, "topSpeed": 202, "acceleration": 3.2, "handling": 9.3, "braking": 9.1, "tuning": {"engine": "Stage 2", "suspension": "Sport", "tires": "Racing", "aerodynamics": "Aggressive"}}',
 false, NOW() - INTERVAL '6 months'),
(3, 'Nissan', 'GT-R Nismo', 2022, 'Pearl White', 'TRACK003',
 '{"horsepower": 600, "weight": 3865, "topSpeed": 196, "acceleration": 2.5, "handling": 8.9, "braking": 8.7, "tuning": {"engine": "Stage 2", "suspension": "Track", "tires": "Semi-slick", "aerodynamics": "Balanced"}}',
 false, NOW() - INTERVAL '3 months'),

-- User 4 vehicles (weekendwarrior)
(4, 'Ford', 'Mustang GT', 2021, 'Race Red', 'WKND001',
 '{"horsepower": 460, "weight": 3705, "topSpeed": 163, "acceleration": 4.3, "handling": 7.8, "braking": 7.5, "tuning": {"engine": "Stock", "suspension": "Comfort", "tires": "Performance", "aerodynamics": "Stock"}}',
 true, NOW() - INTERVAL '2 months'),
(4, 'Chevrolet', 'Camaro SS', 2020, 'Shock Yellow', 'WKND002',
 '{"horsepower": 455, "weight": 3685, "topSpeed": 165, "acceleration": 4.0, "handling": 7.9, "braking": 7.6, "tuning": {"engine": "Stock", "suspension": "Sport", "tires": "Performance", "aerodynamics": "Stock"}}',
 false, NOW() - INTERVAL '1 month'),

-- User 5 vehicles (newbie)
(5, 'Honda', 'Civic Type R', 2022, 'Championship White', 'NOOB001',
 '{"horsepower": 315, "weight": 3117, "topSpeed": 169, "acceleration": 5.7, "handling": 8.5, "braking": 8.0, "tuning": {"engine": "Stock", "suspension": "Stock", "tires": "Performance", "aerodynamics": "Stock"}}',
 true, NOW() - INTERVAL '3 weeks');

-- Insert Friendships (bi-directional relationships)
INSERT INTO friendships (user_id, friend_id, status, created_at) VALUES
-- speedracer <-> streetking (accepted)
(1, 2, 'accepted', NOW() - INTERVAL '5 months'),
(2, 1, 'accepted', NOW() - INTERVAL '5 months'),
-- speedracer <-> trackmaster (accepted)
(1, 3, 'accepted', NOW() - INTERVAL '7 months'),
(3, 1, 'accepted', NOW() - INTERVAL '7 months'),
-- streetking <-> weekendwarrior (accepted)
(2, 4, 'accepted', NOW() - INTERVAL '1 month'),
(4, 2, 'accepted', NOW() - INTERVAL '1 month'),
-- trackmaster -> newbie (pending - trackmaster sent request)
(3, 5, 'pending', NOW() - INTERVAL '1 week'),
-- newbie -> weekendwarrior (pending - newbie sent request)
(5, 4, 'pending', NOW() - INTERVAL '5 days');

-- Insert Test Races
INSERT INTO races (created_by, title, description, race_type, track_data, start_time, max_participants, entry_fee, prize_pool, status, weather_conditions, created_at) VALUES
-- Completed Race 1: Canyon Sprint (speedracer won)
(1, 'Sunset Canyon Sprint', 'High-speed canyon run with tight turns and elevation changes', 'time_trial',
 '{"name": "Sunset Canyon", "length": 4.2, "turns": 23, "elevation": 450, "difficulty": "Expert", "surface": "Asphalt", "coordinates": [{"lat": 34.1234, "lng": -118.5678}, {"lat": 34.1345, "lng": -118.5789}]}',
 NOW() - INTERVAL '2 weeks', 6, 50.00, 300.00, 'completed',
 '{"temperature": 78, "humidity": 45, "windSpeed": 12, "conditions": "Clear", "visibility": "Excellent"}',
 NOW() - INTERVAL '3 weeks'),

-- Completed Race 2: City Circuit (trackmaster won)
(3, 'Downtown Circuit Challenge', 'Urban circuit race through city streets', 'circuit',
 '{"name": "Downtown Circuit", "length": 3.8, "turns": 18, "elevation": 120, "difficulty": "Intermediate", "surface": "Asphalt", "coordinates": [{"lat": 37.7849, "lng": -122.4094}, {"lat": 37.7950, "lng": -122.4195}]}',
 NOW() - INTERVAL '1 week', 8, 75.00, 600.00, 'completed',
 '{"temperature": 65, "humidity": 70, "windSpeed": 8, "conditions": "Overcast", "visibility": "Good"}',
 NOW() - INTERVAL '2 weeks'),

-- Active Race: Highway Thunder (registration open)
(2, 'Highway Thunder Run', 'Long straight highway with high-speed sections', 'drag',
 '{"name": "Highway Thunder", "length": 2.1, "turns": 4, "elevation": 50, "difficulty": "Beginner", "surface": "Asphalt", "coordinates": [{"lat": 41.8881, "lng": -87.6398}, {"lat": 41.8981, "lng": -87.6498}]}',
 NOW() + INTERVAL '3 days', 10, 25.00, 250.00, 'active',
 '{"temperature": 72, "humidity": 55, "windSpeed": 15, "conditions": "Partly Cloudy", "visibility": "Good"}',
 NOW() - INTERVAL '5 days'),

-- Scheduled Race: Mountain Pass (future)
(1, 'Mountain Pass Mayhem', 'Challenging mountain road with hairpin turns', 'hill_climb',
 '{"name": "Mountain Pass", "length": 6.7, "turns": 34, "elevation": 890, "difficulty": "Expert", "surface": "Mixed", "coordinates": [{"lat": 40.7406, "lng": -73.9352}, {"lat": 40.7506, "lng": -73.9452}]}',
 NOW() + INTERVAL '1 week', 4, 100.00, 400.00, 'scheduled',
 '{"temperature": 68, "humidity": 60, "windSpeed": 20, "conditions": "Clear", "visibility": "Excellent"}',
 NOW() - INTERVAL '1 day');

-- Insert Race Participants
INSERT INTO race_participants (race_id, user_id, vehicle_id, joined_at) VALUES
-- Sunset Canyon Sprint participants (race_id: 1)
(1, 1, 1, NOW() - INTERVAL '3 weeks'),    -- speedracer with Ferrari
(1, 2, 1, NOW() - INTERVAL '2 weeks 6 days'), -- streetking with BMW M3
(1, 3, 1, NOW() - INTERVAL '2 weeks 5 days'), -- trackmaster with McLaren
(1, 4, 1, NOW() - INTERVAL '2 weeks 4 days'), -- weekendwarrior with Mustang

-- Downtown Circuit participants (race_id: 2)
(2, 1, 2, NOW() - INTERVAL '2 weeks'),    -- speedracer with Porsche
(2, 2, 2, NOW() - INTERVAL '1 week 6 days'), -- streetking with Audi
(2, 3, 2, NOW() - INTERVAL '1 week 5 days'), -- trackmaster with Lamborghini
(2, 4, 2, NOW() - INTERVAL '1 week 4 days'), -- weekendwarrior with Camaro
(2, 5, 1, NOW() - INTERVAL '1 week 3 days'), -- newbie with Civic

-- Highway Thunder participants (race_id: 3) - ongoing registration
(3, 2, 1, NOW() - INTERVAL '4 days'),     -- streetking with BMW M3
(3, 4, 1, NOW() - INTERVAL '3 days'),     -- weekendwarrior with Mustang
(3, 5, 1, NOW() - INTERVAL '2 days'),     -- newbie with Civic

-- Mountain Pass participants (race_id: 4) - future race
(4, 1, 1, NOW() - INTERVAL '1 day'),      -- speedracer with Ferrari
(4, 3, 1, NOW() - INTERVAL '12 hours');   -- trackmaster with McLaren

-- Insert Race Results (for completed races only)
INSERT INTO race_results (race_id, user_id, vehicle_id, position, lap_time, total_time, top_speed, average_speed, created_at) VALUES
-- Sunset Canyon Sprint Results (race_id: 1)
(1, 1, 1, 1, '1:12.345', '2:34.567', 142.8, 87.3, NOW() - INTERVAL '2 weeks'), -- speedracer 1st
(1, 3, 1, 2, '1:15.678', '2:38.234', 138.9, 85.1, NOW() - INTERVAL '2 weeks'), -- trackmaster 2nd
(1, 2, 1, 3, '1:18.901', '2:45.123', 135.2, 82.1, NOW() - INTERVAL '2 weeks'), -- streetking 3rd
(1, 4, 1, 4, '1:25.234', '2:52.456', 128.7, 78.9, NOW() - INTERVAL '2 weeks'), -- weekendwarrior 4th

-- Downtown Circuit Results (race_id: 2)
(2, 3, 2, 1, '1:09.567', '2:28.890', 156.4, 91.7, NOW() - INTERVAL '1 week'), -- trackmaster 1st
(2, 1, 2, 2, '1:11.234', '2:31.445', 152.1, 89.5, NOW() - INTERVAL '1 week'), -- speedracer 2nd
(2, 2, 2, 3, '1:16.789', '2:42.567', 145.8, 84.3, NOW() - INTERVAL '1 week'), -- streetking 3rd
(2, 4, 2, 4, '1:22.456', '2:48.234', 141.2, 81.7, NOW() - INTERVAL '1 week'), -- weekendwarrior 4th
(2, 5, 1, 5, '1:32.678', '3:05.789', 132.5, 74.2, NOW() - INTERVAL '1 week'); -- newbie 5th

-- Insert Sample Meetups
INSERT INTO meetups (created_by, title, description, location, start_time, max_participants, entry_fee, status, created_at) VALUES
-- Active Meetup
(1, 'Cars & Coffee LA', 'Weekly gathering of automotive enthusiasts in Los Angeles', 
 ST_SetSRID(ST_MakePoint(-118.2437, 34.0522), 4326), -- Los Angeles
 NOW() + INTERVAL '2 days', 50, 0.00, 'active', NOW() - INTERVAL '1 week'),

-- Scheduled Meetup
(3, 'Track Day Prep', 'Pre-track day vehicle inspection and setup discussion',
 ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326), -- San Francisco
 NOW() + INTERVAL '5 days', 15, 10.00, 'scheduled', NOW() - INTERVAL '3 days'),

-- Completed Meetup
(2, 'Chicago Speed Society', 'Monthly meetup for Chicago-area racers',
 ST_SetSRID(ST_MakePoint(-87.6298, 41.8781), 4326), -- Chicago
 NOW() - INTERVAL '1 week', 30, 5.00, 'completed', NOW() - INTERVAL '2 weeks');

-- Add some meetup participants
INSERT INTO meetup_participants (meetup_id, user_id, joined_at) VALUES
-- Cars & Coffee LA (meetup_id: 1)
(1, 1, NOW() - INTERVAL '6 days'),
(1, 2, NOW() - INTERVAL '5 days'),
(1, 4, NOW() - INTERVAL '4 days'),

-- Track Day Prep (meetup_id: 2)
(2, 1, NOW() - INTERVAL '2 days'),
(2, 3, NOW() - INTERVAL '2 days'),

-- Chicago Speed Society (meetup_id: 3) - completed
(3, 2, NOW() - INTERVAL '1 week 6 days'),
(3, 4, NOW() - INTERVAL '1 week 5 days'),
(3, 5, NOW() - INTERVAL '1 week 4 days');

-- Verify the data was inserted correctly
SELECT 'Users' AS table_name, COUNT(*) AS count FROM users
UNION ALL
SELECT 'Vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'Races', COUNT(*) FROM races
UNION ALL
SELECT 'Race Participants', COUNT(*) FROM race_participants
UNION ALL
SELECT 'Race Results', COUNT(*) FROM race_results
UNION ALL
SELECT 'Friendships', COUNT(*) FROM friendships
UNION ALL
SELECT 'Meetups', COUNT(*) FROM meetups
UNION ALL
SELECT 'Meetup Participants', COUNT(*) FROM meetup_participants;

-- Show sample data for verification
SELECT 'Test Users Created:' AS info;
SELECT username, email, is_pro, 
       json_extract_path_text(stats, 'totalRaces') AS races,
       json_extract_path_text(stats, 'wins') AS wins
FROM users ORDER BY id;

SELECT 'Test Vehicles Created:' AS info;
SELECT u.username, v.make, v.model, v.year, v.color, v.is_primary
FROM vehicles v 
JOIN users u ON v.user_id = u.id 
ORDER BY v.user_id, v.id;

SELECT 'Test Races Created:' AS info;
SELECT title, race_type, status, max_participants,
       (SELECT COUNT(*) FROM race_participants WHERE race_id = races.id) AS current_participants
FROM races ORDER BY id;