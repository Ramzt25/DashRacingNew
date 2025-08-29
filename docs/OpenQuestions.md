# Open Questions - DASH Racing

This document tracks unresolved questions that impact development decisions, along with investigation approaches and decision deadlines.

## Critical Questions (Immediate Impact)

### Q1: iOS Platform Priority and Timeline
- **Question:** Should iOS development be included in the immediate development plan?
- **Current State:** Android builds working (170MB APK), iOS folder completely missing
- **Impact:** Affects resource allocation, testing strategy, and feature development approach
- **Decision Needed By:** Before starting Track D (iOS Platform Implementation)
- **Investigation Required:**
  - [ ] Determine target user base platform preferences
  - [ ] Assess iOS development resource availability
  - [ ] Evaluate React Native iOS specific features needed
  - [ ] Cost-benefit analysis of dual platform vs Android-first approach
- **Decision Criteria:** User base analysis, development resource capacity, time-to-market requirements
- **Stakeholders:** Product team, development team, target users

### Q2: Database Performance and Scaling
- **Question:** Will PostgreSQL with RLS policies handle expected racing app load?
- **Current State:** Comprehensive schema but no performance testing or optimization
- **Impact:** User experience, system reliability, infrastructure costs
- **Decision Needed By:** Before implementing real-time racing features (Track C)
- **Investigation Required:**
  - [ ] Define expected concurrent user load
  - [ ] Implement database performance benchmarks
  - [ ] Test RLS policy performance impact
  - [ ] Evaluate caching strategy requirements
  - [ ] Research horizontal scaling options
- **Decision Criteria:** Response time requirements, concurrent user targets, cost constraints
- **Stakeholders:** Backend team, DevOps, product team

### Q3: Real-time Feature Architecture
- **Question:** Is WebSocket approach optimal for racing app real-time requirements?
- **Current State:** WebSocket service implemented but no performance validation
- **Impact:** Core app functionality, user experience, server resource usage
- **Decision Needed By:** Before Track C implementation begins
- **Investigation Required:**
  - [ ] Define real-time latency requirements for racing features
  - [ ] Compare WebSocket vs alternatives (SSE, polling, push notifications)
  - [ ] Test WebSocket performance under load
  - [ ] Evaluate connection reliability and reconnection strategy
  - [ ] Research mobile battery impact of persistent connections
- **Decision Criteria:** Latency requirements, reliability needs, resource efficiency
- **Stakeholders:** Mobile team, backend team, UX team

## Security and Compliance Questions

### Q4: Environment Variable and Secrets Management
- **Question:** What is the preferred secrets management approach for production?
- **Current State:** No .env files found, hardcoded values identified
- **Impact:** Security posture, compliance requirements, operational security
- **Decision Needed By:** Before Track A (Foundation Stability) completion
- **Investigation Required:**
  - [ ] Evaluate cloud-native secrets management options
  - [ ] Define security compliance requirements
  - [ ] Research integration with deployment platform
  - [ ] Assess key rotation requirements
  - [ ] Compare .env vs external secret stores
- **Decision Criteria:** Security requirements, compliance needs, operational complexity
- **Stakeholders:** Security team, DevOps, development team

### Q5: Mobile Token Storage Security
- **Question:** Is react-native-keychain the optimal secure storage solution?
- **Current State:** Currently using AsyncStorage (insecure)
- **Impact:** User authentication security, data protection compliance
- **Decision Needed By:** Before mobile authentication implementation
- **Investigation Required:**
  - [ ] Compare react-native-keychain vs alternatives (secure-storage, MMKV)
  - [ ] Test biometric authentication integration requirements
  - [ ] Evaluate offline authentication scenarios
  - [ ] Research platform-specific security features
  - [ ] Assess compliance with data protection regulations
- **Decision Criteria:** Security level, user experience, compliance requirements
- **Stakeholders:** Mobile team, security team, UX team

### Q6: API Authentication and Authorization Strategy
- **Question:** Should JWT + Supabase Auth be the long-term authentication strategy?
- **Current State:** JWT middleware implemented, Supabase client configured
- **Impact:** Security architecture, user management, integration complexity
- **Decision Needed By:** Before production deployment
- **Investigation Required:**
  - [ ] Evaluate OAuth provider requirements
  - [ ] Assess multi-factor authentication needs
  - [ ] Research session management best practices
  - [ ] Compare self-managed vs managed auth services
  - [ ] Evaluate user onboarding and recovery flows
- **Decision Criteria:** Security requirements, user experience, integration effort
- **Stakeholders:** Security team, backend team, product team

## Technical Architecture Questions

### Q7: Testing Strategy and Coverage Targets
- **Question:** What are appropriate test coverage targets and testing strategy?
- **Current State:** Backend 67.6% coverage, mobile 0% coverage
- **Impact:** Code quality, release confidence, maintenance burden
- **Decision Needed By:** Before Track B (Testing Foundation) implementation
- **Investigation Required:**
  - [ ] Define test coverage targets by component type
  - [ ] Evaluate E2E testing scope and tools
  - [ ] Research mobile testing best practices for React Native
  - [ ] Assess testing automation requirements
  - [ ] Compare testing framework alternatives
- **Decision Criteria:** Quality goals, development velocity, maintenance effort
- **Stakeholders:** Development team, QA team, DevOps

### Q8: Build and Deployment Pipeline
- **Question:** What is the target deployment platform and CI/CD approach?
- **Current State:** Local build automation working, no CI/CD configuration
- **Impact:** Development velocity, release reliability, operational overhead
- **Decision Needed By:** Before production deployment preparation
- **Investigation Required:**
  - [ ] Evaluate cloud platform options (AWS, Azure, GCP)
  - [ ] Research React Native app distribution methods
  - [ ] Assess automated testing integration requirements
  - [ ] Compare CI/CD platform options
  - [ ] Define deployment environment strategy
