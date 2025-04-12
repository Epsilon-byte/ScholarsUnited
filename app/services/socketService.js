// Socket.io service for real-time notifications
const socketIO = require('socket.io');

// Store connected users
const connectedUsers = new Map();
// Store users in event rooms
const eventRooms = new Map();

// Initialize socket.io server
function initializeSocketIO(server) {
  const io = socketIO(server);
  
  io.on('connection', (socket) => {
    console.log('New client connected');
    
    // Handle user authentication
    socket.on('authenticate', (userId) => {
      if (userId) {
        console.log(`User ${userId} authenticated`);
        
        // Store the socket connection for this user
        connectedUsers.set(userId, socket.id);
        
        // Join a room specific to this user for targeted messages
        socket.join(`user-${userId}`);
      }
    });
    
    // Handle joining event chat room
    socket.on('joinEventRoom', ({ userId, eventId }) => {
      if (userId && eventId) {
        const roomName = `event-${eventId}`;
        socket.join(roomName);
        
        // Track which users are in which event rooms
        if (!eventRooms.has(roomName)) {
          eventRooms.set(roomName, new Set());
        }
        eventRooms.get(roomName).add(userId);
        
        console.log(`User ${userId} joined event room ${roomName}`);
        
        // Notify room that user joined
        socket.to(roomName).emit('userJoinedEvent', {
          userId,
          eventId,
          message: 'A new user joined the event chat'
        });
      }
    });
    
    // Handle leaving event chat room
    socket.on('leaveEventRoom', ({ userId, eventId }) => {
      if (userId && eventId) {
        const roomName = `event-${eventId}`;
        socket.leave(roomName);
        
        // Remove user from event room tracking
        if (eventRooms.has(roomName)) {
          eventRooms.get(roomName).delete(userId);
          if (eventRooms.get(roomName).size === 0) {
            eventRooms.delete(roomName);
          }
        }
        
        console.log(`User ${userId} left event room ${roomName}`);
      }
    });
    
    // Handle event chat messages
    socket.on('eventMessage', ({ userId, eventId, message, messageId, content, senderName }) => {
      if (userId && eventId) {
        const roomName = `event-${eventId}`;
        
        // Broadcast message to all users in the event room
        io.to(roomName).emit('eventMessage', {
          messageId,
          userId,
          eventId,
          content: content || (message ? message.content : ''),
          timestamp: new Date(),
          senderName: senderName || (message ? message.senderName : 'Unknown User')
        });
        
        console.log(`Message sent to event ${eventId} by user ${userId}`);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected');
      
      // Remove user from connected users
      let disconnectedUserId = null;
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          connectedUsers.delete(userId);
          break;
        }
      }
      
      // Remove user from all event rooms they were in
      if (disconnectedUserId) {
        for (const [roomName, users] of eventRooms.entries()) {
          if (users.has(disconnectedUserId)) {
            users.delete(disconnectedUserId);
            if (users.size === 0) {
              eventRooms.delete(roomName);
            }
          }
        }
      }
    });
  });
  
  return io;
}

// Send notification to a specific user
function sendNotificationToUser(io, userId, notification) {
  io.to(`user-${userId}`).emit('notification', notification);
}

// Send notification to all connected users
function broadcastNotification(io, notification) {
  io.emit('notification', notification);
}

// Global io reference
let io;

