const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const BuildLogger = require('../utils/build-logger');

class IntegrationValidator {
  constructor() {
    this.logger = new BuildLogger(true);
    this.projectRoot = path.resolve(__dirname, '../../../');
    this.androidRoot = path.join(this.projectRoot, 'android');
  }

  async validateAll() {
    this.logger.log('Starting integration validation...', 'info');
    
    let allValid = true;
    
    // Validate APK functionality
    allValid &= await this.validateApkFunctionality();
    
    // Validate React Native bridge
    allValid &= await this.validateReactNativeBridge();
    
    // Validate native modules
    allValid &= await this.validateNativeModules();
    
    // Validate build performance
    allValid &= await this.validateBuildPerformance();
    
    return this.logger.printSummary();
  }

  async validateApkFunctionality() {
    this.logger.log('Validating APK functionality...', 'info');
    
    try {
      const apkPath = path.join(this.androidRoot, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
      
      if (!fs.existsSync(apkPath)) {
        this.logger.error(
          'APK file not found',
          'Run build process first to generate APK'
        );
        return false;
      }

      // Check APK contents using aapt if available
      const aaptResult = await this.runCommand('aapt list -a ' + apkPath);
      
      if (aaptResult.success) {
        const output = aaptResult.output;
        
        // Check for essential components
        const essentialChecks = [
          { pattern: /classes\.dex/, name: 'DEX files', fix: 'Ensure Java compilation completed successfully' },
          { pattern: /AndroidManifest\.xml/, name: 'Android Manifest', fix: 'Check manifest configuration' },
          { pattern: /resources\.arsc/, name: 'Resources', fix: 'Verify resource compilation' },
          { pattern: /assets\//, name: 'React Native bundle', fix: 'Check if JS bundle was included' }
        ];

        let allComponentsFound = true;
        for (const check of essentialChecks) {
          if (check.pattern.test(output)) {
            this.logger.success(`${check.name} found in APK`);
          } else {
            this.logger.warning(
              `${check.name} not found in APK`,
              check.fix
            );
            allComponentsFound = false;
          }
        }

        if (allComponentsFound) {
          this.logger.success('APK contains all essential components');
          return true;
        } else {
          this.logger.warning(
            'APK missing some components',
            'Review build configuration to ensure all components are included'
          );
          return false;
        }
      } else {
        this.logger.warning(
          'Could not analyze APK contents (aapt not available)',
          'Install Android Build Tools for detailed APK analysis'
        );
        
        // Basic file size check
        const stats = fs.statSync(apkPath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        if (stats.size < 5 * 1024 * 1024) { // Less than 5MB
          this.logger.warning(
            `APK size (${sizeInMB}MB) seems small for React Native app`,
            'Check if all dependencies and assets are included'
          );
          return false;
        } else {
          this.logger.success(`APK size (${sizeInMB}MB) appears reasonable`);
          return true;
        }
      }
    } catch (error) {
      this.logger.error(
        `APK functionality validation failed: ${error.message}`,
        'Check APK generation process and file permissions'
      );
      return false;
    }
  }

  async validateReactNativeBridge() {
    this.logger.log('Validating React Native bridge integration...', 'info');
    
    try {
      // Check MainApplication.java configuration
      const mainAppPath = path.join(this.androidRoot, 'app', 'src', 'main', 'java');
      const mainAppFiles = this.findJavaFiles(mainAppPath, 'MainApplication.java');
      
      if (mainAppFiles.length === 0) {
        this.logger.error(
          'MainApplication.java not found',
          'Create MainApplication.java with proper React Native initialization'
        );
        return false;
      }

      const mainAppFile = mainAppFiles[0];
      const content = fs.readFileSync(mainAppFile, 'utf8');
      
      // Check for essential React Native imports and configurations
      const bridgeChecks = [
        { 
          pattern: /import com\.facebook\.react\.ReactApplication/, 
          name: 'ReactApplication import',
          fix: 'Add: import com.facebook.react.ReactApplication;'
        },
        { 
          pattern: /import com\.facebook\.react\.defaults\.DefaultNewArchitectureEntryPoint/, 
          name: 'New Architecture entry point',
          fix: 'Add: import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;'
        },
        { 
          pattern: /ReactHost|ReactNativeHost/, 
          name: 'React Host configuration',
          fix: 'Configure ReactNativeHost properly for RN 0.74.7'
        },
        { 
          pattern: /getPackages\(\)/, 
          name: 'Package list configuration',
          fix: 'Implement getPackages() method with PackageList'
        }
      ];

      let allBridgeChecksPass = true;
      for (const check of bridgeChecks) {
        if (check.pattern.test(content)) {
          this.logger.success(`${check.name} configured correctly`);
        } else {
          this.logger.error(
            `${check.name} missing or incorrect`,
            check.fix
          );
          allBridgeChecksPass = false;
        }
      }

      // Check for common React Native 0.74.7 API issues
      if (content.includes('new ReactHost(')) {
        this.logger.success('Using React Native 0.74.7 ReactHost API');
      } else if (content.includes('ReactNativeHost')) {
        this.logger.warning(
          'Using legacy ReactNativeHost pattern',
          'Consider updating to ReactHost for React Native 0.74.7'
        );
      }

      return allBridgeChecksPass;
    } catch (error) {
      this.logger.error(
        `React Native bridge validation failed: ${error.message}`,
        'Check MainApplication.java configuration and imports'
      );
      return false;
    }
  }

  async validateNativeModules() {
    this.logger.log('Validating native modules integration...', 'info');
    
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Get React Native packages that have native components
      const nativePackages = Object.keys(packageJson.dependencies || {})
        .filter(pkg => pkg.startsWith('react-native-') && pkg !== 'react-native');

      this.logger.log(`Found ${nativePackages.length} React Native packages with potential native components`, 'info');

      let allModulesValid = true;

      for (const pkg of nativePackages) {
        const packagePath = path.join(this.projectRoot, 'node_modules', pkg);
        
        if (!fs.existsSync(packagePath)) {
          this.logger.error(
            `Package ${pkg} not installed`,
            `Run: npm install ${pkg}`
          );
          allModulesValid = false;
          continue;
        }

        // Check if package has Android implementation
        const androidPath = path.join(packagePath, 'android');
        if (fs.existsSync(androidPath)) {
          const buildGradlePath = path.join(androidPath, 'build.gradle');
          
          if (fs.existsSync(buildGradlePath)) {
            const buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');
            
            // Check for common configuration issues
            if (buildGradleContent.includes('buildConfigField') && !buildGradleContent.includes('buildConfig = true')) {
              this.logger.error(
                `${pkg} missing buildConfig feature`,
                `Add 'buildFeatures { buildConfig = true }' to ${pkg}/android/build.gradle`
              );
              allModulesValid = false;
            } else {
              this.logger.success(`${pkg} Android configuration is valid`);
            }
          } else {
            this.logger.warning(
              `${pkg} missing Android build.gradle`,
              'Package may not have native Android implementation'
            );
          }
        } else {
          this.logger.log(`${pkg} is JavaScript-only (no native Android code)`, 'info');
        }
      }

      // Check React Native auto-linking
      const reactNativeConfigPath = path.join(this.projectRoot, 'react-native.config.js');
      if (fs.existsSync(reactNativeConfigPath)) {
        this.logger.success('React Native configuration file found');
      } else {
        this.logger.log('No custom React Native configuration (using defaults)', 'info');
      }

      return allModulesValid;
    } catch (error) {
      this.logger.error(
        `Native modules validation failed: ${error.message}`,
        'Check React Native package installations and configurations'
      );
      return false;
    }
  }

  async validateBuildPerformance() {
    this.logger.log('Validating build performance...', 'info');
    
    try {
      // Check build cache
      const gradleCachePath = path.join(this.androidRoot, '.gradle');
      if (fs.existsSync(gradleCachePath)) {
        this.logger.success('Gradle cache directory found');
      } else {
        this.logger.warning(
          'Gradle cache not found',
          'First build may take longer'
        );
      }

      // Check gradle.properties for performance settings
      const gradlePropsPath = path.join(this.androidRoot, 'gradle.properties');
      if (fs.existsSync(gradlePropsPath)) {
        const gradleProps = fs.readFileSync(gradlePropsPath, 'utf8');
        
        const performanceChecks = [
          { 
            pattern: /org\.gradle\.jvmargs=-Xmx\d+[gG]/, 
            name: 'JVM heap size configured',
            fix: 'Add: org.gradle.jvmargs=-Xmx4g'
          },
          { 
            pattern: /org\.gradle\.parallel=true/, 
            name: 'Parallel builds enabled',
            fix: 'Add: org.gradle.parallel=true'
          },
          { 
            pattern: /org\.gradle\.daemon=true/, 
            name: 'Gradle daemon enabled',
            fix: 'Add: org.gradle.daemon=true'
          },
          { 
            pattern: /org\.gradle\.configureondemand=true/, 
            name: 'Configure on demand enabled',
            fix: 'Add: org.gradle.configureondemand=true'
          }
        ];

        let performanceScore = 0;
        for (const check of performanceChecks) {
          if (check.pattern.test(gradleProps)) {
            this.logger.success(check.name);
            performanceScore++;
          } else {
            this.logger.warning(
              `Performance optimization missing: ${check.name}`,
              check.fix
            );
          }
        }

        if (performanceScore >= 3) {
          this.logger.success('Build performance is well optimized');
        } else {
          this.logger.warning(
            `Build performance can be improved (${performanceScore}/4 optimizations)`,
            'Add recommended performance settings to gradle.properties'
          );
        }
      } else {
        this.logger.warning(
          'gradle.properties not found',
          'Create gradle.properties with performance optimizations'
        );
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Build performance validation failed: ${error.message}`,
        'Check Gradle configuration and file permissions'
      );
      return false;
    }
  }

  findJavaFiles(dir, filename) {
    const results = [];
    
    if (!fs.existsSync(dir)) {
      return results;
    }

    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        results.push(...this.findJavaFiles(filePath, filename));
      } else if (file === filename) {
        results.push(filePath);
      }
    }
    
    return results;
  }

  async runCommand(command) {
    return new Promise((resolve) => {
      exec(command, (error, stdout, stderr) => {
        resolve({
          success: !error,
          output: stdout,
          error: stderr || (error ? error.message : '')
        });
      });
    });
  }
}

module.exports = IntegrationValidator;