# Development Plan - DASH Racing

## Assumptions Made

### Project Configuration
- **React Native Version:** Staying with 0.74.7 (confirmed as working with current build system)
- **Backend Framework:** Fastify + TypeScript (established pattern, well-implemented)
- **Database:** Supabase PostgreSQL (comprehensive schema already implemented)
- **State Management:** React Context (current pattern, lightweight for app scope)
- **Navigation:** React Navigation v7 (already configured, 7-screen tab structure)
- **Build System:** Gradle 8.13 + AGP 8.7.3 (successfully building 170MB APKs)

### Missing iOS Platform
- **Assumption:** iOS development will be added later (Android-first approach)
- **Impact:** Mobile testing and E2E tests will focus on Android initially
- **Decision Point:** Prioritize iOS setup vs. other improvements

### Security Model
- **Assumption:** Production deployment will require proper certificate management
- **Current State:** Using debug signing certificates (development only)
- **Environment:** Production environment variables will be externally managed

### API Integration
- **Assumption:** Mobile app will replace mock data with real API calls
- **Current State:** Backend API functional (67.6% tests passing), mobile uses static data
- **Integration:** WebSocket real-time features need mobile client implementation

## Work Tracks

### Track A: Foundation Stability (Conservative)
**Objective:** Fix critical configuration gaps and establish reliable development environment

#### A1: TypeScript & Tooling Alignment
- **Rationale:** Mobile app lacks TypeScript, affecting maintainability and type safety
- **Risk:** Low - Incremental migration, can start with new files
- **Rollback:** Keep existing JS files, add TS gradually
- **Files:** `mobile/tsconfig.json`, `mobile/babel.config.js`, rename key files .js → .ts
- **Acceptance:** TypeScript compilation works, existing functionality preserved
- **Effort:** M (2-3 hours)

#### A2: ESLint & Prettier Configuration
- **Rationale:** Code quality consistency across mobile and backend
- **Risk:** Low - Configuration only, doesn't change code
- **Rollback:** Remove config files, keep existing code
- **Files:** `mobile/.eslintrc.js`, `mobile/.prettierrc`, `backend/.eslintrc.js`
- **Acceptance:** Linting runs without errors, consistent formatting
- **Effort:** S (1 hour)

#### A3: Environment Variable Security
- **Rationale:** Critical security gap, no secure configuration management
- **Risk:** Low - Infrastructure change, doesn't affect app logic
- **Rollback:** Remove .env files, revert to hardcoded values temporarily
- **Files:** `.env.example`, `.env.development`, `.gitignore`, backend config updates
- **Acceptance:** API keys secure, environment-specific configs work
- **Effort:** M (2 hours)

### Track B: Testing Foundation (Moderate)
**Objective:** Establish comprehensive testing to enable confident changes

#### B1: Mobile Test Infrastructure
- **Rationale:** Zero mobile test coverage creates regression risk
- **Risk:** Medium - New testing infrastructure, learning curve
- **Rollback:** Remove test dependencies, keep existing code
- **Files:** `mobile/jest.config.js`, `mobile/src/__tests__/setup.js`, test utilities
- **Acceptance:** Jest runs successfully, basic component tests pass
- **Effort:** M (2-3 hours)

#### B2: Critical Mobile Tests
- **Rationale:** High-value test coverage for core user flows
- **Risk:** Medium - Requires mocking strategy, test environment setup
- **Rollback:** Keep infrastructure, remove specific tests
- **Files:** Authentication, navigation, vehicle CRUD, context tests
- **Acceptance:** 4-6 key user flows covered with passing tests
- **Effort:** L (4-5 hours)

#### B3: Backend Test Fixes
- **Rationale:** Fix existing failing tests to reach 100% backend coverage
- **Risk:** Medium - May require API logic changes
- **Rollback:** Revert API changes, mark tests as skipped
- **Files:** WebSocket service, race completion API, auth validation
- **Acceptance:** All 37 backend tests pass (up from 25)
- **Effort:** M (3-4 hours)

### Track C: Mobile-Backend Integration (Aggressive)
**Objective:** Connect mobile app to real backend APIs and implement real-time features

#### C1: API Client Implementation
- **Rationale:** Mobile app currently uses mock data, needs real API integration
- **Risk:** High - Major functionality changes, authentication flow changes
- **Rollback:** Revert to mock data, disable API calls
- **Files:** `mobile/src/services/apiClient.js`, authentication service, context updates
- **Acceptance:** Mobile app successfully calls backend APIs, data persists
- **Effort:** L (4-6 hours)

#### C2: Secure Token Storage
- **Rationale:** Critical security requirement for production readiness
- **Risk:** Medium - Native module integration, platform-specific code
- **Rollback:** Revert to AsyncStorage, maintain functionality
- **Files:** Authentication service, token management utilities
- **Acceptance:** JWT tokens stored securely using Keychain/EncryptedSharedPreferences
- **Effort:** M (2-3 hours)

