# DASH RACING - Comprehensive Testing Suite

This directory contains the complete End-to-End testing suite for DASH RACING, implementing comprehensive test coverage that **requires passing before building** as specified.

## 📋 Test Architecture

### Test Types

1. **Unit Tests** (`/unit/`)
   - Individual component and service testing
   - Authentication logic validation
   - Vehicle management functions
   - Pure function testing with mocks

2. **Integration Tests** (`/integration/`)
   - API endpoint integration
   - Database service integration
   - Service interaction testing
   - End-to-end workflows

3. **E2E Tests** (`/e2e/`)
   - Complete user journey testing
   - Real-time WebSocket functionality
   - Authentication flows
   - Race management lifecycle
   - Vehicle CRUD operations

## 🚀 Quick Start

### Prerequisites
- Backend server running on `localhost:8000`
- Node.js environment configured
- All dependencies installed

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# Run with coverage
npm run test:ci
```

### Watch Mode (Development)
```bash
npm run test:watch
```

## 📊 Test Coverage

### Current Test Files

#### Unit Tests
- `auth.test.ts` - Authentication service validation
- `vehicle.test.ts` - Vehicle management logic

#### Integration Tests
- `api.test.ts` - Complete API endpoint testing
- `database.test.ts` - Database service integration

#### E2E Tests
- `auth.test.ts` - Complete authentication workflows
- `vehicles.test.ts` - Vehicle management E2E
- `races.test.ts` - Race lifecycle and management
- `websocket.test.ts` - Real-time features testing

### Coverage Requirements
- **Minimum 90% code coverage** for production build
- **All E2E scenarios must pass** before deployment
- **Zero test failures** allowed for build approval

## 🛠 Test Configuration

### Jest Configuration
- `jest.config.js` - Main Jest configuration
- `jest.unit.config.js` - Unit test specific config
- `jest.integration.config.js` - Integration test config
- `jest.e2e.config.js` - E2E test configuration

### Setup Files
- `setup/jest.setup.ts` - Global Jest setup
- `setup/global.setup.ts` - Test server initialization
- `setup/global.teardown.ts` - Cleanup after tests
- `setup/e2e.setup.ts` - E2E specific setup
- `setup/integration.setup.ts` - Integration setup

## 🔧 Test Utilities

### Helper Functions (`/utils/`)
- `test-helpers.ts` - Common test utilities and factories
- `api-client.ts` - HTTP client for API testing (no external deps)
- `websocket-client.ts` - WebSocket client for real-time testing

### Key Features
- **No External Dependencies**: Uses native fetch and WebSocket APIs
- **Mock Data Generation**: Consistent test data creation
- **Environment Isolation**: Each test runs in clean environment
- **Real-time Testing**: WebSocket connection and message testing
- **Error Scenario Coverage**: Comprehensive edge case testing

## 📈 Test Execution Flow

### Automated Test Pipeline
1. **Prerequisites Check** - Verify backend availability
2. **Unit Tests** - Fast isolated component testing
3. **Integration Tests** - Service integration validation
4. **E2E Tests** - Complete user workflow testing
5. **Coverage Report** - Generate comprehensive coverage data
6. **Build Approval** - All tests must pass for build eligibility

### CI/CD Integration
```bash
# Production build requirement
npm run test:ci
# Must exit with code 0 for build to proceed
```

## 🎯 Testing Best Practices

### Test Structure
- **Arrange**: Set up test data and environment
- **Act**: Execute the functionality being tested
- **Assert**: Verify expected outcomes

### Naming Conventions
- Descriptive test names explaining the scenario
- Consistent file naming: `*.test.ts`
- Clear describe blocks for test organization

### Data Management
- Use test factories for consistent data creation
- Clean up test data after each test
- Isolate tests to prevent interdependencies

## 🔍 Debugging Tests

### Debug Individual Tests
```bash
# Run specific test file
npx jest auth.test.ts --verbose

# Run specific test case
npx jest --testNamePattern="user registration"

# Debug mode
npx jest --detectOpenHandles --forceExit
```

### Common Issues
- **Port conflicts**: Ensure backend is running on correct port
- **Timing issues**: Use proper async/await patterns
- **Test isolation**: Clear state between tests
- **WebSocket connections**: Properly disconnect after tests

## 📊 Coverage Reports

Test coverage reports are generated in `/coverage/` directory:
- HTML report: `coverage/lcov-report/index.html`
- Terminal summary: Displayed after test completion
- CI-friendly format: LCOV and JSON reports

## 🚦 Build Gate Requirements

**CRITICAL**: All tests must pass before any build operation:

### Requirements for Production Build
1. ✅ All unit tests pass (100%)
2. ✅ All integration tests pass (100%)
3. ✅ All E2E tests pass (100%)
4. ✅ Minimum 90% code coverage achieved
5. ✅ No linting errors
6. ✅ No TypeScript compilation errors

### Failure Handling
- **Test failures** → Build blocked
- **Coverage below threshold** → Build blocked  
- **Timeout errors** → Build blocked
- **WebSocket connection issues** → Build blocked

## 💡 Adding New Tests

### When to Add Tests
- New features implemented
- Bug fixes completed
- Edge cases discovered
- Performance optimizations

### Test File Template
```typescript
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('New Feature Tests', () => {
  beforeEach(async () => {
    // Setup for each test
  });

  afterEach(async () => {
    // Cleanup after each test
  });

  test('should handle expected scenario', async () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## 🔗 Related Documentation

- Backend API Documentation: `../backend/README.md`
- Mobile App Documentation: `../mobile/README.md`
- Project Architecture: `../README.md`

---

**Remember**: This testing suite implements the user's requirement for "comprehensive testing suite that tests the app e2e all functions and requires passing before building". All tests must pass for production deployment eligibility.