# DASH RACING E2E Testing - Agent Development Prompt

## 🎯 MISSION OBJECTIVE
You are a senior full-stack developer tasked with completing the DASH RACING application's E2E testing suite. Your goal is to achieve **100% test coverage (37/37 tests passing)** by implementing remaining backend functionality, AI-powered vehicle intelligence, enhanced Google Maps integration with dark theme, and fixing existing issues.

## 🚀 NEW FEATURES TO IMPLEMENT

### 🤖 AI-Powered Vehicle Intelligence System
- **Vehicle Data Enhancement**: Use AI to automatically lookup and populate vehicle specifications when users add vehicles (year/make/model)
  - Trim levels, horsepower, torque, 0-60 times, top speed, weight, transmission, drivetrain
  - Factory specifications and available options
- **Learning Database**: Create intelligent caching system to reduce AI API calls
  - `vehicle_specs_cache` table for year/make/model/trim combinations
  - Smart lookup: check cache first, then AI, then cache results
  - Progressive learning system that gets smarter over time
- **AI Modification Suggestions**: Intelligent performance upgrade recommendations
  - Suggest realistic modifications based on vehicle platform
  - Estimate horsepower gains and cost for each modification
  - Provide compatibility checking and installation prerequisites
- **Remove License Plate Tracking**: Eliminate fuel_type→licensePlate mapping entirely

### 🗺️ Enhanced Google Maps Integration
- **Custom Dark Theme**: Need for Speed/GTA-inspired map styling
  - Black background with red accent colors
  - Gaming-style markers and UI elements
  - Dark mode optimized for night racing aesthetics
- **Live Map Features**: Real-time racing ecosystem visualization
  - Show live races and events with custom markers
  - Display friends and users on map with status indicators
  - Real-time location updates for active participants
  - Event countdown timers and race progress indicators
- **Advanced Filtering**: Granular control over map content
  - Toggle visibility: races, events, friends, users, meetups
  - Filter by race type, event category, friend groups
  - Search and filter by location radius
- **Navigation Integration**: Click-to-navigate functionality
  - Direct routing to race events and meetups
  - Turn-by-turn directions with ETA updates
  - Optimal route suggestions for racing events

### 🎨 Custom Branding Integration
- **App Icon Integration**: Custom logo throughout application
  - Web app favicon in multiple sizes (16x16, 32x32, 64x64)
  - Mobile app icons for iOS and Android platforms
  - Loading screen branding and splash screens
  - Navigation header logo and consistent brand identity

## 📋 CURRENT STATE ANALYSIS

### ✅ What's Working (15/37 tests passing - 41%)
- **Authentication Module**: 100% complete (9/9 tests) ✅
- **Vehicle CRUD**: 67% complete (6/9 tests) ✅  
- **Database Infrastructure**: Fully deployed with Supabase integration ✅
- **Authorization System**: Complete user isolation and validation ✅

### 🚧 What Needs Implementation (22/37 tests remaining + New AI/Mapping Features)

#### HIGH PRIORITY (Critical Path Items + New Features)

1. **Remove License Plate Tracking** (Simplification)
   - Issue: Currently using fuel_type field for license plates (confusing mapping)
   - Solution Required: Eliminate license plate tracking entirely
   - Update vehicle creation/update endpoints to remove license plate references
   - Clean up database field mapping logic in SupabaseService
   - Files: `backend/src/routes/vehicles.ts`, `backend/src/services/database.ts`

2. **AI Vehicle Data Enhancement System** (New Feature 🤖)
   - Implement AI-powered vehicle spec lookup when users add vehicles
   - Auto-populate horsepower, torque, 0-60 times, weight, transmission, etc.
   - Create `vehicle_specs_cache` table for intelligent caching
   - Implement learning database to reduce AI API calls over time
   - Files: New `backend/src/services/ai-vehicle-service.ts`, database migration
   - Technology: AI service integration (API to be configured)

1. **Vehicle Performance Endpoint** (Finish 3 remaining vehicle tests)
   - Issue: `/api/vehicles/:id/performance` PUT endpoint exists but response structure incorrect
   - Current Problem: Test expects `vehicle.performance` property but gets specs data
   - Solution Required: Map specs data to performance object in response
   - Files: `backend/src/routes/vehicles.ts`, `backend/src/services/database.ts`
   - Expected Test: "Vehicle statistics and performance data"

