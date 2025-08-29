const fs = require('fs');
const path = require('path');
const semver = require('semver');
const BuildLogger = require('../utils/build-logger');

class ConfigurationValidator {
  constructor() {
    this.logger = new BuildLogger(true);
    this.projectRoot = path.resolve(__dirname, '../../../');
    this.androidRoot = path.join(this.projectRoot, 'android');
  }

  async validateAll() {
    this.logger.log('Starting comprehensive build configuration validation...', 'info');
    
    let allValid = true;
    
    // Validate package.json
    allValid &= await this.validatePackageJson();
    
    // Validate Android configuration
    allValid &= await this.validateAndroidConfig();
    
    // Validate Gradle configuration
    allValid &= await this.validateGradleConfig();
    
    // Validate React Native packages
    allValid &= await this.validateReactNativePackages();
    
    // Validate build tools
    allValid &= await this.validateBuildTools();
    
    return this.logger.printSummary();
  }

  async validatePackageJson() {
    this.logger.log('Validating package.json configuration...', 'info');
    
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      this.logger.error(
        'package.json not found',
        'Create package.json in mobile directory with React Native dependencies'
      );
      return false;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    let valid = true;

    // Check React Native version
    if (!packageJson.dependencies || !packageJson.dependencies['react-native']) {
      this.logger.error(
        'React Native dependency missing',
        'Add "react-native": "^0.74.7" to package.json dependencies'
      );
      valid = false;
    } else {
      const rnVersion = packageJson.dependencies['react-native'];
      if (!semver.satisfies('0.74.7', rnVersion)) {
        this.logger.warning(
          `React Native version ${rnVersion} may have compatibility issues`,
          'Consider using React Native 0.74.7 for maximum compatibility'
        );
      } else {
        this.logger.success('React Native version is compatible');
      }
    }

    // Check React version compatibility
    if (packageJson.dependencies && packageJson.dependencies.react) {
      const reactVersion = packageJson.dependencies.react;
      if (semver.gt(semver.coerce(reactVersion), '18.2.0')) {
        this.logger.warning(
          `React version ${reactVersion} is newer than recommended for RN 0.74.7`,
          'Downgrade React to 18.2.0: npm install react@18.2.0'
        );
      }
    }

    // Validate critical React Native packages
    const criticalPackages = {
      'react-native-reanimated': { 
        recommended: '~3.10.1',
        reason: 'Version 3.16+ has compatibility issues with RN 0.74.7'
      },
      'react-native-gesture-handler': { 
        recommended: '~2.16.0',
        reason: 'Version 2.24+ uses newer React Native APIs'
      },
      'react-native-safe-area-context': { 
        recommended: '~4.10.9',
        reason: 'Version 5.4+ requires newer React Native architecture'
      },
      'react-native-screens': { 
        recommended: '~3.31.1',
        reason: 'Version 4.11+ has breaking API changes'
      }
    };

    for (const [pkg, info] of Object.entries(criticalPackages)) {
      if (packageJson.dependencies && packageJson.dependencies[pkg]) {
        const currentVersion = packageJson.dependencies[pkg];
        if (!semver.satisfies(semver.coerce(currentVersion), info.recommended)) {
          this.logger.error(
            `${pkg} version ${currentVersion} is incompatible`,
            `Update to compatible version: npm install ${pkg}@${info.recommended}\nReason: ${info.reason}`
          );
          valid = false;
        } else {
          this.logger.success(`${pkg} version is compatible`);
        }
      }
    }

    return valid;
  }

