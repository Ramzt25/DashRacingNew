import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import vehicleRoutes from './routes/vehicles';
import raceRoutes from './routes/races';
import meetupRoutes from './routes/meetups';
import friendRoutes from './routes/friends';
import uploadRoutes from './routes/uploads';
import aiRoutes from './routes/ai';

// Import middleware
import { authenticateUser } from './middleware/auth';
import { authenticateWebSocket } from './middleware/wsAuth';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';

// Import services
import { SupabaseService } from './services/database';
import { WebSocketService } from './services/websocket';

// Import types
import { User } from './types';

// Extend Fastify types
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: User;
  }
}

class DashRacingServer {
  private fastify: FastifyInstance;
  private supabaseService: SupabaseService;
  private wsService: WebSocketService;

  constructor() {
    this.fastify = Fastify({
      logger: process.env.NODE_ENV === 'development' ? {
        level: process.env.LOG_LEVEL || 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      } : {
        level: process.env.LOG_LEVEL || 'info',
      },
      bodyLimit: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
    });

    this.supabaseService = new SupabaseService();
    this.wsService = new WebSocketService();
  }

  private async registerPlugins(): Promise<void> {
    // Security plugins
    await this.fastify.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    });

    // CORS configuration
    await this.fastify.register(cors, {
      origin: (origin, callback) => {
        const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'), false);
        }
      },
      credentials: true,
    });

    // Rate limiting (more lenient for testing)
    await this.fastify.register(rateLimit, {
      max: parseInt(process.env.RATE_LIMIT_MAX || '1000'), // Increased for testing
      timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'), // 1 minute window
      errorResponseBuilder: () => ({
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later.',
        statusCode: 429,
      }),
    });

    // File upload support
    await this.fastify.register(multipart, {
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
      },
    });

    // JWT authentication
    await this.fastify.register(jwt, {
      secret: process.env.JWT_SECRET || 'fallback-secret-key-change-this',
      sign: {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      },
    });

    // WebSocket support
    await this.fastify.register(websocket);
  }

  private registerMiddleware(): void {
    // Request logging
    this.fastify.addHook('onRequest', requestLogger);

    // Authentication decorator
    this.fastify.decorate('authenticate', authenticateUser);

    // WebSocket service decorator
    this.fastify.decorate('wsService', this.wsService);

    // Database service decorator
    this.fastify.decorate('supabaseService', this.supabaseService);

    // Error handler
    this.fastify.setErrorHandler(errorHandler);
  }

  private async registerRoutes(): Promise<void> {
    // Health check
    this.fastify.get('/health', async () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    }));

    // API info
    this.fastify.get('/api/info', async () => ({
      name: 'DASH RACING API',
      version: '1.0.0',
      description: 'High-performance racing app backend API',
      environment: process.env.NODE_ENV || 'development',
    }));

    // API routes
    await this.fastify.register(authRoutes, { prefix: '/api/auth' });
    await this.fastify.register(userRoutes, { prefix: '/api/users' });
    await this.fastify.register(vehicleRoutes, { prefix: '/api/vehicles' });
    await this.fastify.register(raceRoutes, { prefix: '/api/races' });
    await this.fastify.register(meetupRoutes, { prefix: '/api/meetups' });
    await this.fastify.register(friendRoutes, { prefix: '/api/friends' });
    await this.fastify.register(uploadRoutes, { prefix: '/api/uploads' });
    await this.fastify.register(aiRoutes, { prefix: '/api/ai' });

    // WebSocket routes
    this.fastify.register(async (fastify) => {
      // Main WebSocket endpoint for general connections (what tests expect)
      fastify.get('/', { websocket: true }, async (connection, request) => {
        try {
          await authenticateWebSocket(request);
          await this.wsService.handleMainConnection(connection, request);
        } catch (error) {
          console.error('WebSocket authentication failed:', error);
          connection.close(1008, 'Authentication failed');
        }
      });

      // Specific WebSocket endpoints for different features
      fastify.get('/ws/races', { websocket: true }, async (connection, request) => {
        try {
          await authenticateWebSocket(request);
          await this.wsService.handleRaceConnection(connection, request);
        } catch (error) {
          console.error('Race WebSocket authentication failed:', error);
          connection.close(1008, 'Authentication failed');
        }
      });

      fastify.get('/ws/location', { websocket: true }, async (connection, request) => {
        try {
          await authenticateWebSocket(request);
          await this.wsService.handleLocationConnection(connection, request);
        } catch (error) {
          console.error('Location WebSocket authentication failed:', error);
          connection.close(1008, 'Authentication failed');
        }
      });

      fastify.get('/ws/notifications', { websocket: true }, async (connection, request) => {
        try {
          await authenticateWebSocket(request);
          await this.wsService.handleNotificationConnection(connection, request);
        } catch (error) {
          console.error('Notification WebSocket authentication failed:', error);
          connection.close(1008, 'Authentication failed');
        }
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Initialize database connection
      await this.supabaseService.initialize();

      // Register plugins, middleware, and routes
      await this.registerPlugins();
      this.registerMiddleware();
      await this.registerRoutes();

      // Start the server
      const port = parseInt(process.env.PORT || '3000');
      const host = process.env.HOST || '0.0.0.0';

      await this.fastify.listen({ port, host });
      
      console.log(`🏁 DASH RACING API Server running on http://${host}:${port}`);
      console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://${host}:${port}/health`);
      console.log(`🌐 Network access enabled - mobile devices can connect via local IP`);
      
      // Initialize WebSocket service
      this.wsService.initialize();
      
    } catch (error) {
      this.fastify.log.error(error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.fastify.close();
      console.log('🛑 DASH RACING API Server stopped');
    } catch (error) {
      console.error('Error stopping server:', error);
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
const server = new DashRacingServer();

process.on('SIGINT', async () => {
  console.log('\\n🛑 Received SIGINT, shutting down gracefully...');
  await server.stop();
});

process.on('SIGTERM', async () => {
  console.log('\\n🛑 Received SIGTERM, shutting down gracefully...');
  await server.stop();
});

// Start the server
if (require.main === module) {
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default server;