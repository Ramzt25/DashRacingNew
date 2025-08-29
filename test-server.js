const fastify = require('fastify')({ logger: true });

fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '127.0.0.1' });
    console.log('Test server running on port 3001');
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

start();