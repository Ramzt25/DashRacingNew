import { FastifyInstance } from 'fastify';

async function uploadRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/image', { preHandler: [fastify.authenticate] }, async (request: any, reply: any) => {
    reply.send({ success: true, data: { url: 'https://example.com/image.jpg' } });
  });
}

export default uploadRoutes;