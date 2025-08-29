import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Joi from 'joi';
import { SupabaseService } from '../services/database';
import { authenticateUser } from '../middleware/auth';

interface VehicleBody {
  name: string;
  make: string;
  model: string;
  year: number;
  imageUrl?: string;
  color?: string;
  specs?: any;
}

const vehicleSchema = Joi.object({
  name: Joi.string().required(),
  make: Joi.string().required(),
  model: Joi.string().required(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).required(),
  imageUrl: Joi.string().uri().optional(),
  color: Joi.string().optional(),
  specs: Joi.object().optional(),
});

async function vehicleRoutes(fastify: FastifyInstance): Promise<void> {
  const dbService = new SupabaseService();

  // GET /api/vehicles - Get user vehicles
  fastify.get('/', {
    preHandler: [authenticateUser],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const query = request.query as any;
      
      // Extract filter parameters
      const filters: any = {
        make: query.make,
        model: query.model,
        year: query.year,
        color: query.color,
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const result = await dbService.getUserVehicles(user.id, Object.keys(filters).length > 0 ? filters : undefined);
      
      if (result.success) {
        reply.send({ 
          success: true, 
          data: { vehicles: result.data }
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

  // GET /api/vehicles/:id - Get specific vehicle
  fastify.get('/:id', {
    preHandler: [authenticateUser],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { id } = request.params as any;
      
      const result = await dbService.getVehicle(id);
      
      if (result.success) {
        // Check if vehicle belongs to user
        if (result.data?.userId !== user.id) {
          reply.status(403).send({ 
            success: false, 
            error: 'Access denied' 
          });
          return;
        }
        
        reply.send({ 
          success: true, 
          data: { vehicle: result.data }
        });
      } else {
        reply.status(404).send({ 
          success: false, 
          error: 'Vehicle not found' 
        });
      }
    } catch (error) {
      reply.status(500).send({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  });

  // POST /api/vehicles - Create vehicle
  fastify.post('/', {
    preHandler: [authenticateUser],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { error: validationError } = vehicleSchema.validate(request.body);
      if (validationError) {
        reply.status(400).send({ 
          success: false, 
          error: validationError.details[0].message 
        });
        return;
      }

      const user = (request as any).user;
      const body = request.body as VehicleBody;
      const vehicleData = {
        ...body,
        userId: user.id,
        specs: body.specs || {},
        isSelected: false,
      };

      const result = await dbService.createVehicle(vehicleData);
      
      if (result.success) {
        reply.status(201).send({ 
          success: true, 
          data: { vehicle: result.data }
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

  // PUT /api/vehicles/:id/performance - Update vehicle performance data (must be before /:id)
  fastify.put('/:id/performance', {
    preHandler: [authenticateUser],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { id } = request.params as any;
      const performanceData = request.body as any;
      
      // Check if vehicle exists and belongs to user first
      const existingVehicle = await dbService.getVehicle(id);
      if (!existingVehicle.success || existingVehicle.data?.userId !== user.id) {
        reply.status(404).send({ 
          success: false, 
          error: 'Vehicle not found or access denied' 
        });
        return;
      }
      
      // Map performance data to vehicle specs format
      const specs = {
        horsepower: performanceData.horsePower || 0,
        torque: 0, // Not provided in test
        acceleration: performanceData.acceleration || 0,
        topSpeed: performanceData.topSpeed || 0,
        weight: performanceData.weight || 0,
        transmission: '',
        drivetrain: '',
      };

      const result = await dbService.updateVehicle(id, { specs } as any);
      
      if (result.success && result.data) {
        reply.send({ 
          success: true, 
          data: { vehicle: result.data }
        });
      } else {
        reply.status(500).send({ 
          success: false, 
          error: result.error || 'Failed to update vehicle performance'
        });
      }
    } catch (error) {
      reply.status(500).send({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  });

  // PUT /api/vehicles/:id - Update vehicle
  fastify.put('/:id', {
    preHandler: [authenticateUser],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { id } = request.params as any;
      
      // Check if vehicle exists and belongs to user
      const existingVehicle = await dbService.getVehicle(id);
      if (!existingVehicle.success || existingVehicle.data?.userId !== user.id) {
        reply.status(404).send({ 
          success: false, 
          error: 'Vehicle not found' 
        });
        return;
      }

      const result = await dbService.updateVehicle(id, request.body as any);
      
      if (result.success) {
        reply.send({ 
          success: true, 
          data: { vehicle: result.data }
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

  // DELETE /api/vehicles/:id - Delete vehicle
  fastify.delete('/:id', {
    preHandler: [authenticateUser],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { id } = request.params as any;
      
      // Check if vehicle exists and belongs to user
      const existingVehicle = await dbService.getVehicle(id);
      if (!existingVehicle.success || existingVehicle.data?.userId !== user.id) {
        reply.status(404).send({ 
          success: false, 
          error: 'Vehicle not found' 
        });
        return;
      }

      const result = await dbService.deleteVehicle(id);
      
      if (result.success) {
        reply.send({ 
          success: true, 
          message: 'Vehicle deleted successfully'
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

  // GET /api/vehicles/:id/stats - Get vehicle statistics
  fastify.get('/:id/stats', {
    preHandler: [authenticateUser],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { id } = request.params as any;
      
      const result = await dbService.getVehicle(id);
      
      if (result.success && result.data && result.data.userId === user.id) {
        reply.send({ 
          success: true, 
          data: { 
            stats: result.data.specs || {},
            vehicle: result.data
          }
        });
      } else {
        reply.status(404).send({ 
          success: false, 
          error: 'Vehicle not found' 
        });
      }
    } catch (error) {
      reply.status(500).send({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  });
}

export default vehicleRoutes;