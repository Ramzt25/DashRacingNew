const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const BuildLogger = require('../utils/build-logger');

class ProcessValidator {
  constructor() {
    this.logger = new BuildLogger(true);
    this.projectRoot = path.resolve(__dirname, '../../../');
    this.androidRoot = path.join(this.projectRoot, 'android');
  }

  async validateAll() {
    this.logger.log('Starting build process validation...', 'info');
    
    let allValid = true;
    
    // Validate clean build
    allValid &= await this.validateCleanBuild();
    
    // Validate dependencies resolution
    allValid &= await this.validateDependenciesResolution();
    
    // Validate compilation process
    allValid &= await this.validateCompilation();
    
    // Validate APK generation
    allValid &= await this.validateApkGeneration();
    
    return this.logger.printSummary();
  }

  async validateCleanBuild() {
    this.logger.log('Validating clean build process...', 'info');
    
    try {
      // Check if build directories exist
      const buildDirs = [
        path.join(this.androidRoot, 'app', 'build'),
        path.join(this.androidRoot, 'build'),
        path.join(this.projectRoot, 'node_modules')
      ];

      for (const dir of buildDirs) {
        if (fs.existsSync(dir)) {
          this.logger.log(`Found existing build directory: ${path.basename(dir)}`, 'info');
        }
      }

      // Test clean command
      const cleanResult = await this.runGradleCommand(['clean'], { timeout: 60000 });
      
      if (cleanResult.success) {
        this.logger.success('Clean build completed successfully');
        return true;
      } else {
        this.logger.error(
          'Clean build failed',
          `Fix clean issues before proceeding:\n${cleanResult.error}`
        );
        return false;
      }
    } catch (error) {
      this.logger.error(
        `Clean build validation failed: ${error.message}`,
        'Check Gradle configuration and Android project setup'
      );
      return false;
    }
  }

  async validateDependenciesResolution() {
    this.logger.log('Validating dependencies resolution...', 'info');
    
    try {
      // Test dependencies resolution
      const depsResult = await this.runGradleCommand(['app:dependencies', '--configuration', 'debugCompileClasspath'], { timeout: 120000 });
      
      if (depsResult.success) {
        // Check for common dependency conflicts
        const output = depsResult.output;
        
        if (output.includes('FAILED')) {
          this.logger.error(
            'Dependency resolution failures detected',
            'Review dependency conflicts and update versions'
          );
          return false;
        }

        if (output.includes('Could not resolve')) {
          this.logger.error(
            'Some dependencies could not be resolved',
            'Check internet connection and repository configurations'
          );
          return false;
        }

        // Check for React Native core conflicts
        if (output.includes('react-android') && output.includes('SNAPSHOT')) {
          this.logger.warning(
            'React Native SNAPSHOT versions detected',
            'Add dependency resolution strategy to force stable versions'
          );
        }

        this.logger.success('Dependencies resolved successfully');
        return true;
      } else {
        this.logger.error(
          'Dependencies resolution failed',
          `Fix dependency issues:\n${depsResult.error}`
        );
        return false;
      }
    } catch (error) {
      this.logger.error(
        `Dependencies validation failed: ${error.message}`,
        'Check network connectivity and Gradle configuration'
      );
      return false;
    }
  }

