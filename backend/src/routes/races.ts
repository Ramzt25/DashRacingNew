import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Joi from 'joi';
import { SupabaseService } from '../services/database';
import { authenticateUser } from '../middleware/auth';

interface RaceBody {
  name: string;
  description?: string;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  maxParticipants: number;
  entryFee?: number;
  prizePool?: number;
  startTime: string;
  raceType?: string;
}

interface LocationUpdate {
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
}

interface FinishData {
  finishTime: string;
  totalTime: number;
  averageSpeed: number;
}

const raceSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  startLocation: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  }).required(),
  endLocation: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  }).required(),
  maxParticipants: Joi.number().integer().min(1).max(100).required(),
  entryFee: Joi.number().min(0).optional(),
  prizePool: Joi.number().min(0).optional(),
  startTime: Joi.string().isoDate().required(),
  raceType: Joi.string().valid('drag', 'circuit', 'drift', 'time-trial', 'street').optional(),
});

const locationSchema = Joi.object({
  lat: Joi.number().required(),
  lng: Joi.number().required(),
  speed: Joi.number().min(0).optional(),
  heading: Joi.number().min(0).max(360).optional(),
});

const finishSchema = Joi.object({
  finishTime: Joi.string().isoDate().required(),
  totalTime: Joi.number().min(0).required(),
  averageSpeed: Joi.number().min(0).required(),
});