  async validateAndroidConfig() {
    this.logger.log('Validating Android configuration...', 'info');
    
    let valid = true;

    // Check app-level build.gradle
    const appBuildGradle = path.join(this.androidRoot, 'app', 'build.gradle');
    if (!fs.existsSync(appBuildGradle)) {
      this.logger.error(
        'Android app build.gradle not found',
        'Ensure React Native Android project is properly initialized'
      );
      return false;
    }

    const buildGradleContent = fs.readFileSync(appBuildGradle, 'utf8');

    // Check compileSdk version
    const compileSdkMatch = buildGradleContent.match(/compileSdk\s+(\d+)/);
    if (!compileSdkMatch) {
      this.logger.error(
        'compileSdk not specified in app build.gradle',
        'Add "compileSdk 35" to android block in app/build.gradle'
      );
      valid = false;
    } else {
      const compileSdk = parseInt(compileSdkMatch[1]);
      if (compileSdk < 35) {
        this.logger.warning(
          `compileSdk ${compileSdk} is older than recommended`,
          'Update to "compileSdk 35" for latest Android features'
        );
      } else {
        this.logger.success(`compileSdk ${compileSdk} is up to date`);
      }
    }

    // Check minSdk version
    const minSdkMatch = buildGradleContent.match(/minSdk\s+(\d+)/);
    if (!minSdkMatch) {
      this.logger.error(
        'minSdk not specified',
        'Add "minSdk 23" to defaultConfig in app/build.gradle'
      );
      valid = false;
    } else {
      const minSdk = parseInt(minSdkMatch[1]);
      if (minSdk < 23) {
        this.logger.warning(
          `minSdk ${minSdk} is low for React Native 0.74.7`,
          'Consider updating to "minSdk 23" for better compatibility'
        );
      } else {
        this.logger.success(`minSdk ${minSdk} is appropriate`);
      }
    }

    // Check Java compatibility
    const javaVersionMatch = buildGradleContent.match(/sourceCompatibility JavaVersion\.VERSION_(\d+)/);
    if (!javaVersionMatch) {
      this.logger.error(
        'Java sourceCompatibility not specified',
        'Add compileOptions with sourceCompatibility and targetCompatibility JavaVersion.VERSION_17'
      );
      valid = false;
    } else {
      const javaVersion = parseInt(javaVersionMatch[1]);
      if (javaVersion < 17) {
        this.logger.error(
          `Java ${javaVersion} is too old for Android Gradle Plugin 8.7.3`,
          'Update to JavaVersion.VERSION_17 in compileOptions'
        );
        valid = false;
      } else {
        this.logger.success(`Java ${javaVersion} compatibility is correct`);
      }
    }

    return valid;
  }

