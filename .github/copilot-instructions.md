# DASH Racing - Copilot Instructions

## 🏁 Project Overview

DASH Racing is a **React Native mobile racing application** with a **Node.js backend** built for Android deployment **without Expo**. This is a production-ready racing app with real-time multiplayer features, comprehensive testing, and a complete build system.

**⚠️ CRITICAL: This is a pure React Native CLI project - DO NOT use Expo or Expo-related tools.**

### Key Technologies
- **Mobile**: React Native CLI (Android), TypeScript, WebSocket
- **Backend**: Node.js, Fastify, Supabase, WebSocket
- **Database**: PostgreSQL (Supabase)
- **Testing**: Jest, Supertest, E2E validation
- **Build System**: Gradle, Android SDK, automated APK generation

## 📱 Mobile App Architecture (React Native CLI)

### Project Structure
```
mobile/
├── android/               # Native Android configuration
│   ├── app/
│   │   ├── build.gradle  # Android build configuration
│   │   └── src/          # Android native code
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/          # Main app screens
│   ├── services/         # API, WebSocket, Storage services
│   │   ├── api.ts       # Backend API communication
│   │   ├── websocket.ts # Real-time WebSocket client
│   │   └── supabase.ts  # Database integration
│   ├── utils/
│   │   └── network.ts   # Network detection & management
│   └── context/         # React Context providers
├── package.json         # React Native dependencies
├── metro.config.js      # Metro bundler configuration
├── react-native.config.js # React Native CLI configuration
└── babel.config.js      # Babel configuration
```

### Network Functionality
The mobile app includes **comprehensive network management** for WiFi communication:

- **Network Service** (`src/utils/network.ts`): Auto-detects network configuration, handles IP changes
- **API Service** (`src/services/api.ts`): Robust HTTP client with timeout management
- **WebSocket Service** (`src/services/websocket.ts`): Real-time communication with auto-reconnection
- **Environment Configuration**: Dynamic IP detection for development/production

### Android Configuration
- **Package Name**: `com.dashracing`
- **Target SDK**: 35, Min SDK: 23
- **Build Type**: Release APK with debug signing for development
- **Permissions**: Network, Location, Storage as needed

## 🚀 Build & Deployment System

### APK Build Process
The project has a **comprehensive automated build system**:

```bash
# Complete build with validation (RECOMMENDED)
npm run build:apk

# Alternative build methods (Windows-based)
.\build-apk.ps1           # PowerShell script
.\build-apk.bat           # Batch script fallback
```

### Build Validation Requirements
**All builds must pass these validations:**
1. ✅ Environment check (Node.js, Java, Android SDK)
2. ✅ Backend server health check
3. ✅ 12/12 integration tests pass
4. ✅ API connectivity validation
5. ✅ Authentication flow testing
6. ✅ APK generation and integrity check

### Development Setup
```bash
# Install all dependencies
npm run install:all

# Start development servers
npm run start:local      # Both backend and mobile
npm run dev:backend      # Backend only
npm run dev:mobile       # Mobile Metro bundler only

# Run on Android device/emulator
npm run dev:android
```

### Testing Commands
```bash
npm test                 # All tests
npm run test:integration # Mobile app integration
npm run test:api         # Backend API tests
npm run test:mobile-network # Network functionality
```

## 🌐 Network Configuration

### Current Network Setup
- **Development IP**: `10.1.0.150:3000` (configurable)
- **Backend Port**: 3000
- **WebSocket**: Same IP and port
- **Environment Files**:
  - `mobile/.env`: API_BASE_URL, WS_URL, Supabase configuration
  - `backend/.env`: Server configuration (PORT=3000, HOST=0.0.0.0 for network access)

### Network Features
```javascript
// Auto-detection and configuration
const config = await networkService.autoDetectNetwork();
// { apiBaseUrl: "http://10.1.0.150:3000", wsUrl: "ws://10.1.0.150:3000" }

// API communication
const connected = await apiService.testConnection();
const result = await apiService.healthCheck();

// WebSocket real-time features
await webSocketService.connect();
webSocketService.on('race_update', handleRaceUpdate);
```

