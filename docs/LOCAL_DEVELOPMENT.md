# Local Mobile Development Setup

This guide enables DASH Racing mobile app development and testing over local WiFi network without USB connection to PC.

## Quick Start

1. **Check Configuration**
   ```bash
   npm run test:local-setup
   ```

2. **Get Your Local IP**
   ```bash
   npm run get-ip
   ```

3. **Update Mobile Environment**
   Update `mobile/.env` with the IP address from step 2:
   ```env
   API_BASE_URL=http://YOUR_IP:3000
   WS_URL=ws://YOUR_IP:3000
   ```

4. **Add API Keys** (when provided)
   - Update `backend/.env` with Supabase credentials
   - Update `mobile/.env` with Supabase URL and anon key

5. **Start Development Servers**
   ```bash
   npm run start:local
   # Or separately:
   npm run backend:dev
   npm run mobile:start
   ```

6. **Build Mobile APK**
   ```bash
   npm run mobile:android
   ```

## Configuration Details

### Backend Changes
- ✅ Server binds to `0.0.0.0:3000` (network accessible)
- ✅ CORS configured for local network origins
- ✅ Environment variables loaded from `.env`
- ✅ Port changed from 8000 to 3000 for consistency

### Mobile Changes
- ✅ API URLs loaded from environment variables
- ✅ Secure token storage with react-native-keychain
- ✅ Babel configured for environment variable support
- ✅ TypeScript types for environment variables

### Security Improvements
- ✅ JWT tokens stored in secure keychain (not AsyncStorage)
- ✅ Environment-based configuration (no hardcoded IPs)
- ✅ Development logging for network debugging

## Testing Mobile on Device

1. **Ensure same WiFi network**: Both PC and mobile device
2. **Start backend**: `npm run backend:dev`
3. **Get backend URL**: Should show `http://0.0.0.0:3000`
4. **Test from mobile browser**: Navigate to `http://YOUR_IP:3000/health`
5. **Install APK**: Transfer and install on device
6. **Test app**: Should connect to backend over WiFi

## Troubleshooting

### Backend not accessible from mobile
- Check Windows Firewall (allow port 3000)
- Verify both devices on same WiFi network
- Test with `curl http://YOUR_IP:3000/health`

### Mobile app can't connect
- Verify mobile/.env has correct IP address
- Restart mobile app after changing .env
- Check Metro bundler reloaded configuration

### Environment variables not working
- Ensure babel.config.js has dotenv plugin
- Clear Metro cache: `npx react-native start --reset-cache`
- Verify .env file syntax (no spaces around =)

## Development Scripts

- `npm run get-ip` - Show current network IP
- `npm run test:local-setup` - Validate configuration
- `npm run start:local` - Start backend and mobile together
- `npm run backend:dev` - Start backend server only
- `npm run mobile:start` - Start Metro bundler only
- `npm run mobile:android` - Build and install APK

## Environment Files

### backend/.env
```env
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

### mobile/.env
```env
# API Configuration
API_BASE_URL=http://192.168.1.100:3000
WS_URL=ws://192.168.1.100:3000

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## Success Criteria

- ✅ Backend accessible from local network IP
- ✅ Mobile app connects via WiFi (not USB)
- ✅ Authentication works with secure storage
- ✅ APK builds successfully
- ✅ Real-time features work over network
- ✅ App functions when disconnected from PC