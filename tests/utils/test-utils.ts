/**
 * Test Utilities
 * Helper functions for E2E testing including rate limiting protection
 */

export class TestUtils {
  private static requestCount = 0;
  private static lastRequestTime = 0;
  
  /**
   * Add delay between requests to prevent rate limiting
   */
  static async rateLimitDelay(minDelay = 100): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Increment request count
    this.requestCount++;
    
    // Add progressive delay based on request count
    let delay = minDelay;
    if (this.requestCount > 5) {
      delay = 500; // Longer delay after 5 requests
    }
    if (this.requestCount > 10) {
      delay = 1000; // Even longer delay after 10 requests
    }
    
    // Ensure minimum time between requests
    if (timeSinceLastRequest < delay) {
      const waitTime = delay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }
  
  /**
   * Reset rate limiting counters (call between test suites)
   */
  static resetRateLimit(): void {
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }
  
  /**
   * Generate a test user with unique data and proper length constraints
   */
  static generateTestUser(prefix = 'test'): {
    email: string;
    username: string;
    password: string;
  } {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    
    // Keep username under 20 characters (max validation limit)
    const shortId = `${timestamp}`.slice(-6) + `${random}`.slice(-3); // Last 6 digits of timestamp + last 3 of random
    
    return {
      email: `${prefix}${timestamp}${random}@gmail.com`, // Use gmail.com for Supabase compatibility
      username: `${prefix}${shortId}`, // Max length: test + 9 digits = 13 chars (well under 20)
      password: 'TestPassword123!'
    };
  }
  
  /**
   * Wait for a specific condition with timeout
   */
  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout = 5000,
    interval = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }
  
  /**
   * Cleanup test data (implement as needed)
   */
  static async cleanup(): Promise<void> {
    // Add cleanup logic here if needed
    // For now, just reset rate limiting
    this.resetRateLimit();
  }
}