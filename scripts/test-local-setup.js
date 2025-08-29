#!/usr/bin/env node

/**
 * Local Mobile Development Test Script
 * Tests the configuration setup for local network mobile development
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Local Mobile Development Setup...\n');

// Test 1: Check environment files exist
console.log('1. Testing environment files...');
const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');
const mobileEnvPath = path.join(__dirname, '..', 'mobile', '.env');

const backendEnvExists = fs.existsSync(backendEnvPath);
const mobileEnvExists = fs.existsSync(mobileEnvPath);

console.log(`   Backend .env: ${backendEnvExists ? '✅' : '❌'}`);
console.log(`   Mobile .env: ${mobileEnvExists ? '✅' : '❌'}`);

// Test 2: Check .gitignore allows .env files
console.log('\n2. Testing .gitignore configuration...');
const gitignorePath = path.join(__dirname, '..', '.gitignore');
const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
const envCommentedOut = gitignoreContent.includes('# .env') && !gitignoreContent.includes('\n.env\n');
console.log(`   .env files allowed during development: ${envCommentedOut ? '✅' : '❌'}`);

// Test 3: Check mobile babel configuration
console.log('\n3. Testing mobile babel configuration...');
const babelConfigPath = path.join(__dirname, '..', 'mobile', 'babel.config.js');
const babelConfigExists = fs.existsSync(babelConfigPath);
console.log(`   Babel config with dotenv: ${babelConfigExists ? '✅' : '❌'}`);

if (babelConfigExists) {
  const babelContent = fs.readFileSync(babelConfigPath, 'utf8');
  const hasDotenvPlugin = babelContent.includes('react-native-dotenv');
  console.log(`   Dotenv plugin configured: ${hasDotenvPlugin ? '✅' : '❌'}`);
}

// Test 4: Check TypeScript types for environment
console.log('\n4. Testing TypeScript environment types...');
const envTypesPath = path.join(__dirname, '..', 'mobile', 'types', 'env.d.ts');
const envTypesExists = fs.existsSync(envTypesPath);
console.log(`   Environment types defined: ${envTypesExists ? '✅' : '❌'}`);

// Test 5: Check package.json scripts
console.log('\n5. Testing package.json scripts...');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const hasGetIpScript = !!packageJson.scripts['get-ip'];
const hasStartLocalScript = !!packageJson.scripts['start:local'];
console.log(`   get-ip script: ${hasGetIpScript ? '✅' : '❌'}`);
console.log(`   start:local script: ${hasStartLocalScript ? '✅' : '❌'}`);

// Test 6: Check dependencies
console.log('\n6. Testing dependencies...');
const mobilePackageJsonPath = path.join(__dirname, '..', 'mobile', 'package.json');
const mobilePackageJson = JSON.parse(fs.readFileSync(mobilePackageJsonPath, 'utf8'));
const hasKeychain = !!mobilePackageJson.dependencies['react-native-keychain'];
const hasDotenv = !!mobilePackageJson.dependencies['react-native-dotenv'];
console.log(`   react-native-keychain: ${hasKeychain ? '✅' : '❌'}`);
console.log(`   react-native-dotenv: ${hasDotenv ? '✅' : '❌'}`);

// Test 7: IP detection test
console.log('\n7. Testing IP detection...');
try {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let foundIP = false;
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        console.log(`   Local IP detected: ${interface.address} ✅`);
        foundIP = true;
        break;
      }
    }
    if (foundIP) break;
  }
  
  if (!foundIP) {
    console.log('   No external IP found ⚠️');
  }
} catch (error) {
  console.log(`   IP detection failed: ${error.message} ❌`);
}

console.log('\n🏁 Configuration test complete!');
console.log('\n📝 Next steps:');
console.log('   1. Add actual API keys to backend/.env and mobile/.env');
console.log('   2. Run: npm run get-ip (to get current network IP)');
console.log('   3. Update mobile/.env with the correct IP address');
console.log('   4. Test: npm run backend:dev (start backend server)');
console.log('   5. Build mobile APK and test network connectivity');