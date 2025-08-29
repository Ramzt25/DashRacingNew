const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BuildLogger {
  constructor(verbose = true) {
    this.verbose = verbose;
    this.errors = [];
    this.warnings = [];
    this.fixes = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '💡',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      fix: '🔧'
    }[type] || 'ℹ️';

    const output = `[${timestamp}] ${prefix} ${message}`;
    
    if (this.verbose) {
      console.log(output);
    }

    switch (type) {
      case 'error':
        this.errors.push(message);
        break;
      case 'warning':
        this.warnings.push(message);
        break;
      case 'fix':
        this.fixes.push(message);
        break;
    }
  }

  error(message, fix = null) {
    this.log(message, 'error');
    if (fix) {
      this.log(`FIX: ${fix}`, 'fix');
    }
  }

  warning(message, suggestion = null) {
    this.log(message, 'warning');
    if (suggestion) {
      this.log(`SUGGESTION: ${suggestion}`, 'fix');
    }
  }

  success(message) {
    this.log(message, 'success');
  }

  getSummary() {
    return {
      errors: this.errors.length,
      warnings: this.warnings.length,
      fixes: this.fixes.length,
      details: {
        errors: this.errors,
        warnings: this.warnings,
        fixes: this.fixes
      }
    };
  }

  addFix(message) {
    this.fixes.push(`🔧 ${message}`);
    if (this.verboseMode) {
      console.log(`[${new Date().toISOString()}] 🔧 ${message}`);
    }
  }

  printSummary() {
    const summary = this.getSummary();
    console.log('\n' + '='.repeat(60));
    console.log('BUILD VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`❌ Errors: ${summary.errors}`);
    console.log(`⚠️  Warnings: ${summary.warnings}`);
    console.log(`🔧 Fixes Available: ${summary.fixes}`);
    
    if (summary.errors > 0) {
      console.log('\n🚨 CRITICAL ISSUES FOUND:');
      summary.details.errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    }

    if (summary.fixes.length > 0) {
      console.log('\n🔧 RESOLUTION STEPS:');
      summary.details.fixes.forEach((fix, i) => {
        console.log(`${i + 1}. ${fix}`);
      });
    }

    console.log('='.repeat(60));
    return summary.errors === 0;
  }
}

module.exports = BuildLogger;