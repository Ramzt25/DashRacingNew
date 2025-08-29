import { FastifyRequest, FastifyReply } from 'fastify';

export const errorHandler = (error: Error, request: FastifyRequest, reply: FastifyReply): void => {
  const { log } = request;

  // Log the error
  log.error({
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  }, 'Request error');

  // Determine status code
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Not Found';
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    message = 'Conflict';
  } else if (error.name === 'TooManyRequestsError') {
    statusCode = 429;
    message = 'Too Many Requests';
  }

  // Send error response
  reply.code(statusCode).send({
    error: true,
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      details: error.message,
      stack: error.stack,
    }),
    timestamp: new Date().toISOString(),
    path: request.url,
  });
};