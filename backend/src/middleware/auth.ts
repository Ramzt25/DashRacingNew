import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../types';

export const authenticateUser = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    // Check for Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    // Extract and verify JWT token
    const token = authHeader.substring(7);
    const decoded = request.server.jwt.verify(token) as any;

    if (!decoded || !decoded.userId) {
      throw new Error('Invalid token payload');
    }

    // For now, create a mock user object
    // In production, you would fetch the user from database
    const user: User = {
      id: decoded.userId,
      username: decoded.username || 'Unknown User',
      email: decoded.email || '',
      preferences: {
        notifications: true,
        location: true,
        units: 'imperial',
        soundEnabled: true,
        vibrationEnabled: true,
      },
      stats: {
        totalRaces: 0,
        wins: 0,
        bestTime: null,
        totalDistance: 0,
        winRate: 0,
        racesWon: 0,
        bestLapTime: null,
        averageSpeed: 0,
      },
      isPro: false,
      createdAt: new Date(),
    };

    // Attach user to request
    request.user = user;
  } catch (error) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token',
      statusCode: 401,
    });
  }
};

export const optionalAuth = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      await authenticateUser(request, reply);
    }
  } catch (error) {
    // For optional auth, we don't fail if token is invalid
    // Don't set request.user to undefined, leave it as is
  }
};