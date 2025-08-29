import { FastifyInstance } from 'fastify';

async function meetupRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request: any, reply: any) => {
    reply.send({ success: true, data: [] });
  });

  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request: any, reply: any) => {
    reply.send({ success: true, message: 'Meetup created' });
  });
}

export default meetupRoutes;