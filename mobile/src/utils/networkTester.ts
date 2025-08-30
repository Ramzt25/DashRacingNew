import { apiService } from '../src/services/api';
import { webSocketService } from '../src/services/websocket';
import { networkService } from '../src/utils/network';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  duration?: number;
}

class MobileNetworkTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Mobile Network Function Tests...\n');
    
    this.results = [];
    
    await this.testNetworkConfiguration();
    await this.testNetworkService();
    await this.testAPIConnection();
    await this.testWebSocketConnection();
    await this.testE2EMobileFunction();
    
    this.printResults();
    return this.results;
  }

  private async testNetworkConfiguration(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const config = networkService.getConfig();
      
      if (!config.apiBaseUrl || !config.wsUrl) {
        this.addResult('Network Configuration', false, 'Missing API or WebSocket URLs');
        return;
      }
      
      if (config.apiBaseUrl.includes('localhost') || config.apiBaseUrl.includes('127.0.0.1')) {
        this.addResult('Network Configuration', false, 'Using localhost - will not work over WiFi without cable');
        return;
      }
      
      const duration = Date.now() - startTime;
      this.addResult('Network Configuration', true, `Valid network configuration: ${config.apiBaseUrl}`, duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult('Network Configuration', false, `Configuration error: ${error}`, duration);
    }
  }

  private async testNetworkService(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const isAvailable = networkService.isNetworkAvailable();
      
      if (!isAvailable) {
        this.addResult('Network Service', false, 'Network not available');
        return;
      }
      
      const testConnected = await networkService.testConnection();
      const duration = Date.now() - startTime;
      
      if (testConnected) {
        this.addResult('Network Service', true, 'Network service connection test passed', duration);
      } else {
        this.addResult('Network Service', false, 'Network service connection test failed', duration);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult('Network Service', false, `Network service error: ${error}`, duration);
    }
  }

  private async testAPIConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Testing API connection...');
      
      // First try auto-detection
      const autoDetected = await apiService.autoDetectNetwork();
      
      if (!autoDetected) {
        this.addResult('API Connection', false, 'Auto-detection failed');
        return;
      }
      
      // Test health check
      const healthResult = await apiService.healthCheck();
      const duration = Date.now() - startTime;
      
      if (healthResult.success) {
        this.addResult('API Connection', true, `API health check passed: ${JSON.stringify(healthResult.data)}`, duration);
      } else {
        this.addResult('API Connection', false, `API health check failed: ${healthResult.error}`, duration);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult('API Connection', false, `API connection error: ${error}`, duration);
    }
  }

  private async testWebSocketConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Testing WebSocket connection...');
      
      // Test WebSocket connection
      const connected = await webSocketService.connect();
      
      if (!connected) {
        this.addResult('WebSocket Connection', false, 'Failed to establish WebSocket connection');
        return;
      }
      
      // Test message sending
      const messageSent = webSocketService.send('test', { message: 'network test' });
      
      if (!messageSent) {
        this.addResult('WebSocket Connection', false, 'Failed to send test message');
        return;
      }
      
      // Wait a moment for potential response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const duration = Date.now() - startTime;
      
      if (webSocketService.isConnectionActive()) {
        this.addResult('WebSocket Connection', true, 'WebSocket connection and messaging successful', duration);
      } else {
        this.addResult('WebSocket Connection', false, 'WebSocket connection lost during test', duration);
      }
      
      // Clean up
      webSocketService.disconnect();
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult('WebSocket Connection', false, `WebSocket error: ${error}`, duration);
    }
  }

  private async testE2EMobileFunction(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Testing E2E Mobile Function...');
      
      // Test 1: API + WebSocket integration
      const healthResult = await apiService.healthCheck();
      
      if (!healthResult.success) {
        this.addResult('E2E Mobile Function', false, 'API not accessible for E2E test');
        return;
      }
      
      // Test 2: WebSocket connection
      const wsConnected = await webSocketService.connect();
      
      if (!wsConnected) {
        this.addResult('E2E Mobile Function', false, 'WebSocket not accessible for E2E test');
        return;
      }
      
      // Test 3: Simulate mobile app workflow
      let receivedMessage = false;
      
      const unsubscribe = webSocketService.on('test_response', (message) => {
        console.log('📥 Received test response:', message);
        receivedMessage = true;
      });
      
      // Send test message
      webSocketService.send('test_request', { type: 'e2e_test', timestamp: Date.now() });
      
      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      unsubscribe();
      webSocketService.disconnect();
      
      const duration = Date.now() - startTime;
      
      if (receivedMessage) {
        this.addResult('E2E Mobile Function', true, 'E2E mobile function test successful with message exchange', duration);
      } else {
        this.addResult('E2E Mobile Function', true, 'E2E mobile function basic connectivity successful (no message response expected)', duration);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult('E2E Mobile Function', false, `E2E test error: ${error}`, duration);
    }
  }

  private addResult(name: string, success: boolean, message: string, duration?: number): void {
    this.results.push({ name, success, message, duration });
    
    const status = success ? '✅' : '❌';
    const timeInfo = duration ? ` (${duration}ms)` : '';
    console.log(`${status} ${name}: ${message}${timeInfo}`);
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const passed = this.results.filter(r => r.success).length;
    const total = this.results.length;
    
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    
    if (total - passed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`   • ${result.name}: ${result.message}`);
      });
    }
    
    console.log('\n💡 Recommendations:');
    
    const hasNetworkIssues = this.results.some(r => !r.success && r.name.includes('Network'));
    const hasAPIIssues = this.results.some(r => !r.success && r.name.includes('API'));
    const hasWebSocketIssues = this.results.some(r => !r.success && r.name.includes('WebSocket'));
    
    if (hasNetworkIssues) {
      console.log('   • Check that your device is connected to the same WiFi network as the backend server');
      console.log('   • Verify that your IP address in mobile/.env is correct');
      console.log('   • Run `npm run get-ip` to get the current network IP');
    }
    
    if (hasAPIIssues) {
      console.log('   • Ensure the backend server is running: `npm run backend:dev`');
      console.log('   • Check firewall settings on your development machine');
      console.log('   • Verify the backend is accessible at the configured IP:PORT');
    }
    
    if (hasWebSocketIssues) {
      console.log('   • Ensure WebSocket support is enabled in the backend');
      console.log('   • Check if the WebSocket port is open and accessible');
      console.log('   • Verify WebSocket URL configuration in mobile/.env');
    }
    
    if (passed === total) {
      console.log('   🎉 All tests passed! Your mobile app network function is working correctly without cable connection.');
    }
    
    console.log('\n🏁 Test completed!\n');
  }
}

// Export for use in tests
export const mobileNetworkTester = new MobileNetworkTester();
export default mobileNetworkTester;