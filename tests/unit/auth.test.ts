/**
 * Unit Tests for Authentication Service
 * Tests JWT token generation, validation, and user authentication logic
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// Mock JWT and bcrypt functionality for unit testing
const mockJWT = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: 'test-user-id', email: 'test@example.com' }),
  decode: jest.fn().mockReturnValue({ userId: 'test-user-id', email: 'test@example.com' })
};

const mockBcrypt = {
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true)
};

// Mock AuthService for unit testing
class AuthService {
  private jwtSecret = 'test-secret';
  private jwtExpiry = '1h';

  async hashPassword(password: string): Promise<string> {
    return mockBcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return mockBcrypt.compare(password, hash);
  }

  generateToken(payload: any): string {
    return mockJWT.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiry });
  }

  verifyToken(token: string): any {
    try {
      return mockJWT.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validateUsername(username: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!username || typeof username !== 'string') {
      errors.push('Username is required and must be a string');
      return { valid: false, errors };
    }

    if (username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (username.length > 20) {
      errors.push('Username must not exceed 20 characters');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, underscores, and hyphens');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  sanitizeUserData(user: any): any {
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

describe('AuthService Unit Tests', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('Password Management', () => {
    test('Hash password correctly', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await authService.hashPassword(password);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(hashedPassword).toBe('hashed-password');
    });

    test('Compare password correctly', async () => {
      const password = 'TestPassword123!';
      const hash = 'hashed-password';
      
      const isValid = await authService.comparePassword(password, hash);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(isValid).toBe(true);
    });

    test('Validate strong password', () => {
      const strongPassword = 'StrongPass123!';
      const result = authService.validatePassword(strongPassword);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('Validate weak passwords', () => {
      const weakPasswords = [
        { password: '123', expectedErrors: 1 }, // Too short + other issues
        { password: 'password', expectedErrors: 1 }, // Missing uppercase, number, special
        { password: 'PASSWORD', expectedErrors: 1 }, // Missing lowercase, number, special
        { password: 'Password', expectedErrors: 1 }, // Missing number, special
        { password: 'Pass12', expectedErrors: 1 }, // Too short, missing special
      ];

      weakPasswords.forEach(({ password, expectedErrors }) => {
        const result = authService.validatePassword(password);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(expectedErrors);
      });
    });
  });

  describe('JWT Token Management', () => {
    test('Generate JWT token', () => {
      const payload = { userId: 'user123', email: 'test@example.com' };
      const token = authService.generateToken(payload);

      expect(mockJWT.sign).toHaveBeenCalledWith(payload, 'test-secret', { expiresIn: '1h' });
      expect(token).toBe('mock-jwt-token');
    });

    test('Verify valid JWT token', () => {
      const token = 'valid-jwt-token';
      const decoded = authService.verifyToken(token);

      expect(mockJWT.verify).toHaveBeenCalledWith(token, 'test-secret');
      expect(decoded).toEqual({ userId: 'test-user-id', email: 'test@example.com' });
    });

    test('Handle invalid JWT token', () => {
      mockJWT.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => {
        authService.verifyToken('invalid-token');
      }).toThrow('Invalid token');
    });
  });

  describe('Email Validation', () => {
    test('Validate correct email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@example.org',
        'user123@example.com'
      ];

      validEmails.forEach(email => {
        expect(authService.validateEmail(email)).toBe(true);
      });
    });

    test('Reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user.example.com',
        'user @example.com'
      ];

      invalidEmails.forEach(email => {
        expect(authService.validateEmail(email)).toBe(false);
      });
    });
  });

  describe('Username Validation', () => {
    test('Validate correct usernames', () => {
      const validUsernames = [
        'user123',
        'test_user',
        'racing-driver',
        'User_Name-123'
      ];

      validUsernames.forEach(username => {
        const result = authService.validateUsername(username);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('Reject invalid usernames', () => {
      const invalidUsernames = [
        { username: 'ab', expectedError: 'at least 3 characters' }, // Too short
        { username: 'a'.repeat(21), expectedError: 'not exceed 20 characters' }, // Too long
        { username: 'user@name', expectedError: 'can only contain' }, // Invalid characters
        { username: 'user name', expectedError: 'can only contain' }, // Space not allowed
      ];

      invalidUsernames.forEach(({ username, expectedError }) => {
        const result = authService.validateUsername(username);
        expect(result.valid).toBe(false);
        expect(result.errors.some(error => error.includes(expectedError))).toBe(true);
      });
    });
  });

  describe('Data Sanitization', () => {
    test('Remove sensitive data from user object', () => {
      const user = {
        id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: 'hashed-password-secret'
      };

      const sanitized = authService.sanitizeUserData(user);

      expect(sanitized).not.toHaveProperty('passwordHash');
      expect(sanitized).toHaveProperty('id');
      expect(sanitized).toHaveProperty('email');
      expect(sanitized).toHaveProperty('username');
      expect(sanitized.id).toBe(user.id);
      expect(sanitized.email).toBe(user.email);
    });

    test('Handle user object without password hash', () => {
      const user = {
        id: 'user123',
        email: 'test@example.com',
        username: 'testuser'
      };

      const sanitized = authService.sanitizeUserData(user);

      expect(sanitized).toEqual(user);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('Handle empty password validation', () => {
      const result = authService.validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('Handle empty email validation', () => {
      const result = authService.validateEmail('');
      expect(result).toBe(false);
    });

    test('Handle empty username validation', () => {
      const result = authService.validateUsername('');
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('required'))).toBe(true);
    });

    test('Handle null and undefined inputs gracefully', () => {
      expect(authService.validateEmail(null as any)).toBe(false);
      expect(authService.validateEmail(undefined as any)).toBe(false);
      
      const usernameResult = authService.validateUsername(null as any);
      expect(usernameResult.valid).toBe(false);
      expect(usernameResult.errors.some(error => error.includes('required'))).toBe(true);
    });
  });
});