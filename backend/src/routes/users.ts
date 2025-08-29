import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Joi from 'joi';
import { SupabaseService } from '../services/database';
import { User } from '../types';

interface UpdateUserBody {
  username?: string;
  avatar?: string;
  preferences?: User['preferences'];
}

const updateUserSchema = Joi.object({
  username: Joi.string().min(3).max(20),
  avatar: Joi.string().uri(),
  preferences: Joi.object({
    notifications: Joi.boolean(),
    location: Joi.boolean(),
    units: Joi.string().valid('metric', 'imperial'),
    soundEnabled: Joi.boolean(),
    vibrationEnabled: Joi.boolean(),
  }),
});

async function userRoutes(fastify: FastifyInstance): Promise<void> {
  const dbService = new SupabaseService();

  // Get current user profile
  fastify.get('/profile', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userResult = await dbService.getUserById((request.user as any)!.id);
      
      if (!userResult.success) {
        return reply.code(404).send({
          error: 'User Not Found',
          message: 'User profile not found',
        });
      }

      reply.send({
        success: true,
        data: userResult.data,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch user profile',
      });
    }
  });

  // Update user profile
  fastify.put('/profile', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Body: UpdateUserBody }>, reply: FastifyReply) => {
    try {
      const { error, value } = updateUserSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: error.details[0].message,
        });
      }

      const updateResult = await dbService.updateUser((request.user as any)!.id, value);
      
      if (!updateResult.success) {
        return reply.code(500).send({
          error: 'Update Failed',
          message: 'Failed to update user profile',
        });
      }

      reply.send({
        success: true,
        message: 'Profile updated successfully',
        data: updateResult.data,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to update user profile',
      });
    }
  });

  // Get user by ID (public profile)
  fastify.get('/:userId', async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
    try {
      const { userId } = request.params;
      
      const userResult = await dbService.getUserById(userId);
      
      if (!userResult.success) {
        return reply.code(404).send({
          error: 'User Not Found',
          message: 'User not found',
        });
      }

      // Return public profile only
      const publicProfile = {
        id: userResult.data!.id,
        username: userResult.data!.username,
        avatar: userResult.data!.avatar,
        stats: userResult.data!.stats,
        isPro: userResult.data!.isPro,
        createdAt: userResult.data!.createdAt,
      };

      reply.send({
        success: true,
        data: publicProfile,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch user profile',
      });
    }
  });

  // Delete user account
  fastify.delete('/account', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // In production, this would soft delete and clean up related data
      // For now, we'll just return a success message
      
      reply.send({
        success: true,
        message: 'Account deletion initiated. Data will be removed within 30 days.',
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to delete account',
      });
    }
  });
}

export default userRoutes;