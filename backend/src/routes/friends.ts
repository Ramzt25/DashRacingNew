import { FastifyInstance } from 'fastify';

async function friendRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request: any, reply: any) => {
    reply.send({ success: true, data: [] });
  });

  fastify.post('/request', { preHandler: [fastify.authenticate] }, async (request: any, reply: any) => {
    try {
      console.log(`🚀 Friend request endpoint called`);
      const user = request.user;
      const { username } = request.body;
      
      console.log(`🔍 Friend request details - From: ${user.username} (${user.id}) To: ${username}`);
      
      // Look up the target user by username using the database service
      const dbService = (fastify as any).supabaseService || (fastify as any).dbService;
      if (!dbService) {
        console.log(`❌ Database service not available`);
        reply.status(500).send({ success: false, error: 'Database service not available' });
        return;
      }
      
      console.log(`💾 Querying database for user: ${username}`);
      
      // Find user by username
      const { data: users } = await dbService.supabase
        .from('users')
        .select('id, username, email')
        .eq('username', username)
        .limit(1);
      
      console.log(`🔍 Friend request - Looking for user '${username}', found:`, users);
      
      if (!users || users.length === 0) {
        console.log(`❌ Target user '${username}' not found`);
        reply.status(404).send({ success: false, error: 'User not found' });
        return;
      }
      
      const targetUser = users[0];
      console.log(`📤 Sending friend request notification to user ${targetUser.id} (${targetUser.username})`);
      
      // Send WebSocket notification to target user
      const wsService = (fastify as any).wsService;
      if (wsService) {
        console.log(`🔌 WebSocket service found, calling sendFriendRequestNotification...`);
        wsService.sendFriendRequestNotification(targetUser.id, {
          id: user.id,
          username: user.username,
          email: user.email
        });
        console.log(`✅ Friend request notification sent via WebSocket`);
      } else {
        console.log(`❌ WebSocket service not available`);
      }
      
      console.log(`📨 Sending response: Friend request sent`);
      reply.send({ success: true, message: 'Friend request sent' });
    } catch (error) {
      console.error('Friend request error:', error);
      reply.status(500).send({ success: false, error: 'Failed to send friend request' });
    }
  });

  fastify.post('/accept', { preHandler: [fastify.authenticate] }, async (request: any, reply: any) => {
    try {
      const user = request.user;
      const { username } = request.body;
      
      // Look up the requester user by username
      const dbService = (fastify as any).supabaseService || (fastify as any).dbService;
      if (!dbService) {
        reply.status(500).send({ success: false, error: 'Database service not available' });
        return;
      }
      
      // Find user by username
      const { data: users } = await dbService.supabase
        .from('users')
        .select('id, username, email')
        .eq('username', username)
        .limit(1);
      
      if (!users || users.length === 0) {
        reply.status(404).send({ success: false, error: 'User not found' });
        return;
      }
      
      const requesterUser = users[0];
      
      // Send WebSocket notification to the original requester
      const wsService = (fastify as any).wsService;
      if (wsService) {
        wsService.sendFriendAcceptedNotification(requesterUser.id, {
          id: user.id,
          username: user.username,
          email: user.email
        });
      }
      
      reply.send({ success: true, message: 'Friend request accepted' });
    } catch (error) {
      console.error('Friend accept error:', error);
      reply.status(500).send({ success: false, error: 'Failed to accept friend request' });
    }
  });
}

export default friendRoutes;