#### C3: WebSocket Real-time Features
- **Rationale:** Core racing app feature, differentiating functionality
- **Risk:** High - Complex real-time coordination, connection management
- **Rollback:** Disable real-time features, use polling fallback
- **Files:** WebSocket client, race notifications, friend requests, location updates
- **Acceptance:** Real-time race notifications and location tracking work in mobile app
- **Effort:** L (5-7 hours)

### Track D: iOS Platform Support (Aggressive)
**Objective:** Add iOS platform support for cross-platform development

#### D1: iOS Project Setup
- **Rationale:** iOS platform missing, limits testing and deployment options
- **Risk:** High - New platform, Xcode configuration, potential dependency conflicts
- **Rollback:** Delete iOS folder, continue Android-only development
- **Files:** `mobile/ios/` directory, Podfile, Info.plist, Xcode project
- **Acceptance:** iOS app builds and runs on simulator
- **Effort:** L (4-6 hours)

#### D2: iOS-specific Configuration
- **Rationale:** iOS requires platform-specific permissions, signing, and features
- **Risk:** High - Platform-specific knowledge required, certificate management
- **Rollback:** Disable iOS-specific features, use basic iOS setup
- **Files:** iOS permissions, signing configuration, platform-specific native modules
- **Acceptance:** iOS app feature parity with Android
- **Effort:** L (6-8 hours)

## Suggested Sequence for Today

Based on risk tolerance and immediate value, here are the recommended sequences:

### Conservative Approach (2-3 hours)
**Priority:** Stability and developer experience improvements
1. **A2: ESLint & Prettier Configuration** (1 hour)
   - Immediate code quality benefits
   - Low risk, high developer experience value
2. **A3: Environment Variable Security** (2 hours)
   - Critical security gap resolution
   - Foundation for production deployment
3. **A1: TypeScript & Tooling Alignment** (2-3 hours)
   - Incremental type safety improvements
   - Enables better development workflow

### Moderate Approach (3-4 hours)
**Priority:** Testing foundation and critical fixes
1. **A3: Environment Variable Security** (2 hours)
2. **B1: Mobile Test Infrastructure** (2-3 hours)
   - Enables confident future changes
   - Addresses major quality gap
3. **B3: Backend Test Fixes** (3-4 hours)
   - Achieve 100% backend test coverage
   - Fix real-time feature issues

### Aggressive Approach (4-6 hours)
**Priority:** Feature completion and integration
1. **A3: Environment Variable Security** (2 hours)
2. **C1: API Client Implementation** (4-6 hours)
   - Major functionality advancement
   - Real mobile-backend integration
3. **C2: Secure Token Storage** (2-3 hours)
   - Security hardening for API integration

## Decision Points Requiring Input

### Technical Decisions
1. **TypeScript Migration Strategy:**
   - Option A: Gradual migration (.js → .ts over time)
   - Option B: Full migration (convert all files now)
   - **Recommendation:** Option A (gradual)

2. **Testing Priority:**
   - Option A: Mobile tests first (user-facing priority)
   - Option B: Backend test fixes first (stability priority)
   - **Recommendation:** Option B (fix existing before adding new)

3. **iOS Platform Timing:**
   - Option A: Add iOS now (cross-platform development)
   - Option B: Complete Android features first (focused approach)
   - **Recommendation:** Option B (Android-first completion)

### Security Decisions
1. **Environment Variable Management:**
   - Option A: Local .env files only
   - Option B: External secret management (AWS Secrets Manager, etc.)
   - **Recommendation:** Option A for development, Option B for production

2. **API Security Level:**
   - Option A: Basic JWT with current implementation
   - Option B: Enhanced security (rate limiting, IP filtering, etc.)
   - **Recommendation:** Option A initially, Option B for production

### Feature Scope Decisions
1. **Real-time Features Priority:**
   - Option A: Focus on core CRUD operations first
   - Option B: Prioritize real-time racing features
   - **Recommendation:** Option A (stable foundation first)

2. **Mobile UI Polish vs. Backend Integration:**
   - Option A: Polish existing mobile UI
   - Option B: Connect mobile to real backend APIs
   - **Recommendation:** Option B (functionality over polish)

## Risk Mitigation Strategies

### Version Control
- **Branch Strategy:** `feature/<track-id>-<description>` for each work track
- **Commit Strategy:** Conventional commits with clear scope
- **PR Strategy:** Small, focused PRs with comprehensive testing

### Testing Strategy
- **Unit Tests:** Maintain existing backend coverage
- **Integration Tests:** Add mobile-backend integration validation
- **E2E Tests:** Smoke tests for critical user flows
- **Manual Testing:** Device testing for each mobile change

### Deployment Strategy
- **Development:** Local development with hot reload
- **Staging:** Backend deployment with mobile dev builds
- **Production:** Graduated rollout with monitoring

### Rollback Procedures
- **Code Rollback:** Git revert with dependency management
- **Database Rollback:** Migration rollback scripts
- **Mobile Rollback:** Previous APK version available
- **Backend Rollback:** Docker container previous version