# DASH Racing - Local Mobile Development Agent Prompt

## 🎯 MISSION: Enable Local Network Mobile App Testing

**OBJECTIVE:** Configure DASH Racing React Native app to run on mobile device over local WiFi network (untethered from PC) for development testing.

**CONTEXT:** This is a React Native 0.74.7 app with Fastify TypeScript backend and Supabase PostgreSQL database. Android APK builds are working (170MB). User will provide API keys at 4 PM.

---

## 📋 CRITICAL REQUIREMENTS

### 🚫 DO NOT CHANGE
- **Database schema files** (`database/complete-schema.sql`, `database/deploy-*.sql`)
- **Supabase configuration** - use existing setup
- **Package.json dependencies** - build system is working
- **Android build configuration** - APK generation is functional

### ✅ MUST ENSURE
- **.env files are NOT in .gitignore** during development
- **Backend binds to 0.0.0.0** (not localhost) for network access
- **Mobile app connects via local IP** (not localhost/127.0.0.1)
- **Security token storage** uses react-native-keychain (not AsyncStorage)
- **Full local development workflow** functional

---

## 🔧 IMPLEMENTATION TASKS

### Task 1: Environment Configuration Setup
```
Priority: CRITICAL - Required for any functionality
Location: Root, backend/, mobile/
```

**Actions:**
1. **Create backend/.env** with placeholder structure:
   ```
   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   
   # JWT Configuration  
   JWT_SECRET=your-jwt-secret-key
   
   # Server Configuration
   PORT=3000
   HOST=0.0.0.0
   NODE_ENV=development
   
   # Database
   DATABASE_URL=your-supabase-db-url
   ```

2. **Create mobile/.env** with placeholder structure:
   ```
   # API Configuration
   API_BASE_URL=http://192.168.1.100:3000
   WS_URL=ws://192.168.1.100:3000
   
   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Update .gitignore** to temporarily allow .env files:
   ```
   # Comment out during development
   # .env
   # .env.local
   # .env.development
   # .env.production
   ```

### Task 2: Backend Network Configuration
```
Priority: CRITICAL - Required for mobile connectivity
Location: backend/src/server.ts
```

**Actions:**
1. **Update server binding** to accept connections from local network:
   ```typescript
   // Change from localhost to 0.0.0.0
   const start = async () => {
     try {
       await fastify.listen({ 
         port: process.env.PORT || 3000, 
         host: '0.0.0.0' // This enables network access
       });
       console.log('Server listening on http://0.0.0.0:3000');
     } catch (err) {
       fastify.log.error(err);
       process.exit(1);
     }
   };
   ```

2. **Add CORS configuration** for mobile app access:
   ```typescript
   // Add to fastify plugins registration
   await fastify.register(cors, {
     origin: true, // Allow all origins during development
     credentials: true
   });
   ```

3. **Update WebSocket configuration** for network access:
   ```typescript
   // Ensure WebSocket server binds to 0.0.0.0
   // Check existing WebSocket service configuration
   ```

### Task 3: Mobile API Configuration
```
Priority: CRITICAL - Required for backend communication
Location: mobile/src/services/, mobile/src/utils/
```

**Actions:**
1. **Update API base URL configuration**:
   - Find API service files (likely in `mobile/src/services/`)
   - Replace localhost/127.0.0.1 with dynamic IP from environment
   - Use `API_BASE_URL` from mobile/.env

2. **Update WebSocket connection**:
   - Find WebSocket service configuration
   - Replace localhost with `WS_URL` from mobile/.env
   - Ensure proper reconnection logic for network changes

3. **Add network detection**:
   ```typescript
   // Add to mobile app for IP detection
   import { NetworkInfo } from 'react-native-network-info';
   
   const getLocalIP = async () => {
     const ip = await NetworkInfo.getIPV4Address();
     return ip;
   };
   ```

### Task 4: Security Token Storage Fix
```
Priority: HIGH - Current AsyncStorage is insecure
Location: mobile/src/services/auth.ts or similar
```

**Actions:**
1. **Install react-native-keychain** (if not already present):
   ```bash
   cd mobile && npm install react-native-keychain
   ```

2. **Replace AsyncStorage with Keychain**:
   ```typescript
   import * as Keychain from 'react-native-keychain';
   
   // Replace AsyncStorage.setItem with:
   await Keychain.setSecurePassword('auth_token', token);
   
   // Replace AsyncStorage.getItem with:
   const credentials = await Keychain.getSecurePassword('auth_token');
   const token = credentials ? credentials.password : null;
   ```

3. **Update authentication service** to use secure storage consistently

### Task 5: Local Development Workflow
```
Priority: HIGH - Required for testing workflow
Location: Root scripts, documentation
```

**Actions:**
1. **Create start-local-dev script** in root package.json:
   ```json
   {
     "scripts": {
       "start:local": "concurrently \"npm run backend:dev\" \"npm run mobile:start\"",
       "backend:dev": "cd backend && npm run dev",
       "mobile:start": "cd mobile && npm start",
       "mobile:android": "cd mobile && npm run android",
       "get-ip": "node -e \"require('os').networkInterfaces()['Wi-Fi']?.find(i=>i.family==='IPv4'&&!i.internal)?.address || 'IP not found'\""
     }
   }
   ```

2. **Create IP detection utility**:
   ```javascript
   // scripts/get-local-ip.js
   const os = require('os');
   const interfaces = os.networkInterfaces();
   const getLocalIP = () => {
     for (const name of Object.keys(interfaces)) {
       for (const interface of interfaces[name]) {
         if (interface.family === 'IPv4' && !interface.internal) {
           return interface.address;
         }
       }
     }
     return 'localhost';
   };
   console.log(getLocalIP());
   ```

### Task 6: Mobile Build and Test
```
Priority: HIGH - Validate complete workflow
Location: mobile/android/
```

**Actions:**
1. **Test APK generation** with new configuration:
   ```bash
   cd mobile && npm run android
   ```

2. **Verify network connectivity**:
   - Start backend server
   - Install APK on device
   - Test API calls from mobile app
   - Verify WebSocket connections

3. **Add development logging**:
   ```typescript
   // Add to mobile app for debugging
   console.log('API_BASE_URL:', process.env.API_BASE_URL);
   console.log('Network request to:', url);
   ```

---

## 🧪 TESTING CHECKLIST

### Backend Tests
- [ ] Backend starts and binds to 0.0.0.0:3000
- [ ] Environment variables loaded correctly
- [ ] API endpoints accessible from network IP
- [ ] WebSocket service accepts network connections
- [ ] CORS headers allow mobile app origin

### Mobile Tests  
- [ ] APK builds successfully with new configuration
- [ ] App connects to backend via local network IP
- [ ] Authentication flow works with secure token storage
- [ ] WebSocket real-time features functional
- [ ] App works when disconnected from PC

### Network Tests
- [ ] Mobile device and PC on same WiFi network
- [ ] Backend accessible via `http://[LOCAL_IP]:3000`
- [ ] Mobile app can make API calls over WiFi
- [ ] Real-time features work over network connection
- [ ] App handles network disconnection gracefully

