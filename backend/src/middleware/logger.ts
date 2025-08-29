import { FastifyRequest, FastifyReply } from 'fastify';

export const requestLogger = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const startTime = Date.now();

  // Log request
  request.log.info({
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    ip: request.ip,
    userId: (request.user as any)?.id,
  }, 'Incoming request');

  // Hook to log response
  reply.raw.on('finish', () => {
    const duration = Date.now() - startTime;
    
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration: `${duration}ms`,
      userId: (request.user as any)?.id,
    }, 'Request completed');
  });
};