// Initialize socket.io server
function initializeSocketIO(server) {
  io = socketIO(server);
  
  io.on('connection', (socket) => {
    console.log('New client connected');
    
    // Handle user authentication
    socket.on('authenticate', (userId) => {
      if (userId) {
        console.log(`User ${userId} authenticated`);
        
        // Store the socket connection for this user
        connectedUsers.set(userId, socket.id);
        
        // Join a room specific to this user for targeted messages
        socket.join(`user-${userId}`);
      }
    });
    
    // Handle joining event chat room
    socket.on('joinEventRoom', ({ userId, eventId }) => {
      if (userId && eventId) {
        const roomName = `event-${eventId}`;
        socket.join(roomName);
        
        // Track which users are in which event rooms
        if (!eventRooms.has(roomName)) {
          eventRooms.set(roomName, new Set());
        }
        eventRooms.get(roomName).add(userId);
        
        console.log(`User ${userId} joined event room ${roomName}`);
        
        // Notify room that user joined
        socket.to(roomName).emit('userJoinedEvent', {
          userId,
          eventId,
          message: 'A new user joined the event chat'
        });
      }
    });
    
    // Handle leaving event chat room
    socket.on('leaveEventRoom', ({ userId, eventId }) => {
      if (userId && eventId) {
        const roomName = `event-${eventId}`;
        socket.leave(roomName);
        
        // Remove user from event room tracking
        if (eventRooms.has(roomName)) {
          eventRooms.get(roomName).delete(userId);
          if (eventRooms.get(roomName).size === 0) {
            eventRooms.delete(roomName);
          }
        }
        
        console.log(`User ${userId} left event room ${roomName}`);
      }
    });
    
    // Handle event chat messages
    socket.on('eventMessage', ({ userId, eventId, message, messageId, content, senderName }) => {
      if (userId && eventId) {
        const roomName = `event-${eventId}`;
        
        // Broadcast message to all users in the event room
        io.to(roomName).emit('eventMessage', {
          messageId,
          userId,
          eventId,
          content: content || (message ? message.content : ''),
          timestamp: new Date(),
          senderName: senderName || (message ? message.senderName : 'Unknown User')
        });
        
        console.log(`Message sent to event ${eventId} by user ${userId}`);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected');
      
      // Remove user from connected users
      let disconnectedUserId = null;
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          connectedUsers.delete(userId);
          break;
        }
      }
      
      // Remove user from all event rooms they were in
      if (disconnectedUserId) {
        for (const [roomName, users] of eventRooms.entries()) {
          if (users.has(disconnectedUserId)) {
            users.delete(disconnectedUserId);
            if (users.size === 0) {
              eventRooms.delete(roomName);
            }
          }
        }
      }
    });
  });
  
  return io;
}

// Send notification to a specific user
function sendNotificationToUser(userId, notification) {
  if (!io) {
    console.error('Socket.io not initialized');
    return false;
  }
  io.to(`user-${userId}`).emit('notification', notification);
  return true;
}

// Send notification to all connected users
function broadcastNotification(notification) {
  if (!io) {
    console.error('Socket.io not initialized');
    return false;
  }
  io.emit('notification', notification);
  return true;
}

// Send message to an event room
function sendEventMessage(messageData) {
  try {
    if (!io) {
      console.error('Socket.io not initialized');
      return false;
    }
    
    if (!messageData || !messageData.eventId) {
      console.error('Invalid message data for event message');
      return false;
    }
    
    const roomName = `event-${messageData.eventId}`;
    console.log(`Sending message to room ${roomName}:`, messageData);
    
    io.to(roomName).emit('eventMessage', messageData);
    return true;
  } catch (error) {
    console.error('Error sending event message:', error);
    return false;
  }
}

// Emit event message deleted notification
function emitEventMessageDeleted(eventId, messageId) {
  try {
    if (!io) {
      console.error('Socket.io not initialized');
      return false;
    }
    
    if (!eventId || !messageId) {
      console.error('Invalid data for event message deletion');
      return false;
    }
    
    const roomName = `event-${eventId}`;
    console.log(`Sending message deletion to room ${roomName}:`, messageId);
    
    io.to(roomName).emit('eventMessageDeleted', messageId);
    return true;
  } catch (error) {
    console.error('Error sending event message deletion:', error);
    return false;
  }
}

// Emit event message updated notification
function emitEventMessageUpdated(eventId, messageData) {
  try {
    if (!io) {
      console.error('Socket.io not initialized');
      return false;
    }
    
    if (!eventId || !messageData || !messageData.messageId) {
      console.error('Invalid data for event message update');
      return false;
    }
    
    const roomName = `event-${eventId}`;
    console.log(`Sending message update to room ${roomName}:`, messageData);
    
    io.to(roomName).emit('eventMessageUpdated', messageData);
    return true;
  } catch (error) {
    console.error('Error sending event message update:', error);
    return false;
  }
}



// Check if a user is online
function isUserOnline(userId) {
  return connectedUsers.has(userId);
}

// Get users in an event room
function getUsersInEventRoom(eventId) {
  const roomName = `event-${eventId}`;
  return eventRooms.has(roomName) ? Array.from(eventRooms.get(roomName)) : [];
}

module.exports = {
  initializeSocketIO,
  sendNotificationToUser,
  broadcastNotification,
  sendEventMessage,
  emitEventMessageDeleted,
  emitEventMessageUpdated,
  isUserOnline,
  getUsersInEventRoom
};
