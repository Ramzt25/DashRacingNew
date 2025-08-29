# Testability Assessment - DASH Racing

## Test Setup Status

### Mobile (React Native)
- **Framework:** Jest configured in package.json
- **Status:** ❌ No tests found - Jest exits with code 1
- **Config:** Basic Jest preset in mobile/package.json:25-32
- **Coverage:** 0% - No test files discovered
- **Test Patterns:** Standard Jest patterns configured but no matching files

### Backend (Fastify + TypeScript)
- **Framework:** Jest with ts-jest preset
- **Status:** ✅ Comprehensive test suite - 25/37 tests passing (67.6%)
- **Config:** Multiple Jest configs (unit, integration, e2e)
- **Coverage:** Good test organization with setup files
- **Test Types:** Unit, integration, and WebSocket tests

### Server (API Testing)
- **Framework:** Custom test utilities with API client
- **Status:** ✅ Well-structured test infrastructure
- **Config:** Proper test setup with utilities and helpers
- **Coverage:** API endpoints, authentication, real-time features

## Current Coverage Analysis

### Backend Test Results (25/37 passing - 67.6%)
- ✅ **Authentication:** All tests passing (JWT, bcrypt, user management)
- ✅ **Core API:** CRUD operations working
- ✅ **Vehicle Management:** All tests passing
- ✅ **Basic Race Operations:** All tests passing
- ❌ **WebSocket Features:** 8 failing tests (friend requests, race notifications, location tracking)
- ❌ **Registration Validation:** 2 failing tests
- ❌ **Race Completion:** 1 failing test
- ❌ **Token Handling:** Some endpoint token issues

### Mobile Test Status
- ❌ **Zero Coverage:** No test files found in mobile/
- ❌ **No Test Structure:** Missing __tests__ or *.test.js files
- ❌ **No Component Tests:** UI components untested
- ❌ **No Integration Tests:** Screen-level testing missing

## High-Value Test List

### Mobile - Critical Tests Needed (6 tests)
1. **Authentication Flow Test**
   - Test: Login → Token storage → Navigation to home
   - File: `mobile/src/__tests__/auth-flow.test.js`
   - Tools: Jest + @testing-library/react-native

2. **Navigation Integration Test**
   - Test: Tab navigation between all 7 screens
   - File: `mobile/src/__tests__/navigation.test.js`
   - Tools: Jest + React Navigation testing utils

3. **Vehicle CRUD Test**
   - Test: Add vehicle → Save to storage → Display in garage
   - File: `mobile/src/__tests__/vehicle-crud.test.js`
   - Tools: Jest + AsyncStorage mock

4. **Context State Management Test**
   - Test: AppContext state updates and persistence
   - File: `mobile/src/__tests__/app-context.test.js`
   - Tools: Jest + React Testing Library

5. **Real-time Race Features Test**
   - Test: WebSocket connection → Race notifications → UI updates
   - File: `mobile/src/__tests__/websocket-integration.test.js`
   - Tools: Jest + WebSocket mock

6. **Component Rendering Test**
   - Test: Critical UI components render without crashing
   - File: `mobile/src/__tests__/component-rendering.test.js`
   - Tools: Jest + React Test Renderer

### Backend - Fix Existing Failing Tests (4 tests)
1. **WebSocket Notification Delivery Test**
   - Fix: Friend request notifications timing out
   - File: `tests/integration/websocket.test.ts`
   - Issue: User lookup in friend endpoints may be failing

2. **Race Completion API Test**
   - Fix: API returning success: false
   - File: `tests/integration/races.test.ts`
   - Issue: Race completion validation logic

3. **Registration Validation Test**
   - Fix: Input validation errors
   - File: `tests/integration/auth.test.ts`
   - Issue: Validation middleware configuration

4. **Token Handling Test**
   - Fix: Inconsistent token validation
   - File: `tests/integration/api.test.ts`
   - Issue: JWT middleware setup

### E2E Tests - Integration Validation (2 tests)
1. **Mobile-Backend Integration Smoke Test**
   - Test: Mobile app → API call → Database → Response → UI update
   - File: `tests/e2e/mobile-backend.test.ts`
   - Tools: Detox + API client

2. **Real-time Race Flow E2E Test**
   - Test: Two users → Create race → Join → Start → WebSocket updates
   - File: `tests/e2e/race-flow.test.ts`
   - Tools: Multiple WebSocket clients + API coordination

## Mocking Strategy

### React Native Native Modules
```javascript
// mobile/src/__tests__/setup.js
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { 
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    })),
  })),
}));

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
```

### Backend API Mocking (for mobile tests)
```javascript
// MSW for API mocking in mobile tests
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const apiHandlers = [
  rest.post('/auth/login', (req, res, ctx) => {
    return res(ctx.json({ 
      token: 'mock-jwt-token',
      user: { id: '1', email: 'test@example.com' }
    }));
  }),
  rest.get('/vehicles', (req, res, ctx) => {
    return res(ctx.json([
      { id: '1', make: 'Toyota', model: 'Supra', year: 2023 }
    ]));
  }),
];

export const mockServer = setupServer(...apiHandlers);
```

### WebSocket Mocking
```javascript
// For testing real-time features
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen?.();
    }, 100);
  }
  
  send(data) {
    // Mock message sending
    setTimeout(() => {
      this.onmessage?.({ data: JSON.stringify({
        type: 'race_notification',
        payload: { message: 'Race started!' }
      })});
    }, 50);
  }
}

global.WebSocket = MockWebSocket;
```

## Test Infrastructure Requirements

### Mobile Test Setup
1. **Install Testing Dependencies**
   ```bash
   cd mobile
   npm install --save-dev @testing-library/react-native @testing-library/jest-native
   npm install --save-dev react-test-renderer detox
   ```

2. **Add Jest Configuration**
   ```json
   // mobile/jest.config.js
   {
     "preset": "react-native",
     "setupFilesAfterEnv": ["<rootDir>/src/__tests__/setup.js"],
     "transformIgnorePatterns": [
       "node_modules/(?!(react-native|@react-navigation|@react-native|react-native-vector-icons)/)"
     ]
   }
   ```

3. **Add Test Scripts**
   ```json
   // mobile/package.json
   {
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch",
       "test:coverage": "jest --coverage"
     }
   }
   ```

### E2E Test Setup (Detox)
1. **Detox Configuration**
   ```json
   // .detoxrc.json
   {
     "testRunner": "jest",
     "runnerConfig": "e2e/jest.config.js",
     "configurations": {
       "android.emu.debug": {
         "device": "android.emulator",
         "app": "android.debug"
       }
     }
   }
   ```

## Recommended Testing Approach

### Phase 1: Mobile Foundation (1-2 hours)
1. Set up Jest configuration and testing dependencies
2. Create basic component rendering tests
3. Add authentication flow test
4. Implement navigation integration test

### Phase 2: Critical Path Testing (2-3 hours)
1. Add vehicle CRUD test suite
2. Implement WebSocket integration tests
3. Create context state management tests
4. Add error boundary tests

### Phase 3: E2E Validation (2-4 hours)
1. Set up Detox for mobile E2E testing
2. Create mobile-backend integration smoke test
3. Implement real-time race flow E2E test
4. Add performance and reliability tests

### Phase 4: Backend Test Fixes (1-2 hours)
1. Fix WebSocket notification delivery issues
2. Resolve race completion API problems
3. Fix registration validation tests
4. Ensure consistent token handling