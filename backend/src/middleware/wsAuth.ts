import { FastifyRequest } from 'fastify';

export const authenticateWebSocket = async (request: FastifyRequest): Promise<void> => {
  try {
    // Get token from query parameter
    const token = (request.query as any)?.token;
    
    if (!token) {
      throw new Error('No authentication token provided');
    }

    // Verify JWT token using Fastify's JWT
    const decoded = request.server.jwt.verify(token) as any;

    if (!decoded || !decoded.userId) {
      throw new Error('Invalid token payload');
    }

    // Create user object from token
    const user = {
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
    (request as any).user = user;
  } catch (error) {
    throw new Error(`WebSocket authentication failed: ${(error as Error).message}`);
  }
};