import { FastifyRequest } from 'fastify';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';

interface WebSocketConnection {
  id: string;
  userId?: string;
  socket: WebSocket;
  type: 'race' | 'location' | 'notification' | 'general';
  joinedAt: Date;
  lastPing: Date;
}

interface RaceUpdateMessage {
  type: 'race_update' | 'race_join' | 'race_leave' | 'race_start' | 'race_finish' | 'race_started' | 'race_completed';
  raceId: string;
  data: any;
  timestamp: Date;
}

interface LocationUpdateMessage {
  type: 'location_update';
  userId: string;
  raceId?: string;
  data?: {
    raceId: string;
    userId: string;
    location: {
      lat: number;
      lng: number;
      heading?: number;
      speed?: number;
    };
  };
  location?: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
  };
  timestamp: Date;
}

interface NotificationMessage {
  type: 'friend_request_received' | 'friend_request_accepted' | 'race_invitation' | 'notification';
  userId?: string;
  data: any;
  timestamp: Date;
}

export class WebSocketService {
  private connections: Map<string, WebSocketConnection> = new Map();
  private raceRooms: Map<string, Set<string>> = new Map();
  private userConnections: Map<string, string> = new Map();
  private heartbeatInterval?: NodeJS.Timeout;

  initialize(): void {
    console.log('🔌 WebSocket service initialized');
    
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000'));
  }

