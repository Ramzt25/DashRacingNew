const ConfigurationValidator = require('./validators/configuration');
const ProcessValidator = require('./validators/process');
const IntegrationValidator = require('./validators/integration');
const BuildLogger = require('./utils/build-logger');

class BuildTestSuite {
  constructor() {
    this.logger = new BuildLogger(true);
    this.validators = {
      configuration: new ConfigurationValidator(),
      process: new ProcessValidator(),
      integration: new IntegrationValidator()
    };
  }

  async runAllTests() {
    this.logger.log('='.repeat(80), 'info');
    this.logger.log('DASH Racing Mobile App - Build Validation Test Suite', 'info');
    this.logger.log('React Native 0.74.7 Compatibility Validation', 'info');
    this.logger.log('='.repeat(80), 'info');

    const results = {};
    let overallSuccess = true;

    try {
      // Run configuration validation
      this.logger.log('\n🔧 PHASE 1: Configuration Validation', 'info');
      this.logger.log('-'.repeat(50), 'info');
      results.configuration = await this.validators.configuration.validateAll();
      overallSuccess = overallSuccess && results.configuration;

      if (!results.configuration) {
        this.logger.error(
          'Configuration validation failed',
          'Fix configuration issues before proceeding to build process validation'
        );
        // Continue anyway to show all issues
      }

      // Run process validation
      this.logger.log('\n⚙️ PHASE 2: Build Process Validation', 'info');
      this.logger.log('-'.repeat(50), 'info');
      results.process = await this.validators.process.validateAll();
      overallSuccess = overallSuccess && results.process;

      if (!results.process) {
        this.logger.error(
          'Build process validation failed',
          'Fix build process issues before proceeding to integration validation'
        );
        // Continue anyway to show all issues
      }

      // Run integration validation
      this.logger.log('\n🔗 PHASE 3: Integration Validation', 'info');
      this.logger.log('-'.repeat(50), 'info');
      results.integration = await this.validators.integration.validateAll();
      overallSuccess = overallSuccess && results.integration;

    } catch (error) {
      this.logger.error(
        `Test suite execution failed: ${error.message}`,
        'Check test suite configuration and dependencies'
      );
      overallSuccess = false;
    }

    // Generate comprehensive summary
    this.generateFinalReport(results, overallSuccess);

    return overallSuccess;
  }

  async runConfigurationOnly() {
    this.logger.log('Running Configuration Validation Only...', 'info');
    return await this.validators.configuration.validateAll();
  }

  async runProcessOnly() {
    this.logger.log('Running Build Process Validation Only...', 'info');
    return await this.validators.process.validateAll();
  }

  async runIntegrationOnly() {
    this.logger.log('Running Integration Validation Only...', 'info');
    return await this.validators.integration.validateAll();
  }

  generateFinalReport(results, overallSuccess) {
    this.logger.log('\n' + '='.repeat(80), 'info');
    this.logger.log('BUILD VALIDATION SUMMARY REPORT', 'info');
    this.logger.log('='.repeat(80), 'info');

    // Phase results
    const phases = [
      { name: 'Configuration Validation', key: 'configuration', icon: '🔧' },
      { name: 'Build Process Validation', key: 'process', icon: '⚙️' },
      { name: 'Integration Validation', key: 'integration', icon: '🔗' }
    ];

    for (const phase of phases) {
      const result = results[phase.key];
      const status = result ? '✅ PASSED' : '❌ FAILED';
      const statusColor = result ? 'success' : 'error';
      
      this.logger.log(`${phase.icon} ${phase.name}: ${status}`, statusColor);
    }

    // Overall result
    this.logger.log('\n' + '-'.repeat(80), 'info');
    if (overallSuccess) {
      this.logger.log('🎉 OVERALL RESULT: BUILD VALIDATION PASSED', 'success');
      this.logger.log('✅ Your DASH Racing mobile app is ready for APK generation!', 'success');
      
      this.logger.addFix('Next Steps for APK Generation:');
      this.logger.addFix('1. cd mobile/android');
      this.logger.addFix('2. ./gradlew clean');
      this.logger.addFix('3. ./gradlew assembleDebug');
      this.logger.addFix('4. Find APK at: app/build/outputs/apk/debug/app-debug.apk');
    } else {
      this.logger.log('❌ OVERALL RESULT: BUILD VALIDATION FAILED', 'error');
      this.logger.error(
        'Build validation failed in one or more phases',
        'Review the detailed error messages above and apply the suggested fixes'
      );
      
      this.logger.addFix('Priority Fix Actions:');
      if (!results.configuration) {
        this.logger.addFix('1. Fix configuration issues (package versions, Gradle setup, Android config)');
      }
      if (!results.process) {
        this.logger.addFix('2. Fix build process issues (compilation errors, dependency conflicts)');
      }
      if (!results.integration) {
        this.logger.addFix('3. Fix integration issues (React Native bridge, native modules)');
      }
    }

    // Performance recommendations
    this.logger.log('\n📊 Performance Recommendations:', 'info');
    this.logger.addFix('• Add Gradle performance settings to gradle.properties');
    this.logger.addFix('• Use Gradle daemon for faster builds');
    this.logger.addFix('• Enable parallel builds with org.gradle.parallel=true');
    this.logger.addFix('• Increase JVM heap size: org.gradle.jvmargs=-Xmx4g');

    // Troubleshooting resources
    this.logger.log('\n🆘 Troubleshooting Resources:', 'info');
    this.logger.addFix('• React Native 0.74.7 Upgrade Guide: https://react-native-community.github.io/upgrade-helper/');
    this.logger.addFix('• Android Gradle Plugin 8.7.3 Migration: https://developer.android.com/build/migrate-to-android-gradle-plugin-8-7');
    this.logger.addFix('• React Native Build Issues: https://reactnative.dev/docs/troubleshooting');
    this.logger.addFix('• Gradle Build Issues: https://docs.gradle.org/current/userguide/troubleshooting.html');

    return this.logger.printSummary();
  }

  // Convenience methods for specific validation scenarios
  async quickValidation() {
    this.logger.log('Running Quick Configuration Validation...', 'info');
    return await this.runConfigurationOnly();
  }

  async fullValidation() {
    this.logger.log('Running Full Build Validation (All Phases)...', 'info');
    return await this.runAllTests();
  }

  async prebuildValidation() {
    this.logger.log('Running Pre-Build Validation (Configuration + Process)...', 'info');
    
    const configResult = await this.runConfigurationOnly();
    if (!configResult) {
      this.logger.error(
        'Configuration validation failed',
        'Fix configuration issues before attempting build'
      );
      return false;
    }

    const processResult = await this.runProcessOnly();
    return configResult && processResult;
  }
}

// CLI interface for direct execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const suite = new BuildTestSuite();

  async function runTests() {
    try {
      let result;

      switch (args[0]) {
        case 'config':
        case 'configuration':
          result = await suite.runConfigurationOnly();
          break;
        case 'process':
        case 'build':
          result = await suite.runProcessOnly();
          break;
        case 'integration':
        case 'int':
          result = await suite.runIntegrationOnly();
          break;
        case 'quick':
          result = await suite.quickValidation();
          break;
        case 'prebuild':
          result = await suite.prebuildValidation();
          break;
        case 'full':
        default:
          result = await suite.fullValidation();
          break;
      }

      process.exit(result ? 0 : 1);
    } catch (error) {
      console.error('Test suite execution failed:', error.message);
      process.exit(1);
    }
  }

  runTests();
}

module.exports = BuildTestSuite;