- **Decision Criteria:** Platform capabilities, cost, team expertise
- **Stakeholders:** DevOps, development team, operations team

### Q9: Mobile App Distribution and Updates
- **Question:** What is the app distribution and update strategy?
- **Current State:** APK builds working, no store configuration or OTA updates
- **Impact:** User acquisition, update distribution, maintenance overhead
- **Decision Needed By:** Before user testing phase
- **Investigation Required:**
  - [ ] Research app store submission requirements
  - [ ] Evaluate over-the-air update solutions (CodePush, alternatives)
  - [ ] Assess app signing and certificate management
  - [ ] Compare distribution platform options
  - [ ] Define update rollback strategy
- **Decision Criteria:** User reach, update flexibility, management complexity
- **Stakeholders:** Mobile team, DevOps, product team

## Performance and Scalability Questions

### Q10: Concurrent User Load and Infrastructure Requirements
- **Question:** What are the expected concurrent user loads and infrastructure needs?
- **Current State:** No load testing or performance benchmarks
- **Impact:** Infrastructure costs, user experience, system reliability
- **Decision Needed By:** Before production deployment
- **Investigation Required:**
  - [ ] Define expected user growth and usage patterns
  - [ ] Implement load testing for API endpoints
  - [ ] Evaluate database scaling requirements
  - [ ] Research CDN and caching requirements
  - [ ] Assess monitoring and alerting needs
- **Decision Criteria:** Performance requirements, cost constraints, growth projections
- **Stakeholders:** Product team, DevOps, backend team

### Q11: Mobile App Performance Optimization
- **Question:** Are there React Native performance optimizations needed for racing features?
- **Current State:** Hermes enabled, no performance profiling or optimization
- **Impact:** User experience, real-time feature responsiveness
- **Decision Needed By:** Before Track C (Mobile-Backend Integration) completion
- **Investigation Required:**
  - [ ] Profile app performance on target devices
  - [ ] Evaluate animation and real-time update performance
  - [ ] Research React Native performance optimization techniques
  - [ ] Assess memory usage and battery impact
  - [ ] Compare performance on different device tiers
- **Decision Criteria:** Performance requirements, target device support
- **Stakeholders:** Mobile team, UX team, product team

## Feature and Product Questions

### Q12: Real-time Racing Feature Requirements
- **Question:** What are the specific real-time racing features and their latency requirements?
- **Current State:** WebSocket infrastructure exists but specific racing features undefined
- **Impact:** Technical implementation approach, user experience design
- **Decision Needed By:** Before Track C detailed planning
- **Investigation Required:**
  - [ ] Define specific racing features (live timing, position updates, etc.)
  - [ ] Establish latency requirements for each feature
  - [ ] Research competitive landscape and user expectations
  - [ ] Evaluate offline and poor connectivity scenarios
  - [ ] Assess data synchronization requirements
- **Decision Criteria:** User experience goals, technical feasibility, competitive requirements
- **Stakeholders:** Product team, UX team, development team

### Q13: User Onboarding and Authentication Flow
- **Question:** What is the optimal user onboarding and authentication experience?
- **Current State:** Authentication infrastructure exists but no defined user flow
- **Impact:** User acquisition, conversion rates, user experience
- **Decision Needed By:** Before mobile UI implementation
- **Investigation Required:**
  - [ ] Define user registration and onboarding flow
  - [ ] Evaluate social login provider requirements
  - [ ] Research guest user and trial access options
  - [ ] Assess password recovery and account management needs
  - [ ] Evaluate accessibility requirements
- **Decision Criteria:** User experience goals, conversion optimization, accessibility standards
- **Stakeholders:** UX team, product team, development team

## Decision Tracking Process

### Investigation Assignment
1. **Primary Owner:** Assign investigation owner for each question
2. **Timeline:** Set investigation deadline and decision deadline
3. **Resources:** Identify required resources and expertise
4. **Dependencies:** Map question interdependencies

### Decision Documentation
1. **Investigation Results:** Document findings and analysis
2. **Options Evaluation:** Compare alternatives with criteria
3. **Decision Rationale:** Record decision reasoning and trade-offs
4. **Implementation Impact:** Update planning and documentation

### Regular Review
1. **Weekly Review:** Check investigation progress and blocking issues
2. **Priority Updates:** Adjust question priority based on development needs
3. **New Questions:** Add new questions as they arise
4. **Resolved Questions:** Archive resolved questions with decisions

## Next Steps

### Immediate Actions (Next 1-2 weeks)
1. **Assign question owners** for critical questions Q1-Q6
2. **Schedule investigation sessions** for high-priority questions
3. **Define decision deadlines** aligned with development tracks
4. **Set up regular review process** for question tracking

### Investigation Resources
1. **Performance Testing Environment:** Set up for Q2, Q10, Q11
2. **User Research:** Plan for Q1, Q12, Q13
3. **Security Review:** Schedule for Q4, Q5, Q6
4. **Technical Spike Planning:** Allocate time for Q3, Q7, Q8

### Decision Dependencies
1. **Q1 (iOS Priority)** affects all other track planning
2. **Q4 (Secrets Management)** blocks production deployment preparation
3. **Q3 (Real-time Architecture)** affects Q2 (Database Performance)
4. **Q12 (Racing Features)** affects Q3 (Real-time Architecture) and Q11 (Mobile Performance)