## 📋 Development Guidelines

### React Native Best Practices
1. **No Expo**: Use React Native CLI commands only
2. **TypeScript**: All new code must be TypeScript
3. **Component Structure**: Follow existing patterns in `src/components/`
4. **State Management**: Use React Context (`src/context/`)
5. **Navigation**: React Navigation v6 stack and tab navigation

### API Integration
1. **Service Layer**: Use existing services in `src/services/`
2. **Error Handling**: Implement robust error handling with retries
3. **Network Awareness**: Use network service for connectivity checks
4. **Authentication**: JWT tokens managed through Supabase service

### Testing Requirements
1. **Unit Tests**: Jest for component and service testing
2. **Integration Tests**: Full API integration validation
3. **E2E Tests**: End-to-end user flow testing
4. **Network Tests**: Validate WiFi functionality

### Build System Guidelines
1. **APK Builds**: Always use the automated build system
2. **Testing**: Never skip integration tests in production builds
3. **Environment**: Ensure proper IP configuration for target deployment
4. **Validation**: All 12 validation tests must pass before APK generation

## 🔧 Common Development Tasks

### Adding New Features
1. Create components in `src/components/`
2. Add screens to `src/screens/` and register in navigation
3. Update services in `src/services/` for backend integration
4. Add tests in `__tests__/` or `tests/`
5. Update TypeScript types as needed

### Network-Related Changes
1. Update network service for new IP ranges
2. Modify API service for new endpoints
3. Update WebSocket service for new events
4. Test network functionality with `npm run test:mobile-network`

### Android-Specific Changes
1. Native code changes in `android/app/src/`
2. Build configuration in `android/app/build.gradle`
3. Permissions in `android/app/src/main/AndroidManifest.xml`
4. Test with `npm run dev:android`

### Backend Integration
1. API changes require updating `src/services/api.ts`
2. WebSocket events need updates in `src/services/websocket.ts`
3. Database changes may require Supabase service updates
4. Always test with integration tests

## 📊 Project Status & Metrics

### Current State
- **Build System**: ✅ Complete and validated
- **Network Functionality**: ✅ WiFi communication working
- **Testing Coverage**: 95.9% success rate (71/74 tests passing)
- **APK Generation**: ✅ Automated and validated
- **Mobile App**: ✅ Ready for Android deployment

### Test Coverage
- **Unit Tests**: 32/32 (100%)
- **Database Integration**: 13/13 (100%)
- **Vehicle E2E**: 9/9 (100%)
- **WebSocket Features**: 1/1 (100%)
- **Race E2E**: 8/9 (89%)

### Ready for Production
The mobile app is **production-ready** with:
- Complete network functionality for WiFi operation
- Comprehensive testing and validation
- Automated APK build system
- Android deployment configuration
- Real-time features with WebSocket integration

## 🚨 Important Notes

### React Native CLI (Not Expo)
- **Use**: `react-native run-android`, `react-native start`
- **Don't Use**: `expo start`, `expo build`, any Expo CLI commands
- **Native Modules**: Direct React Native community packages
- **Build Process**: Gradle-based Android builds

### Network Requirements
- Mobile device and development PC must be on same WiFi network
- Backend server must be running and accessible
- Firewall must allow port 3000 access
- IP addresses are automatically detected but can be manually configured

### Build Requirements
- **Node.js**: v16 or later
- **Java JDK**: v11 or later  
- **Android Studio**: With Android SDK and tools
- **Environment Variables**: ANDROID_HOME, ANDROID_SDK_ROOT, JAVA_HOME
- **Windows Development**: PowerShell scripts optimized for Windows environments

### Cross-Platform Notes
- APK build scripts are currently optimized for Windows development environments
- For Linux/macOS development, use React Native CLI commands directly:
  ```bash
  cd mobile
  npm run android          # Run on device/emulator
  npx react-native build-android --mode=release  # Build APK manually
  ```

---

**Built for high-performance racing experiences on Android devices without Expo dependencies.**