2. **Authentication Response Consistency** (Fix multi-user auth)
   - Issue: Second user login fails with "Cannot read properties of undefined (reading 'token')"
   - Current Problem: Login response structure inconsistent across different scenarios
   - Solution Required: Standardize all auth responses to match expected format
   - Files: `backend/src/routes/auth.ts`, `backend/src/services/database.ts`
   - Expected Test: "Cannot access other user vehicles"

3. **Race Management System** (Implement 12 race tests)
   - Status: Backend routes exist but need testing and bug fixes
   - Components Needed:
     - Race creation with validation
     - Race participant management (join/leave)
     - Race lifecycle (start, finish, cancel)
     - Race location tracking
     - Race results and statistics
   - Files: `backend/src/routes/races.ts`, `backend/src/services/database.ts`
   - Database: `races` and `race_participants` tables already exist

4. **WebSocket Real-time Features** (Implement 7 WebSocket tests)
   - Status: WebSocket service initialized but no E2E integration
   - Components Needed:
     - Real-time race updates
     - Participant location broadcasting
     - Race status notifications
     - Connection management
   - Files: `backend/src/services/websocket.ts`, integration with race routes
   - Technology: Socket.io already configured

5. **Google Maps Integration with Dark Theme** (New Feature 🗺️)
   - Implement custom Need for Speed/GTA-inspired map styling
   - Create black background with red accent theme for gaming aesthetics
   - Display live races, events, friends, and users on map with real-time updates
   - Add filtering system (races, friends, events) and click-to-navigate functionality
   - Files: New `frontend/src/components/maps/`, Google Maps API integration
   - Technology: Google Maps JavaScript API (custom styling)

6. **AI Modification Suggestions** (New Feature 🔧)
   - Develop AI-powered modification recommendation engine
   - Estimate horsepower gains and costs for suggested modifications
   - Provide compatibility checking and performance impact predictions
   - Create modification database with performance impact data
   - Files: New `backend/src/services/ai-modification-service.ts`
   - Database: New `modification_suggestions` table

#### MEDIUM PRIORITY (Quality Improvements)

7. **TypeScript Compilation Issues** (17 errors to resolve)
   - Current Problems:
     - Fastify JWT type conflicts
     - Shared types import path issues
     - User property declaration conflicts
   - Files: Multiple files across `src/middleware/`, `src/routes/`, `src/server.ts`
   - Impact: Prevents clean builds but doesn't block functionality

8. **Database Schema Optimization for AI Features**
   - Current: Using creative field mapping (trim→name, fuel_type→licensePlate)
   - Improvement: Add AI enhancement tables and remove license plate mapping
   - New Tables: `vehicle_specs_cache`, `modification_suggestions`
   - Impact: Better AI integration and eliminate confusing field mappings

9. **Custom App Icon Integration** (New Feature 🎨)
   - Implement custom logo throughout application
   - Add favicon, mobile icons, loading screens, navigation headers
   - Consistent branding across all touchpoints
   - Need for Speed/GTA visual design language integration
   - Files: Update all frontend components with branding assets

## 🛠️ TECHNICAL IMPLEMENTATION GUIDE

### Development Environment Setup
```bash
# Backend development
cd backend
npm install
npx ts-node --transpile-only src/server.ts  # For development

# Testing
cd ..
npx jest --config tests/jest.e2e.config.js --runInBand --verbose
```

### Database Connection
- **Supabase URL**: postgresql://postgres.zwmwvwjrmtetntvdnftc:password123@aws-1-us-east-1.pooler.supabase.com:6543/postgres
- **Tables**: users, vehicles, races, race_participants
- **New AI Tables**: vehicle_specs_cache, modification_suggestions
- **ORM**: Custom SupabaseService class in `backend/src/services/database.ts`

### AI Services Integration
- **Vehicle Data Enhancement**: AI service for automatic spec lookup
- **Modification Suggestions**: AI-powered upgrade recommendations
- **Learning Database**: Intelligent caching to reduce API calls
- **APIs**: External AI service integration (configuration pending)

### Authentication Flow
- **JWT Tokens**: Implemented and working
- **Middleware**: `backend/src/middleware/auth.ts` - `authenticateUser` function
- **Format**: Bearer token in Authorization header

### API Structure
- **Base URL**: http://localhost:8000/api
- **Auth Routes**: `/auth/*` (register, login, refresh, logout)
- **Vehicle Routes**: `/vehicles/*` (CRUD, search, performance, AI enhancement)
- **Race Routes**: `/races/*` (creation, management, participation)
- **AI Routes**: `/ai/*` (vehicle specs, modification suggestions) - NEW
- **WebSocket**: ws://localhost:8000/socket.io

