# Project Assumptions - DASH Racing

This document records all assumptions made during the repository analysis and provides guidance on where to override these decisions.

## Architecture Assumptions

### Platform Strategy
- **Assumption:** Android-first development approach
- **Evidence:** iOS folder missing, Android APK builds working (170MB successful builds)
- **Override Location:** Adjust Track D priority in `/docs/Plan.md` if iOS is immediately needed
- **Impact:** Testing and deployment focus on Android platform initially

### Technology Stack Choices
- **Assumption:** React Native 0.74.7 with Hermes is the target platform
- **Evidence:** Package.json shows RN 0.74.7, Hermes enabled in Android build.gradle
- **Override Location:** Change React Native version in `mobile/package.json` and rebuild validation
- **Impact:** All build tooling and dependencies aligned to this version

- **Assumption:** Fastify + TypeScript for backend API server
- **Evidence:** Comprehensive Fastify implementation in `backend/src/server.ts`
- **Override Location:** Backend framework change would require full `backend/` rewrite
- **Impact:** API patterns, middleware, and testing assume Fastify conventions

- **Assumption:** Supabase PostgreSQL for database and authentication
- **Evidence:** Database schema in `database/complete-schema.sql`, Supabase client usage
- **Override Location:** Database provider change requires updates to auth and data services
- **Impact:** RLS policies, auth integration, and real-time features depend on Supabase

## Development Environment Assumptions

### Build System
- **Assumption:** Gradle 8.13 + Android Gradle Plugin 8.7.3 is stable
- **Evidence:** Successful APK builds, build validation framework confirms compatibility
- **Override Location:** Adjust versions in `mobile/android/build.gradle`
- **Impact:** Build automation pipeline depends on these specific versions

### Java/Node Versions
- **Assumption:** Java 17 and Node.js 20.19.1 for development environment
- **Evidence:** Android build.gradle specifies Java 17, Node version in validation output
- **Override Location:** Update `mobile/android/app/build.gradle` for Java, use nvm for Node
- **Impact:** All build scripts and automation assume these versions

### Package Manager
- **Assumption:** npm as primary package manager (not yarn or pnpm)
- **Evidence:** package-lock.json files, npm scripts in package.json files
- **Override Location:** Switch to yarn/pnpm requires updating all lockfiles and scripts
- **Impact:** Build automation scripts use npm commands throughout

## Security & Configuration Assumptions

### Environment Management
- **Assumption:** Environment variables will be managed via .env files
- **Evidence:** Backend uses dotenv.config(), no current .env files found
- **Override Location:** Implement alternative config management in `backend/src/server.ts`
- **Impact:** Security hardening plan assumes .env file approach

### Authentication Strategy
- **Assumption:** JWT-based authentication with Supabase Auth integration
- **Evidence:** JWT middleware in backend, Supabase client configuration
- **Override Location:** Change auth strategy requires updates to middleware and mobile auth service
- **Impact:** Token storage, API security, and user session management

### Mobile Security
- **Assumption:** react-native-keychain for secure token storage
- **Evidence:** Current AsyncStorage usage identified as security risk
- **Override Location:** Alternative secure storage in mobile auth service
- **Impact:** Security recommendations assume Keychain API availability

## Testing Strategy Assumptions

### Testing Frameworks
- **Assumption:** Jest for all testing (unit, integration, E2E)
- **Evidence:** Jest configurations in backend and mobile, comprehensive backend test suite
- **Override Location:** Alternative test frameworks require config changes in multiple jest.config.js files
- **Impact:** Testing infrastructure and mock strategies assume Jest conventions

### Mobile Testing Approach
- **Assumption:** React Testing Library + Detox for mobile testing
- **Evidence:** Standard React Native testing pattern, no current mobile tests
- **Override Location:** Alternative mobile testing in `mobile/jest.config.js` and test setup
- **Impact:** Testing recommendations assume React Testing Library patterns

### API Testing Strategy
- **Assumption:** Integration tests with real API endpoints
- **Evidence:** Comprehensive backend test suite with API client utilities
- **Override Location:** Mock-based testing would require changes to test utilities
- **Impact:** Test reliability assumes stable backend API availability