async function raceRoutes(fastify: FastifyInstance): Promise<void> {
  const dbService = new SupabaseService();

  // GET /api/races - List all available races
  fastify.get('/', {
    preHandler: [authenticateUser],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await dbService.getAllRaces();
      
      if (result.success) {
        reply.send({ 
          success: true, 
          data: { races: result.data || [] }
        });
      } else {
        reply.status(500).send({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error) {
      reply.status(500).send({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  });

  // GET /api/races/:id - Get specific race
  fastify.get('/:id', {
    preHandler: [authenticateUser],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const result = await dbService.getRace(id);
      
      if (result.success) {
        reply.send({ 
          success: true, 
          data: { race: result.data }
        });
      } else {
        reply.status(404).send({ 
          success: false, 
          error: 'Race not found' 
        });
      }
    } catch (error) {
      reply.status(500).send({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  });

  // POST /api/races - Create race
  fastify.post('/', {
    preHandler: [authenticateUser],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { error: validationError } = raceSchema.validate(request.body);
      if (validationError) {
        reply.status(400).send({ 
          success: false, 
          error: validationError.details[0].message 
        });
        return;
      }

      const user = (request as any).user;
      const body = request.body as RaceBody;
      
      const raceData = {
        name: body.name,
        description: body.description || '',
        createdBy: user.id,
        startLocation: body.startLocation,
        endLocation: body.endLocation,
        maxParticipants: body.maxParticipants,
        entryFee: body.entryFee || 0,
        prizePool: body.prizePool || 0,
        startTime: new Date(body.startTime),
        raceType: body.raceType || 'street',
        status: 'pending' as const,
        participants: [] as any[],
      };

      const result = await dbService.createRace(raceData);
      
      if (result.success) {
        reply.status(201).send({ 
          success: true, 
          data: { race: result.data }
        });
      } else {
        reply.status(500).send({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error) {
      reply.status(500).send({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  });

  // POST /api/races/:id/join - Join race
  fastify.post('/:id/join', {
    preHandler: [authenticateUser],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { id: raceId } = request.params as any;
      
      const result = await dbService.joinRace(raceId, user.id);
      
      if (result.success) {
        reply.send({ 
          success: true, 
          message: 'Successfully joined race',
          data: result.data
        });
      } else {
        const status = result.error?.includes('full') ? 409 : 
                      result.error?.includes('already') ? 409 : 500;
        reply.status(status).send({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error) {
      reply.status(500).send({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  });

  // POST /api/races/:id/leave - Leave race
  fastify.post('/:id/leave', {
    preHandler: [authenticateUser],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { id: raceId } = request.params as any;
      
      const result = await dbService.leaveRace(raceId, user.id);
      
      if (result.success) {
        reply.send({ 
          success: true, 
          message: 'Successfully left race',
          data: result.data
        });
      } else {
        reply.status(404).send({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error) {
      reply.status(500).send({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  });

  // POST /api/races/:id/start - Start race
  fastify.post('/:id/start', {
    preHandler: [authenticateUser],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { id: raceId } = request.params as any;
      
      const result = await dbService.startRace(raceId, user.id);
      
      if (result.success) {
        // Send WebSocket notification to all race participants
        const wsService = (fastify as any).wsService;
        if (wsService) {
          wsService.sendRaceStartedNotification(raceId);
        }
        
        reply.send({ 
          success: true, 
          message: 'Race started successfully',
          data: result.data
        });
      } else {
        reply.status(403).send({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error) {
      reply.status(500).send({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  });

  // POST /api/races/:id/location - Update location during race
  fastify.post('/:id/location', {
    preHandler: [authenticateUser],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { error: validationError } = locationSchema.validate(request.body);
      if (validationError) {
        reply.status(400).send({ 
          success: false, 
          error: validationError.details[0].message 
        });
        return;
      }

      const user = (request as any).user;
      const { id: raceId } = request.params as any;
      const locationData = request.body as LocationUpdate;
      
      const result = await dbService.updateRaceLocation(raceId, user.id, locationData);
      
      if (result.success) {
        // Send WebSocket location update to other race participants
        const wsService = (fastify as any).wsService;
        if (wsService) {
          wsService.sendLocationUpdate(raceId, user.id, {
            lat: locationData.lat,
            lng: locationData.lng,
            heading: locationData.heading,
            speed: locationData.speed
          });
        }
        
        reply.send({ 
          success: true, 
          message: 'Location updated successfully',
          data: result.data
        });
      } else {
        reply.status(404).send({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error) {
      reply.status(500).send({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  });

  // POST /api/races/:id/finish - Finish race
  fastify.post('/:id/finish', {
    preHandler: [authenticateUser],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { error: validationError } = finishSchema.validate(request.body);
      if (validationError) {
        reply.status(400).send({ 
          success: false, 
          error: validationError.details[0].message 
        });
        return;
      }

      const user = (request as any).user;
      const { id: raceId } = request.params as any;
      const finishData = request.body as FinishData;
      
      const result = await dbService.finishRace(raceId, user.id, finishData);
      
      if (result.success) {
        // Send WebSocket notification to all race participants about completion
        const wsService = (fastify as any).wsService;
        if (wsService) {
          wsService.sendRaceCompletedNotification(raceId, result.data);
        }
        
        reply.send({ 
          success: true, 
          message: 'Race finished successfully',
          data: { result: result.data }
        });
      } else {
        reply.status(404).send({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error) {
      reply.status(500).send({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  });

  // GET /api/races/nearby - Get nearby races (keeping legacy endpoint)
  fastify.get('/nearby', {
    preHandler: [authenticateUser],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { lat, lng, radius } = request.query as any;
      
      if (!lat || !lng) {
        reply.status(400).send({ 
          success: false, 
          error: 'lat and lng query parameters required' 
        });
        return;
      }
      
      const result = await dbService.getNearbyRaces(
        parseFloat(lat), 
        parseFloat(lng), 
        radius ? parseFloat(radius) : 50
      );
      
      if (result.success) {
        reply.send({ 
          success: true, 
          data: { races: result.data || [] }
        });
      } else {
        reply.status(500).send({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error) {
      reply.status(500).send({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  });

  // GET /api/races/my-races - Get user's races
  fastify.get('/my-races', {
    preHandler: [authenticateUser],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const result = await dbService.getUserRaces(user.id);
      
      if (result.success) {
        reply.send({ 
          success: true, 
          data: { races: result.data || [] }
        });
      } else {
        reply.status(500).send({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error) {
      reply.status(500).send({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  });

  // POST /api/races/:id/invite - Invite user to race
  fastify.post('/:id/invite', {
    preHandler: [authenticateUser],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { id: raceId } = request.params as any;
      const { username } = request.body as any;
      
      // Get race details first
      const raceResult = await dbService.getRace(raceId);
      if (!raceResult.success || !raceResult.data) {
        reply.status(404).send({ 
          success: false, 
          error: 'Race not found' 
        });
        return;
      }
      
      // Look up the target user by username
      const supabaseService = (fastify as any).supabaseService;
      if (!supabaseService) {
        reply.status(500).send({ success: false, error: 'Database service not available' });
        return;
      }
      
      // Find user by username
      const { data: users } = await supabaseService.supabase
        .from('users')
        .select('id, username, email')
        .eq('username', username)
        .limit(1);
      
      if (!users || users.length === 0) {
        reply.status(404).send({ success: false, error: 'User not found' });
        return;
      }
      
      const targetUser = users[0];
      
      // Send WebSocket race invitation
      const wsService = (fastify as any).wsService;
      if (wsService) {
        wsService.sendRaceInvitation(targetUser.id, raceResult.data, {
          id: user.id,
          username: user.username,
          email: user.email
        });
      }
      
      reply.send({ 
        success: true, 
        message: 'Race invitation sent',
        data: {
          invitedUser: targetUser.username,
          race: raceResult.data
        }
      });
    } catch (error) {
      console.error('Race invite error:', error);
      reply.status(500).send({ 
        success: false, 
        error: 'Failed to send race invitation' 
      });
    }
  });
}

export default raceRoutes;