### Google Maps Integration
- **API**: Google Maps JavaScript API (custom key to be provided)
- **Styling**: Custom dark theme with Need for Speed/GTA aesthetics
- **Features**: Live events, user tracking, filtering, navigation
- **Theme**: Black background, red accents, gaming-style markers

## 🎯 STEP-BY-STEP IMPLEMENTATION STRATEGY

### Phase 1: Complete Vehicle Module + Remove License Plates (Priority 1)
1. **Remove License Plate Tracking**
   - Eliminate fuel_type→licensePlate mapping entirely
   - Update vehicle creation/update endpoints
   - Remove license plate references from all tests
   - Clean up database field mapping logic

2. **Fix Performance Endpoint**
   - Analyze test file: `tests/e2e/vehicles.test.ts` line ~240
   - Understand expected response format
   - Modify `mapVehicleFromDb` to include `performance` property
   - Test with: `npx jest --testNamePattern="Vehicle statistics and performance data"`

3. **Fix Authentication Consistency**
   - Debug second user creation in test
   - Ensure login response always includes `data.token`
   - Test with: `npx jest --testNamePattern="Cannot access other user vehicles"`

### Phase 2: Implement Race Management (Priority 2)
1. **Analyze Test Requirements**
   - Study `tests/e2e/races.test.ts` thoroughly
   - Understand race lifecycle and expected API calls
   - Review existing race routes in `backend/src/routes/races.ts`

2. **Fix Race CRUD Operations**
   - Test each race endpoint individually
   - Ensure proper validation and error handling
   - Verify database operations work correctly

3. **Implement Race Participation**
   - Join/leave race functionality
   - Participant management and validation
   - Race capacity and status checks

### Phase 3: Add WebSocket Integration (Priority 3)
1. **Study WebSocket Tests**
   - Review `tests/e2e/websocket.test.ts`
   - Understand real-time requirements
   - Check existing WebSocket service

2. **Implement Real-time Features**
   - Connect WebSocket to race events
   - Broadcast race updates to participants
   - Handle client connection/disconnection

### Phase 4: AI-Powered Vehicle Intelligence (Priority 4)
1. **Setup AI Enhancement Infrastructure**
   - Create `vehicle_specs_cache` and `modification_suggestions` database tables
   - Implement AI service interface for vehicle data lookup
   - Add caching logic for AI-generated specifications
   - Create modification suggestion algorithm framework

2. **Vehicle Data Enhancement System**
   - Implement AI vehicle spec lookup (year/make/model → full specs)
   - Auto-populate horsepower, torque, 0-60 times, weight, etc.
   - Create learning database with intelligent caching
   - Progressive learning system that reduces AI API calls over time

3. **AI Modification Suggestions**
   - Develop AI-powered modification recommendation engine
   - Estimate horsepower gains for suggested modifications
   - Provide cost estimates and compatibility checking
   - Create modification database with performance impact data

### Phase 5: Google Maps Integration & Live Features (Priority 5)
1. **Dark Theme Google Maps Implementation**
   - Create custom Need for Speed/GTA-inspired map styling
   - Implement black background with red accent theme
   - Add gaming-style markers and UI elements
   - Optimize for night racing aesthetics

2. **Live Map Features & Navigation**
   - Display live races, events, and users on map
   - Implement filtering system (races, friends, events)
   - Add click-to-navigate functionality with directions
   - Real-time location updates and event visualization

### Phase 6: Custom Branding & Polish (Priority 6)
1. **App Icon Integration**
   - Implement custom logo throughout application
   - Add favicon, mobile icons, loading screens
   - Consistent branding across all touchpoints
   - Need for Speed/GTA visual design language

### Phase 7: Quality Improvements (Priority 7)
1. **Fix TypeScript Issues**
   - Run `npm run build` and fix errors systematically
   - Focus on type conflicts and import issues

2. **Optimize Database Schema**
   - Consider adding proper fields for vehicle names and license plates
   - Improve type safety and maintainability

## 🧪 TESTING STRATEGY