---

## 🚨 TROUBLESHOOTING GUIDE

### Common Issues and Solutions

**Issue: Mobile app can't connect to backend**
- Check if PC firewall blocking port 3000
- Verify mobile device on same WiFi network
- Test backend accessibility: `curl http://[LOCAL_IP]:3000/health`

**Issue: Environment variables not loading**
- Verify .env file location and syntax
- Check dotenv configuration in server.ts
- Ensure .env not in .gitignore during development

**Issue: APK build fails after changes**
- Clean build: `cd mobile && npm run clean`
- Rebuild: `npm run android`
- Check for syntax errors in modified files

**Issue: WebSocket connection fails**
- Verify WebSocket server binding to 0.0.0.0
- Check mobile WebSocket URL uses correct IP
- Test WebSocket endpoint with online tool

---

## 📱 FINAL VALIDATION STEPS

1. **Start backend server**: `npm run backend:dev`
2. **Get local IP**: `npm run get-ip`
3. **Update mobile .env** with correct IP address
4. **Build APK**: `cd mobile && npm run android`
5. **Install on device** and test functionality
6. **Verify untethered operation** - disconnect USB, test over WiFi

---

## 🔑 API KEY INTEGRATION (When Provided at 4 PM)

**User will provide:**
- Supabase URL
- Supabase Anon Key  
- Supabase Service Key
- JWT Secret

**Update locations:**
- `backend/.env` - All keys
- `mobile/.env` - Supabase URL and Anon Key only

**Test after key integration:**
- Database connectivity from backend
- Authentication flow from mobile app
- Real-time features end-to-end

---

## 🎯 SUCCESS CRITERIA

✅ **Mobile app runs on device over WiFi**  
✅ **Backend accessible from local network**  
✅ **Authentication works with secure storage**  
✅ **Real-time features functional**  
✅ **Complete development workflow untethered**

**READY FOR:** Local mobile development and testing without PC connection