  async validateCompilation() {
    this.logger.log('Validating compilation process...', 'info');
    
    try {
      // Test compilation without building APK
      const compileResult = await this.runGradleCommand(['app:compileDebugJavaWithJavac'], { timeout: 300000 });
      
      if (compileResult.success) {
        this.logger.success('Java compilation completed successfully');
        
        // Test Kotlin compilation if present
        const kotlinResult = await this.runGradleCommand(['app:compileDebugKotlin'], { timeout: 180000 });
        if (kotlinResult.success || kotlinResult.output.includes('UP-TO-DATE')) {
          this.logger.success('Kotlin compilation completed successfully');
        }

        return true;
      } else {
        const output = compileResult.error;
        
        // Analyze compilation errors
        if (output.includes('package does not exist')) {
          this.logger.error(
            'Package import errors detected',
            'Fix import statements in Java/Kotlin files:\n1. Check React Native package imports\n2. Update to React Native 0.74.7 API\n3. Remove deprecated imports'
          );
        } else if (output.includes('cannot find symbol')) {
          this.logger.error(
            'Symbol resolution errors detected',
            'Fix symbol references:\n1. Update method signatures to match RN 0.74.7\n2. Check class name changes\n3. Update deprecated API usage'
          );
        } else if (output.includes('BuildConfig')) {
          this.logger.error(
            'BuildConfig generation errors detected',
            'Enable buildConfig feature:\n1. Add buildFeatures { buildConfig = true }\n2. Check BuildConfig field definitions\n3. Ensure proper package naming'
          );
        } else {
          this.logger.error(
            'Compilation failed with unknown errors',
            `Review compilation output and fix issues:\n${output}`
          );
        }
        
        return false;
      }
    } catch (error) {
      this.logger.error(
        `Compilation validation failed: ${error.message}`,
        'Check Java/Kotlin source files and dependencies'
      );
      return false;
    }
  }

  async validateApkGeneration() {
    this.logger.log('Validating APK generation process...', 'info');
    
    try {
      // Test APK build
      const apkResult = await this.runGradleCommand(['assembleDebug'], { timeout: 600000 });
      
      if (apkResult.success) {
        // Check if APK file was created
        const apkPath = path.join(this.androidRoot, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
        
        if (fs.existsSync(apkPath)) {
          const stats = fs.statSync(apkPath);
          const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
          
          if (stats.size < 1024 * 1024) { // Less than 1MB is suspicious
            this.logger.warning(
              `APK size is very small (${sizeInMB}MB)`,
              'Check if all assets and dependencies are included properly'
            );
          } else {
            this.logger.success(`APK generated successfully (${sizeInMB}MB)`);
          }
          
          return true;
        } else {
          this.logger.error(
            'APK file not found after successful build',
            'Check build output directory and build configuration'
          );
          return false;
        }
      } else {
        const output = apkResult.error;
        
        // Analyze APK build errors
        if (output.includes('Execution failed for task')) {
          const taskMatch = output.match(/Execution failed for task '([^']+)'/);
          if (taskMatch) {
            const failedTask = taskMatch[1];
            this.logger.error(
              `Build failed at task: ${failedTask}`,
              `Fix task-specific issues:\n1. Review task configuration\n2. Check dependencies for this task\n3. Verify build environment setup`
            );
          }
        } else if (output.includes('Duplicate class')) {
          this.logger.error(
            'Duplicate class errors detected',
            'Fix dependency conflicts:\n1. Check for conflicting library versions\n2. Add exclusion rules to dependencies\n3. Use dependency resolution strategies'
          );
        } else if (output.includes('OutOfMemoryError')) {
          this.logger.error(
            'Out of memory during build',
            'Increase build memory:\n1. Add org.gradle.jvmargs=-Xmx4g to gradle.properties\n2. Close other applications\n3. Use ./gradlew --no-daemon'
          );
        } else {
          this.logger.error(
            'APK generation failed',
            `Review build output and fix issues:\n${output}`
          );
        }
        
        return false;
      }
    } catch (error) {
      this.logger.error(
        `APK validation failed: ${error.message}`,
        'Check build environment and Android project configuration'
      );
      return false;
    }
  }

  async runGradleCommand(args, options = {}) {
    const { timeout = 300000 } = options;
    
    return new Promise((resolve) => {
      const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
      const gradlewPath = path.join(this.androidRoot, gradlew);
      
      this.logger.log(`Running: ${gradlew} ${args.join(' ')}`, 'info');
      
      const childProcess = spawn(gradlewPath, args, {
        cwd: this.androidRoot,
        stdio: 'pipe',
        shell: true
      });

      let output = '';
      let error = '';

      childProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      childProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      const timeoutId = setTimeout(() => {
        childProcess.kill();
        resolve({
          success: false,
          output: output,
          error: `Command timed out after ${timeout}ms`
        });
      }, timeout);

      childProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        resolve({
          success: code === 0,
          output: output,
          error: error
        });
      });

      childProcess.on('error', (err) => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          output: output,
          error: err.message
        });
      });
    });
  }
}

module.exports = ProcessValidator;