  async validateGradleConfig() {
    this.logger.log('Validating Gradle configuration...', 'info');
    
    let valid = true;

    // Check project-level build.gradle
    const projectBuildGradle = path.join(this.androidRoot, 'build.gradle');
    if (!fs.existsSync(projectBuildGradle)) {
      this.logger.error(
        'Project build.gradle not found',
        'Ensure Android project structure is correct'
      );
      return false;
    }

    const buildGradleContent = fs.readFileSync(projectBuildGradle, 'utf8');

    // Check Android Gradle Plugin version
    const agpMatch = buildGradleContent.match(/com\.android\.tools\.build:gradle:([^\'"]+)/);
    if (!agpMatch) {
      this.logger.error(
        'Android Gradle Plugin not found',
        'Add Android Gradle Plugin dependency to project build.gradle'
      );
      valid = false;
    } else {
      const agpVersion = agpMatch[1];
      if (semver.lt(semver.coerce(agpVersion), '8.7.0')) {
        this.logger.error(
          `Android Gradle Plugin ${agpVersion} is too old`,
          'Update to version 8.7.3: classpath("com.android.tools.build:gradle:8.7.3")'
        );
        valid = false;
      } else {
        this.logger.success(`Android Gradle Plugin ${agpVersion} is compatible`);
      }
    }

    // Check Gradle wrapper version
    const gradleWrapperProps = path.join(this.androidRoot, 'gradle', 'wrapper', 'gradle-wrapper.properties');
    if (fs.existsSync(gradleWrapperProps)) {
      const wrapperContent = fs.readFileSync(gradleWrapperProps, 'utf8');
      const gradleVersionMatch = wrapperContent.match(/gradle-([^-]+)-/);
      if (gradleVersionMatch) {
        const gradleVersion = gradleVersionMatch[1];
        if (semver.lt(semver.coerce(gradleVersion), '8.13.0')) {
          this.logger.warning(
            `Gradle ${gradleVersion} may have compatibility issues`,
            'Update gradle-wrapper.properties to use Gradle 8.13 or later'
          );
        } else {
          this.logger.success(`Gradle ${gradleVersion} is compatible`);
        }
      }
    }

    return valid;
  }

  async validateReactNativePackages() {
    this.logger.log('Validating React Native package configurations...', 'info');
    
    let valid = true;
    const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
    
    const packagesToCheck = [
      'react-native-reanimated',
      'react-native-gesture-handler',
      'react-native-safe-area-context',
      'react-native-screens',
      'react-native-svg',
      'react-native-maps'
    ];

    for (const packageName of packagesToCheck) {
      const packagePath = path.join(nodeModulesPath, packageName);
      if (fs.existsSync(packagePath)) {
        const buildGradlePath = path.join(packagePath, 'android', 'build.gradle');
        if (fs.existsSync(buildGradlePath)) {
          const buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');
          
          // Check if buildConfig is enabled
          if (buildGradleContent.includes('buildConfigField') && !buildGradleContent.includes('buildConfig = true')) {
            this.logger.error(
              `${packageName} missing buildConfig feature`,
              `Add 'buildFeatures { buildConfig = true }' to ${packageName}/android/build.gradle`
            );
            valid = false;
          }

          // Check Java compatibility
          if (buildGradleContent.includes('VERSION_1_8')) {
            this.logger.error(
              `${packageName} using old Java version`,
              `Update ${packageName}/android/build.gradle to use JavaVersion.VERSION_17`
            );
            valid = false;
          }

          // Check for null version handling
          if (buildGradleContent.includes('REACT_NATIVE_VERSION.startsWith') && 
              !buildGradleContent.includes('REACT_NATIVE_VERSION == null')) {
            this.logger.error(
              `${packageName} has null version handling issue`,
              `Add null check: (REACT_NATIVE_VERSION == null || REACT_NATIVE_VERSION.startsWith...)`
            );
            valid = false;
          }

          this.logger.success(`${packageName} configuration validated`);
        }
      } else {
        this.logger.warning(
          `${packageName} not installed`,
          `Install with: npm install ${packageName}@compatible-version`
        );
      }
    }

    return valid;
  }

  async validateBuildTools() {
    this.logger.log('Validating build tools and environment...', 'info');
    
    let valid = true;

    try {
      // Check Node.js version
      const nodeVersion = process.version;
      if (semver.lt(nodeVersion, '18.0.0')) {
        this.logger.warning(
          `Node.js ${nodeVersion} is older than recommended`,
          'Update to Node.js 18+ for better React Native support'
        );
      } else {
        this.logger.success(`Node.js ${nodeVersion} is compatible`);
      }

      // Check if gradlew exists
      const gradlewPath = path.join(this.androidRoot, 'gradlew.bat');
      if (!fs.existsSync(gradlewPath)) {
        this.logger.error(
          'Gradle wrapper (gradlew.bat) not found',
          'Run "npx react-native init" or restore Gradle wrapper files'
        );
        valid = false;
      } else {
        this.logger.success('Gradle wrapper found');
      }

      // Check Android SDK
      const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
      if (!androidHome) {
        this.logger.error(
          'ANDROID_HOME environment variable not set',
          'Set ANDROID_HOME to point to your Android SDK installation'
        );
        valid = false;
      } else {
        this.logger.success(`Android SDK found at ${androidHome}`);
      }

    } catch (error) {
      this.logger.error(
        `Build tools validation failed: ${error.message}`,
        'Check your development environment setup'
      );
      valid = false;
    }

    return valid;
  }
}

module.exports = ConfigurationValidator;