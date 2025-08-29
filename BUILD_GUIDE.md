# DASH Racing APK Build Guide

## 📱 Build Your APK with Full Validation

This guide covers how to build a fully validated APK for the DASH Racing mobile app.

## 🚀 Quick Start

### Option 1: Full Automated Build (Recommended)
```bash
# Run the comprehensive build script
.\build-apk.ps1
```

### Option 2: NPM Scripts
```bash
# Full build with validation
npm run build:apk

# Force restart backend server
npm run build:apk:force

# Quick build (skip tests - not recommended)
npm run build:apk:quick
```

### Option 3: Simple Batch Script
```bash
# For systems without PowerShell
.\build-apk.bat
```

## 📋 Prerequisites

### Required Software
- **Node.js** (v16 or later)
- **Java JDK** (v11 or later)
- **Android Studio** with Android SDK
- **npm** (comes with Node.js)

### Environment Variables
The build script will attempt to find these automatically, but you can set them manually:
```bash
ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk
ANDROID_SDK_ROOT=C:\Users\YourName\AppData\Local\Android\Sdk
JAVA_HOME=C:\Program Files\Java\jdk-11
```

## 🔧 Build Process Overview

The build script performs these steps:

1. **Environment Validation**
   - ✅ Checks for Node.js, Java, Android SDK
   - ✅ Sets up Android environment variables
   - ✅ Validates administrator privileges (if needed)

2. **Dependency Management**
   - ✅ Installs/updates backend dependencies
   - ✅ Installs/updates mobile dependencies
   - ✅ Verifies all packages are properly installed

3. **Backend Server Management**
   - ✅ Checks if backend is already running
   - ✅ Starts backend server in separate window if needed
   - ✅ Verifies server health and API accessibility
   - ✅ Configures server for network access (not just localhost)

4. **Comprehensive Testing** (REQUIRED)
   - ✅ Runs full mobile app integration tests
   - ✅ Tests authentication flow (login/logout)
   - ✅ Tests user profile management
   - ✅ Tests vehicle management APIs
   - ✅ Tests race data APIs
   - ✅ Tests friend system APIs
   - ✅ Validates API security (auth protection)
   - ✅ **ALL 12/12 TESTS MUST PASS** to proceed

5. **APK Build Process**
   - ✅ Cleans previous builds
   - ✅ Runs Gradle build process
   - ✅ Validates APK generation
   - ✅ Copies APK to builds directory with timestamp

6. **Final Validation**
   - ✅ Verifies APK file integrity
   - ✅ Creates timestamped and latest copies
   - ✅ Provides installation instructions

## 📁 Output Structure

After a successful build:
```
builds/
├── DashRacing-20250829-143022.apk    # Timestamped version
└── DashRacing-latest.apk             # Latest version (for easy access)
```

## 🔍 Validation Requirements

### Critical Tests (All Must Pass)
1. ✅ Backend Health Check
2. ✅ User Login (with existing test user)
3. ✅ Token Verification
4. ✅ User Profile Retrieval
5. ✅ Vehicle Management API
6. ✅ Race Data API (must have 179+ races)
7. ✅ Friends API
8. ✅ Authentication Protection (unauthorized requests blocked)
9. ✅ Logout Functionality
10. ✅ Post-logout Protection
11. ✅ Token Handling
12. ✅ API Response Validation

**Zero tolerance policy**: If any test fails, the build stops immediately.

## 🌐 Network Configuration

The APK is configured to work with:
- **Development**: Your PC's IP address (`192.168.168.28:8000`)
- **Production**: Configurable backend URL

### For Local Testing:
1. Your mobile device must be on the same WiFi network as your PC
2. Backend server must be running on your PC
3. Windows Firewall must allow port 8000 (script handles this)

## 🛠️ Troubleshooting

### Common Issues

#### "Backend server failed to start"
- Check if port 8000 is already in use
- Ensure you have necessary permissions
- Try running with `-ForceRestart` option

#### "Integration tests failed"
- Backend server might not be running properly
- Database might not be properly seeded
- Check backend logs for errors

#### "Android SDK not found"
- Install Android Studio
- Set ANDROID_HOME environment variable
- Restart PowerShell/Command Prompt

#### "Java not found"
- Install Java JDK 11 or later
- Add Java to your PATH
- Set JAVA_HOME environment variable

### Build Script Options

```bash
# Show help
.\build-apk.ps1 -Help

# Skip tests (not recommended)
.\build-apk.ps1 -SkipTests

# Force restart backend
.\build-apk.ps1 -ForceRestart

# Custom output directory
.\build-apk.ps1 -OutputDir "C:\MyBuilds"
```

## 📱 Installation on Device

After successful build:

1. **Enable Unknown Sources**
   - Go to Android Settings > Security
   - Enable "Install from Unknown Sources" or "Unknown Sources"

2. **Transfer APK**
   - Copy the APK file to your Android device
   - You can use USB, email, cloud storage, etc.

3. **Install**
   - Tap the APK file on your device
   - Follow installation prompts
   - Grant necessary permissions

4. **Network Setup**
   - Connect your device to the same WiFi as your PC
   - Make sure backend server is running
   - Launch the app and test login

## 🔒 Security Notes

- The APK includes real authentication
- All API calls are secured with JWT tokens
- Backend validates all requests
- No hardcoded credentials in the APK

## 📊 Build Validation Report

After each build, you'll get a comprehensive report:
- ✅ All test results (12/12 must pass)
- ✅ APK file size and location
- ✅ Backend server status
- ✅ Network accessibility confirmation
- ✅ Installation instructions

## 🎯 Success Criteria

A successful build means:
- ✅ All 12 integration tests pass
- ✅ Backend server is running and accessible
- ✅ APK is generated and validated
- ✅ Mobile app will connect to backend successfully
- ✅ Ready for real-world testing

## 🚨 Important Notes

1. **Never skip tests in production** - Use `-SkipTests` only for debugging
2. **Backend must be running** - The app requires the backend server
3. **Same network required** - Mobile device and PC must be on same WiFi
4. **Firewall considerations** - Port 8000 must be accessible
5. **Test first** - Always test the APK before distributing

---

## 🏁 Ready to Build?

Run this command and watch the magic happen:
```bash
.\build-apk.ps1
```

The script will guide you through everything and ensure your APK actually works! 🎉