  async handleMainConnection(connection: WebSocket, request: FastifyRequest): Promise<void> {
    const connectionId = uuidv4();
    const userId = (request as any).user?.id;

    // Debug logging as specified in completion prompt
    console.log('🔍 WebSocket Debug - New connection for user:', userId);
    console.log('🔍 WebSocket Debug - Request user object:', (request as any).user);

    const wsConnection: WebSocketConnection = {
      id: connectionId,
      userId,
      socket: connection,
      type: 'general',
      joinedAt: new Date(),
      lastPing: new Date(),
    };

    this.connections.set(connectionId, wsConnection);
    
    if (userId) {
      this.userConnections.set(userId, connectionId);
      console.log('🔍 WebSocket Debug - User connection mapped:', userId, '->', connectionId);
      console.log('🔍 WebSocket Debug - Total user connections:', this.userConnections.size);
    }

    console.log(`🔌 Main WebSocket connected: ${connectionId} (User: ${userId})`);

    connection.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('🔍 WebSocket Debug - Received message:', message);
        this.handleMainMessage(connectionId, message);
      } catch (error) {
        console.error('Invalid main message:', error);
      }
    });

    connection.on('close', () => {
      console.log('🔍 WebSocket Debug - Connection closing:', connectionId);
      this.handleDisconnection(connectionId);
    });

    connection.on('error', (error) => {
      console.error(`Main WebSocket error for ${connectionId}:`, error);
      this.handleDisconnection(connectionId);
    });

    // Send welcome message as expected by tests
    this.sendToConnection(connectionId, {
      type: 'connection_established',
      data: {
        userId: userId,
        message: 'WebSocket connection established successfully',
        connectionId: connectionId,
        features: ['notifications', 'races', 'location']
      },
      timestamp: new Date(),
    });
  }

  // CRITICAL DEBUG METHODS - As specified in completion prompt Phase 1
  public sendNotificationToUser(userId: string, notification: NotificationMessage): void {
    // Enhanced debug logging as specified in completion prompt
    console.log('🔍 WebSocket Debug - User connections map:', Array.from(this.userConnections.entries()));
    console.log('🔍 WebSocket Debug - Sending notification to user:', userId, 'Type:', notification.type);
    
    const connectionId = this.userConnections.get(userId);
    console.log('🔍 WebSocket Debug - Connection found:', connectionId ? 'YES' : 'NO');
    
    if (connectionId) {
      const connection = this.connections.get(connectionId);
      if (connection) {
        console.log('🔍 WebSocket Debug - Connection is valid, socket ready state:', connection.socket.readyState);
        console.log('🔍 WebSocket Debug - Sending message:', JSON.stringify(notification));
        this.sendToConnection(connectionId, notification);
      } else {
        console.log('🔍 WebSocket Debug - Connection ID found but connection object missing');
      }
    } else {
      console.log('🔍 WebSocket Debug - No connection found for user:', userId);
      console.log('🔍 WebSocket Debug - Available user connections:', Array.from(this.userConnections.keys()));
    }
  }

  public sendFriendRequestNotification(userId: string, fromUser: any): void {
    console.log('🔍 WebSocket Debug - Sending friend request notification to:', userId, 'from:', fromUser.username);
    this.sendNotificationToUser(userId, {
      type: 'friend_request_received',
      data: {
        from: fromUser,
        type: 'friend_request',
        message: `${fromUser.username} sent you a friend request`
      },
      timestamp: new Date(),
    });
  }

  public sendFriendAcceptedNotification(userId: string, friend: any): void {
    console.log('🔍 WebSocket Debug - Sending friend accepted notification to:', userId, 'from:', friend.username);
    this.sendNotificationToUser(userId, {
      type: 'friend_request_accepted',
      data: {
        friend: friend,
        type: 'friend_accepted',
        message: `${friend.username} accepted your friend request`
      },
      timestamp: new Date(),
    });
  }

  public sendRaceInvitation(userId: string, race: any, invitedBy: any): void {
    console.log('🔍 WebSocket Debug - Sending race invitation to:', userId, 'for race:', race.id, 'by:', invitedBy.username);
    this.sendNotificationToUser(userId, {
      type: 'race_invitation',
      data: {
        race: race,
        invitedBy: invitedBy,
        type: 'race_invitation',
        message: `${invitedBy.username} invited you to a race`
      },
      timestamp: new Date(),
    });
  }

  private sendToConnection(connectionId: string, message: any): void {
    const connection = this.connections.get(connectionId);
    if (connection && connection.socket.readyState === WebSocket.OPEN) {
      try {
        const messageStr = JSON.stringify(message);
        connection.socket.send(messageStr);
        console.log('🔍 WebSocket Debug - Message sent successfully to connection:', connectionId, 'Type:', message.type);
      } catch (error) {
        console.error(`Failed to send message to ${connectionId}:`, error);
        this.handleDisconnection(connectionId);
      }
    } else {
      console.log('🔍 WebSocket Debug - Cannot send to connection:', connectionId, 'Ready state:', connection?.socket.readyState);
    }
  }

  private handleMainMessage(connectionId: string, message: any): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    console.log('🔍 WebSocket Debug - Processing main message:', message.type);

    switch (message.type) {
      case 'join_race':
        console.log('🔍 WebSocket Debug - User joining race room:', message.data?.raceId || message.raceId);
        this.joinRaceRoom(connectionId, message.data?.raceId || message.raceId);
        break;
      case 'leave_race':
        this.leaveRaceRoom(connectionId, message.data?.raceId || message.raceId);
        break;
      case 'subscribe_notifications':
        console.log('🔍 WebSocket Debug - User subscribing to notifications');
        this.sendToConnection(connectionId, {
          type: 'notification_subscription_confirmed',
          data: { subscribed: true },
          timestamp: new Date(),
        });
        break;
      case 'pong':
        connection.lastPing = new Date();
        break;
    }
  }

  private handleDisconnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    console.log(`🔌 WebSocket disconnected: ${connectionId} (${connection.type})`);

    // Remove from race rooms
    for (const [raceId, connectionIds] of this.raceRooms.entries()) {
      connectionIds.delete(connectionId);
      if (connectionIds.size === 0) {
        this.raceRooms.delete(raceId);
      }
    }

    // Remove user connection mapping
    if (connection.userId) {
      this.userConnections.delete(connection.userId);
      console.log('🔍 WebSocket Debug - User connection removed:', connection.userId);
    }

    this.connections.delete(connectionId);
  }

  private joinRaceRoom(connectionId: string, raceId: string): void {
    if (!this.raceRooms.has(raceId)) {
      this.raceRooms.set(raceId, new Set());
    }
    
    this.raceRooms.get(raceId)!.add(connectionId);
    console.log('🔍 WebSocket Debug - Connection joined race room:', connectionId, 'to race:', raceId);
    console.log('🔍 WebSocket Debug - Race room participants:', Array.from(this.raceRooms.get(raceId) || []));
    
    this.sendToConnection(connectionId, {
      type: 'joined_race',
      raceId,
      timestamp: new Date(),
    });
  }

  private leaveRaceRoom(connectionId: string, raceId: string): void {
    const room = this.raceRooms.get(raceId);
    if (room) {
      room.delete(connectionId);
      if (room.size === 0) {
        this.raceRooms.delete(raceId);
      }
    }

    this.sendToConnection(connectionId, {
      type: 'left_race',
      raceId,
      timestamp: new Date(),
    });
  }

  private sendHeartbeat(): void {
    for (const connection of this.connections.values()) {
      if (connection.socket.readyState === WebSocket.OPEN) {
        try {
          connection.socket.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.error(`Heartbeat failed for ${connection.id}:`, error);
          this.handleDisconnection(connection.id);
        }
      } else {
        this.handleDisconnection(connection.id);
      }
    }
  }

  async handleRaceConnection(connection: WebSocket, request: FastifyRequest): Promise<void> {
    const connectionId = uuidv4();
    const userId = (request as any).user?.id;

    const wsConnection: WebSocketConnection = {
      id: connectionId,
      userId,
      socket: connection,
      type: 'race',
      joinedAt: new Date(),
      lastPing: new Date(),
    };

    this.connections.set(connectionId, wsConnection);
    
    if (userId) {
      this.userConnections.set(userId, connectionId);
      console.log('🔍 WebSocket Debug - Race connection mapped for user:', userId);
    }

    console.log(`🏁 Race WebSocket connected: ${connectionId} (User: ${userId})`);

    connection.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleRaceMessage(connectionId, message);
      } catch (error) {
        console.error('Invalid race message:', error);
      }
    });

    connection.on('close', () => {
      this.handleDisconnection(connectionId);
    });

    connection.on('error', (error) => {
      console.error(`Race WebSocket error for ${connectionId}:`, error);
      this.handleDisconnection(connectionId);
    });

    this.sendToConnection(connectionId, {
      type: 'connected',
      connectionId,
      timestamp: new Date(),
    });
  }

  async handleLocationConnection(connection: WebSocket, request: FastifyRequest): Promise<void> {
    const connectionId = uuidv4();
    const userId = (request as any).user?.id;

    const wsConnection: WebSocketConnection = {
      id: connectionId,
      userId,
      socket: connection,
      type: 'location',
      joinedAt: new Date(),
      lastPing: new Date(),
    };

    this.connections.set(connectionId, wsConnection);
    
    if (userId) {
      this.userConnections.set(userId, connectionId);
    }

    console.log(`📍 Location WebSocket connected: ${connectionId} (User: ${userId})`);

    connection.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleLocationMessage(connectionId, message);
      } catch (error) {
        console.error('Invalid location message:', error);
      }
    });

    connection.on('close', () => {
      this.handleDisconnection(connectionId);
    });

    connection.on('error', (error) => {
      console.error(`Location WebSocket error for ${connectionId}:`, error);
      this.handleDisconnection(connectionId);
    });
  }

  async handleNotificationConnection(connection: WebSocket, request: FastifyRequest): Promise<void> {
    const connectionId = uuidv4();
    const userId = (request as any).user?.id;

    const wsConnection: WebSocketConnection = {
      id: connectionId,
      userId,
      socket: connection,
      type: 'notification',
      joinedAt: new Date(),
      lastPing: new Date(),
    };

    this.connections.set(connectionId, wsConnection);
    
    if (userId) {
      this.userConnections.set(userId, connectionId);
    }

    console.log(`🔔 Notification WebSocket connected: ${connectionId} (User: ${userId})`);

    connection.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleNotificationMessage(connectionId, message);
      } catch (error) {
        console.error('Invalid notification message:', error);
      }
    });

    connection.on('close', () => {
      this.handleDisconnection(connectionId);
    });

    connection.on('error', (error) => {
      console.error(`Notification WebSocket error for ${connectionId}:`, error);
      this.handleDisconnection(connectionId);
    });
  }

  private handleRaceMessage(connectionId: string, message: any): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    switch (message.type) {
      case 'join_race':
        this.joinRaceRoom(connectionId, message.data?.raceId || message.raceId);
        break;
      case 'leave_race':
        this.leaveRaceRoom(connectionId, message.data?.raceId || message.raceId);
        break;
      case 'race_update':
        this.broadcastToRace(message.data?.raceId || message.raceId, {
          type: 'race_update',
          raceId: message.data?.raceId || message.raceId,
          data: message.data,
          timestamp: new Date(),
        });
        break;
      case 'pong':
        connection.lastPing = new Date();
        break;
    }
  }

  private handleLocationMessage(connectionId: string, message: any): void {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.userId) return;

    switch (message.type) {
      case 'location_update':
        this.broadcastLocationUpdate({
          type: 'location_update',
          userId: connection.userId,
          location: message.location,
          timestamp: new Date(),
        });
        break;
      case 'pong':
        connection.lastPing = new Date();
        break;
    }
  }

  private handleNotificationMessage(connectionId: string, message: any): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    switch (message.type) {
      case 'pong':
        connection.lastPing = new Date();
        break;
    }
  }

  public broadcastToRace(raceId: string, message: RaceUpdateMessage): void {
    const connectionIds = this.raceRooms.get(raceId);
    if (!connectionIds) {
      console.log('🔍 WebSocket Debug - No race room found for:', raceId);
      return;
    }

    console.log('🔍 WebSocket Debug - Broadcasting to race:', raceId, 'Participants:', connectionIds.size);

    for (const connectionId of connectionIds) {
      this.sendToConnection(connectionId, message);
    }
  }

  public broadcastLocationUpdate(message: LocationUpdateMessage): void {
    console.log('🔍 WebSocket Debug - Broadcasting location update from user:', message.userId);
    let sentCount = 0;
    
    for (const connection of this.connections.values()) {
      if (connection.type === 'location') {
        this.sendToConnection(connection.id, message);
        sentCount++;
      }
    }
    
    console.log('🔍 WebSocket Debug - Location update sent to', sentCount, 'connections');
  }

  public sendRaceStartedNotification(raceId: string): void {
    console.log('🔍 WebSocket Debug - Sending race started notification for race:', raceId);
    console.log('🔍 WebSocket Debug - Race room participants:', this.raceRooms.get(raceId));
    this.broadcastToRace(raceId, {
      type: 'race_started',
      raceId: raceId,
      data: {
        raceId: raceId,
        status: 'active',
        message: 'Race has started!'
      },
      timestamp: new Date(),
    });
  }

  public sendRaceCompletedNotification(raceId: string, results: any): void {
    console.log('🔍 WebSocket Debug - Sending race completed notification for race:', raceId);
    this.broadcastToRace(raceId, {
      type: 'race_completed',
      raceId: raceId,
      data: {
        raceId: raceId,
        status: 'completed',
        results: results,
        message: 'Race completed!'
      },
      timestamp: new Date(),
    });
  }

  public sendLocationUpdate(raceId: string, userId: string, location: any): void {
    const connectionIds = this.raceRooms.get(raceId);
    if (!connectionIds) {
      console.log('🔍 WebSocket Debug - No race room for location update:', raceId);
      return;
    }

    console.log('🔍 WebSocket Debug - Sending location update for race:', raceId, 'from user:', userId);

    const locationMessage: LocationUpdateMessage = {
      type: 'location_update',
      userId: userId,
      raceId: raceId,
      data: {
        raceId: raceId,
        userId: userId,
        location: location
      },
      timestamp: new Date(),
    };

    for (const connectionId of connectionIds) {
      const connection = this.connections.get(connectionId);
      if (connection) {
        // Send to all participants in the race (including sender for testing/confirmation)
        this.sendToConnection(connectionId, locationMessage);
      }
    }
  }

  public cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    for (const connection of this.connections.values()) {
      if (connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.close();
      }
    }

    this.connections.clear();
    this.raceRooms.clear();
    this.userConnections.clear();
  }

  public getStats(): any {
    return {
      totalConnections: this.connections.size,
      raceConnections: Array.from(this.connections.values()).filter(c => c.type === 'race').length,
      locationConnections: Array.from(this.connections.values()).filter(c => c.type === 'location').length,
      notificationConnections: Array.from(this.connections.values()).filter(c => c.type === 'notification').length,
      activeRaces: this.raceRooms.size,
      authenticatedUsers: this.userConnections.size,
    };
  }
}