### Continuous Testing Approach
```bash
# Test specific modules during development
npx jest --config tests/jest.e2e.config.js tests/e2e/vehicles.test.ts
npx jest --config tests/jest.e2e.config.js tests/e2e/races.test.ts
npx jest --config tests/jest.e2e.config.js tests/e2e/websocket.test.ts

# Full suite testing
npx jest --config tests/jest.e2e.config.js --runInBand --verbose
```

### Progress Tracking
- Start with current 15/37 tests passing
- Target: +3 vehicle tests (remove license plates, fix performance) = 18/37 (Phase 1)
- Target: +12 race tests = 30/37 (Phase 2)  
- Target: +7 WebSocket tests = 37/37 (Phase 3) ✅
- Bonus: AI enhancement tests and Google Maps integration tests (Phases 4-5)

### Success Metrics
- **Phase 1 Success**: 18/37 tests passing (vehicle module 100% complete, license plates removed)
- **Phase 2 Success**: 30/37 tests passing (race management complete)
- **Phase 3 Success**: 37/37 tests passing (full E2E testing complete) 🎯
- **Phase 4 Success**: AI vehicle enhancement system operational
- **Phase 5 Success**: Google Maps integration with dark theme and live features
- **Phase 6 Success**: Custom branding and Need for Speed/GTA visual design complete

## 🔧 TECHNICAL REQUIREMENTS

### Code Quality Standards
- Use existing patterns from working modules (auth, vehicle CRUD)
- Maintain consistent error handling and response formats
- Follow TypeScript best practices (fix compilation errors)
- Use existing SupabaseService for all database operations

### Database Operations
- All operations must use `backend/src/services/database.ts` SupabaseService
- Maintain user authorization checks for all data access
- Use AI-enhanced field mapping (remove license plate confusion)
- Implement intelligent caching for AI-generated vehicle data
- Create new tables: `vehicle_specs_cache`, `modification_suggestions`

### API Response Format
```typescript
// Success Response
{
  success: true,
  data: { ... }
}

// Error Response  
{
  success: false,
  error: "Error message"
}
```

### Authentication Requirements
- All protected routes must use `authenticateUser` middleware
- Validate user ownership for user-specific data
- Use JWT token format consistently

## 🎯 FINAL SUCCESS CRITERIA

**Mission Complete When:**
- ✅ All 37 E2E tests pass consistently (Core Application)
- ✅ AI Vehicle Enhancement System operational with learning database
- ✅ Google Maps integration with custom dark theme and live features
- ✅ Custom app icon/logo integrated throughout application
- ✅ No TypeScript compilation errors
- ✅ All API endpoints properly documented and tested
- ✅ Real-time features fully operational
- ✅ Database operations optimized and secure

### Enhanced Success Metrics

**Core E2E Testing Progress:**
- **Current Progress: 15/37 tests passing (41%)**
- **Target: 37/37 tests passing (100%)**

**AI Enhancement Success Criteria:**
- ✅ Vehicle data automatically enriched on creation (year/make/model → full specs)
- ✅ Learning database reduces AI API calls by 80% after initial population
- ✅ AI modification suggestions provide realistic horsepower estimates
- ✅ Vehicle specs cache serves 90% of common vehicle lookups
- ✅ License plate tracking completely removed and field mapping optimized

**Google Maps Integration Success Criteria:**
- ✅ Custom dark theme with Need for Speed/GTA styling implemented
- ✅ Live races, events, and users displayed on map with real-time updates
- ✅ Filtering system allows granular control over map content
- ✅ Click-to-navigate provides accurate directions to events
- ✅ Map performance remains smooth with 100+ concurrent users
- ✅ Black background with red accents matches app theme perfectly

**Custom Branding Success Criteria:**
- ✅ App icon integrated in web favicon (16x16, 32x32, 64x64)
- ✅ Mobile app icons implemented for iOS and Android
- ✅ Loading screens and splash screens feature custom branding
- ✅ Navigation headers display logo consistently
- ✅ Need for Speed/GTA visual design language throughout app

**Technical Excellence Criteria:**
- ✅ Zero TypeScript compilation errors
- ✅ AI service response times under 2 seconds average
- ✅ Google Maps loads in under 1 second with custom theme
- ✅ Database queries optimized for AI caching system
- ✅ WebSocket connections handle 1000+ concurrent users
- ✅ Mobile responsiveness across all new features
- ✅ Security audit passed for AI data handling and map integration

**This is a critical milestone for the DASH RACING application. Focus on systematic implementation of both core E2E testing completion AND the enhanced AI/mapping features, maintaining code quality throughout the development process.**