## Feature Scope Assumptions

### Real-time Features Priority
- **Assumption:** WebSocket real-time features are core to the racing app value proposition
- **Evidence:** Comprehensive WebSocket service, race notification system
- **Override Location:** Deprioritize real-time features by focusing on CRUD operations first
- **Impact:** Development effort allocation and testing focus

### Mobile-First Development
- **Assumption:** Mobile app is the primary user interface
- **Evidence:** No web frontend found, comprehensive mobile navigation structure
- **Override Location:** Add web frontend development to Track priorities
- **Impact:** API design and feature development prioritize mobile use cases

### Monorepo Structure
- **Assumption:** Single repository with mobile, backend, and shared code
- **Evidence:** Workspace configuration in root package.json, shared types directory
- **Override Location:** Split into separate repositories requires new CI/CD approach
- **Impact:** Build automation and dependency management assume monorepo structure

## Deployment Assumptions

### Development Workflow
- **Assumption:** Local development with hot reload and APK builds
- **Evidence:** Comprehensive rebuild-deploy.ps1 automation script
- **Override Location:** Alternative development workflow in build scripts
- **Impact:** Developer experience and build automation design

### Production Deployment
- **Assumption:** Backend deployment to cloud platform (not specified)
- **Evidence:** Environment-ready configuration, no deployment scripts found
- **Override Location:** Add specific deployment platform requirements to planning
- **Impact:** Environment variable management and scaling considerations

### Mobile Distribution
- **Assumption:** APK distribution initially, store deployment later
- **Evidence:** APK build automation working, no store configuration found
- **Override Location:** Immediate store deployment requires certificate management
- **Impact:** Signing, versioning, and release management approach

## Performance Assumptions

### Database Performance
- **Assumption:** PostgreSQL with RLS policies performs adequately for expected load
- **Evidence:** Comprehensive RLS implementation, no performance testing found
- **Override Location:** Add database performance optimization if needed
- **Impact:** Query optimization and caching strategy

### Mobile Performance
- **Assumption:** React Native performance is adequate for racing app real-time requirements
- **Evidence:** Hermes enabled, no performance profiling found
- **Override Location:** Native module optimization if performance issues arise
- **Impact:** Real-time feature responsiveness and user experience

### API Performance
- **Assumption:** Fastify performance meets racing app latency requirements
- **Evidence:** No performance testing or optimization found
- **Override Location:** Add performance monitoring and optimization
- **Impact:** Real-time feature reliability and user experience

## Override Instructions

### Immediate Changes
1. **Technology Stack Changes:** Update dependency versions in respective package.json files
2. **Security Approach:** Modify security recommendations in `/docs/SecurityAndPrivacy.md`
3. **Testing Strategy:** Adjust testing approach in `/docs/Testability.md`
4. **Development Priorities:** Reorder work tracks in `/docs/Plan.md`

### Configuration Updates
1. **Build System:** Update Gradle and Android configurations in `mobile/android/`
2. **Environment:** Modify environment variable approach in backend configuration
3. **Authentication:** Change auth strategy in backend middleware and mobile services

### Documentation Updates
1. **Assumptions Changes:** Update this file with new assumptions
2. **Plan Adjustments:** Modify work track priorities and effort estimates
3. **Risk Assessment:** Update risk ratings in planning documentation

## Decision Authority

### Technical Decisions
- **Frontend Technology:** Requires update to mobile package.json and build system
- **Backend Framework:** Requires architectural review and migration planning
- **Database Platform:** Requires data migration and auth system changes

### Business Decisions
- **Feature Priorities:** Adjust work track ordering in development plan
- **Platform Support:** Determine iOS priority and resource allocation
- **Security Requirements:** Influence environment management and compliance approach

### Process Decisions
- **Testing Strategy:** Affects quality assurance approach and CI/CD pipeline
- **Deployment Method:** Influences infrastructure and release management
- **Development Workflow:** Impacts team productivity and build automation