const User = require('../models/User');
const Session = require('../models/Session');

// In-memory storage for quick access (still needed for Socket.IO)
const connectedUsers = new Map();

// Join user to chat (now with database)
async function userJoin(socketId, sessionId, userId, username, room, ipAddress, userAgent) {
   const user = { 
      id: userId,
      socketId, 
      sessionId,
      username, 
      room,
      joinedAt: new Date()
   };

   connectedUsers.set(socketId, user);
   
   try {
      // Update database
      await User.setOnlineStatus(userId, true);
      await Session.create(sessionId, userId, socketId, room, ipAddress, userAgent);
   } catch (error) {
      console.error('Error updating user session:', error);
   }

   return user;
}

// Get current user by socket ID
function getCurrentUser(socketId) {
   return connectedUsers.get(socketId);
}

// User leaves chat (now with database)
async function userLeave(socketId) {
   const user = connectedUsers.get(socketId);
   
   if (user) {
      connectedUsers.delete(socketId);
      
      try {
         // Update database
         await User.setOnlineStatus(user.id, false);
         await Session.remove(user.sessionId);
      } catch (error) {
         console.error('Error removing user session:', error);
      }
   }
   
   return user;
}

// Get room users (from database for accuracy)
async function getRoomUsers(room) {
   try {
      const users = await User.getUsersInRoom(room);
      return users.map(user => ({
         id: user.id,
         username: user.username,
         isOnline: user.is_online,
         avatar: user.avatar_url
      }));
   } catch (error) {
      console.error('Error getting room users:', error);
      // Fallback to in-memory users
      return Array.from(connectedUsers.values())
         .filter(user => user.room === room)
         .map(user => ({ username: user.username }));
   }
}

// Clean up old sessions periodically
setInterval(async () => {
   try {
      await Session.cleanOldSessions();
   } catch (error) {
      console.error('Error cleaning old sessions:', error);
   }
}, 60 * 60 * 1000); // Every hour

module.exports = {
   userJoin,
   getCurrentUser,
   userLeave,
   getRoomUsers,
};