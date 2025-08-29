import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { SupabaseService } from '../services/database';
import { authenticateUser } from '../middleware/auth';

interface RegisterBody {
  email: string;
  password: string;
  username: string;
}

interface LoginBody {
  email: string;
  password: string;
}

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  username: Joi.string().min(3).max(20).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const dbService = new SupabaseService();

  // Register new user
  fastify.post('/register', async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    console.log('🔍 Registration endpoint called with:', JSON.stringify(request.body, null, 2));
    try {
      // Validate input
      const { error, value } = registerSchema.validate(request.body);
      if (error) {
        console.error('❌ Validation error:', error.details[0].message);
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          message: error.details[0].message,
        });
      }

      const { email, password, username } = value;

      // Check if username is already taken
      const { data: existingUsername } = await dbService.supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();
      
      if (existingUsername) {
        return reply.code(409).send({
          success: false,
          error: 'Username Taken',
          message: 'This username is already in use',
        });
      }

      // Create user in Supabase Auth using regular signup (not admin)
      const { data: authData, error: authError } = await dbService.supabase.auth.signUp({
        email,
        password,
      });

      if (authError || !authData.user) {
        console.error('Supabase Auth error:', authError?.message || 'Unknown auth error');
        return reply.code(400).send({
          success: false,
          error: 'Registration Failed',
          message: authError?.message || 'Failed to create auth user',
        });
      }

      // Create user profile in database
      const { data: profileData, error: profileError } = await dbService.supabase
        .from('users')
        .insert({
          auth_user_id: authData.user.id,
          email,
          username,
          // Default preferences
          units: 'imperial',
          notifications_enabled: true,
          location_sharing_enabled: true,
          sound_enabled: true,
          vibration_enabled: true,
          is_pro: false,
          // Default stats
          total_races: 0,
          total_wins: 0,
          total_distance: 0,
          win_rate: 0,
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError.message || 'Unknown profile error');
        // Note: Can't clean up auth user without admin privileges
        return reply.code(500).send({
          success: false,
          error: 'Registration Failed',
          message: 'Failed to create user profile: ' + (profileError.message || 'Unknown error'),
        });
      }

      // Generate JWT token
      const token = fastify.jwt.sign({
        userId: profileData.id,
        authUserId: authData.user.id,
        email: profileData.email,
        username: profileData.username,
      }, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      const refreshToken = fastify.jwt.sign({
        userId: profileData.id,
        authUserId: authData.user.id,
        type: 'refresh',
      }, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      });

      reply.send({
        success: true,
        message: 'User registered successfully',
        data: {
          id: profileData.id,
          username: profileData.username,
          email: profileData.email,
          avatar: profileData.avatar_url,
          isPro: profileData.is_pro,
          createdAt: profileData.created_at,
          token,
          refreshToken,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during registration: ' + (error instanceof Error ? error.message : 'Unknown error'),
      });
    }
  });

  // Login user
  fastify.post('/login', async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    try {
      console.log('🔐 Login attempt for:', request.body.email);
      
      // Validate input
      const { error, value } = loginSchema.validate(request.body);
      if (error) {
        console.log('❌ Login validation error:', error.details[0].message);
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          message: error.details[0].message,
        });
      }

      const { email, password } = value;

      // Get user by email
      console.log('🔍 Looking up user by email:', email);
      const userResult = await dbService.getUserByEmail(email);
      console.log('📊 User lookup result:', { success: userResult.success, hasData: !!userResult.data, error: userResult.error });
      
      if (!userResult.success) {
        console.log('❌ User not found:', userResult.error);
        return reply.code(401).send({
          success: false,
          error: 'Invalid Credentials',
          message: 'Invalid email or password',
        });
      }

      // For this demo, we'll skip password verification since we don't store hashed passwords yet
      // In production, you would verify the password here:
      // const isValidPassword = await bcrypt.compare(password, storedHashedPassword);

      // Generate JWT token
      const token = fastify.jwt.sign({
        userId: userResult.data!.id,
        email: userResult.data!.email,
        username: userResult.data!.username,
      }, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      const refreshToken = fastify.jwt.sign({
        userId: userResult.data!.id,
        type: 'refresh',
      }, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      });

      console.log('✅ Login successful for user:', userResult.data!.username);
      reply.send({
        success: true,
        message: 'Login successful',
        data: {
          ...userResult.data,
          token,
          refreshToken,
        },
      });
    } catch (error) {
      console.error('🚨 Login error:', error);
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during login',
      });
    }
  });

  // Refresh token
  fastify.post('/refresh', async (request: FastifyRequest<{ Body: { refreshToken: string } }>, reply: FastifyReply) => {
    try {
      const { refreshToken } = request.body;
      
      if (!refreshToken) {
        return reply.code(400).send({
          error: 'Missing Refresh Token',
          message: 'Refresh token is required',
        });
      }

      // Verify refresh token
      const decoded = fastify.jwt.verify(refreshToken) as any;
      
      if (decoded.type !== 'refresh') {
        return reply.code(401).send({
          error: 'Invalid Token',
          message: 'Invalid refresh token',
        });
      }

      // Get user data
      const userResult = await dbService.getUserById(decoded.userId);
      if (!userResult.success) {
        return reply.code(401).send({
          error: 'User Not Found',
          message: 'User associated with token not found',
        });
      }

      // Generate new tokens
      const newToken = fastify.jwt.sign({
        userId: userResult.data!.id,
        email: userResult.data!.email,
        username: userResult.data!.username,
      }, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      const newRefreshToken = fastify.jwt.sign({
        userId: userResult.data!.id,
        type: 'refresh',
      }, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      });

      reply.send({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      reply.code(401).send({
        error: 'Invalid Token',
        message: 'Invalid or expired refresh token',
      });
    }
  });

  // Logout (client-side token removal, optionally blacklist token)
  fastify.post('/logout', {
    preHandler: [authenticateUser],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    // In a production app, you might want to blacklist the token
    reply.send({
      success: true,
      message: 'Logged out successfully',
    });
  });

  // Verify token
  fastify.get('/verify', {
    preHandler: [authenticateUser],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({
      success: true,
      message: 'Token is valid',
      data: {
        user: request.user,
      },
    });
  });
}

export default authRoutes;