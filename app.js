const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import models and utilities
const { formatMessage, formatDbMessage } = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');
const User = require('./models/User');
const Message = require('./models/Message');
const db = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const limiter = rateLimit({
   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
   message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Session configuration
app.use(session({
   secret: process.env.SESSION_SECRET,
   resave: false,
   saveUninitialized: false,
   cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
   }
}));

const botName = 'XeroxChat Bot';

// Routes
app.get('/', (req, res) => {
   if (req.session.userId) {
      return res.redirect('/chat');
   }
   res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/chat', (req, res) => {
   if (!req.session.userId) {
      return res.redirect('/');
   }
   res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Authentication routes
app.post('/auth/login', async (req, res) => {
   try {
      const { username, email, password } = req.body;
      
      let user;
      if (email) {
         user = await User.findByEmail(email);
      } else if (username) {
         user = await User.findByUsername(username);
      } else {
         return res.status(400).json({ success: false, message: 'Username or email required' });
      }

      if (!user) {
         return res.status(401).json({ success: false, message: 'User not found' });
      }

      const isValidPassword = await User.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
         return res.status(401).json({ success: false, message: 'Invalid password' });
      }

      req.session.userId = user.id;
      req.session.username = user.username;
      
      res.json({ 
         success: true, 
         message: 'Login successful',
         user: {
            id: user.id,
            username: user.username,
            email: user.email
         }
      });
   } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Server error during login' });
   }
});

app.post('/auth/register', async (req, res) => {
   try {
      const { username, email, password } = req.body;

      // Validation
      if (!username || !email || !password) {
         return res.status(400).json({ success: false, message: 'All fields are required' });
      }

      if (password.length < 6) {
         return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
         return res.status(409).json({ success: false, message: 'Email already registered' });
      }

      const existingUsername = await User.findByUsername(username);
      if (existingUsername) {
         return res.status(409).json({ success: false, message: 'Username already taken' });
      }

      // Create user
      const userId = await User.create(username, email, password);
      
      req.session.userId = userId;
      req.session.username = username;

      res.json({ 
         success: true, 
         message: 'Registration successful',
         user: { id: userId, username, email }
      });
   } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ success: false, message: 'Server error during registration' });
   }
});

app.post('/auth/logout', (req, res) => {
   req.session.destroy((err) => {
      if (err) {
         return res.status(500).json({ success: false, message: 'Could not log out' });
      }
      res.json({ success: true, message: 'Logged out successfully' });
   });
});

// API routes
app.get('/api/messages/:room', async (req, res) => {
   try {
      if (!req.session.userId) {
         return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      const { room } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      
      const messages = await Message.getRecentMessages(room, limit);
      const formattedMessages = messages.map(formatDbMessage);
      
      res.json({ success: true, messages: formattedMessages });
   } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ success: false, message: 'Error fetching messages' });
   }
});

app.get('/api/search/:room', async (req, res) => {
   try {
      if (!req.session.userId) {
         return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      const { room } = req.params;
      const { q: searchTerm } = req.query;
      
      if (!searchTerm) {
         return res.status(400).json({ success: false, message: 'Search term required' });
      }

      const messages = await Message.searchMessages(room, searchTerm);
      const formattedMessages = messages.map(formatDbMessage);
      
      res.json({ success: true, messages: formattedMessages });
   } catch (error) {
      console.error('Error searching messages:', error);
      res.status(500).json({ success: false, message: 'Error searching messages' });
   }
});

// Socket.IO with database integration
io.on('connection', async (socket) => {
   console.log(`🔌 New connection: ${socket.id}`);

   socket.on('joinRoom', async ({ username, room }) => {
      try {
         // Get user info from session (you'll need to implement session sharing with Socket.IO)
         const sessionId = socket.handshake.sessionID || socket.id;
         const ipAddress = socket.handshake.address;
         const userAgent = socket.handshake.headers['user-agent'];
         
         // For now, create a temporary user (in production, get from authenticated session)
         let user = await User.findByUsername(username);
         if (!user) {
            // Create guest user (you might want to handle this differently)
            const userId = await User.create(username, `${username}@guest.com`, 'temporary123');
            user = { id: userId, username };
         }

         const joinedUser = await userJoin(
            socket.id, 
            sessionId, 
            user.id, 
            username, 
            room, 
            ipAddress, 
            userAgent
         );

         socket.join(room);

         // Load recent messages from database
         const recentMessages = await Message.getRecentMessages(room, 20);
         const formattedMessages = recentMessages.map(formatDbMessage);
         socket.emit('loadMessages', formattedMessages);

         // Welcome current user
         socket.emit('message', formatMessage(botName, `Welcome to XeroxChat, ${username}! 🎉`));

         // Notify others in room
         socket.broadcast
            .to(room)
            .emit('message', formatMessage(botName, `${username} has joined the chat! 👋`));

         // Save system message
         await Message.create(user.id, room, `${username} has joined the chat!`, 'system');

         // Send users and room info
         const roomUsers = await getRoomUsers(room);
         io.to(room).emit('roomUsers', {
            room: room,
            users: roomUsers,
         });

         console.log(`👤 ${username} joined room: ${room}`);
      } catch (error) {
         console.error('Error joining room:', error);
         socket.emit('error', 'Error joining room');
      }
   });

   socket.on('chatMessage', async (msg) => {
      try {
         const user = getCurrentUser(socket.id);
         if (!user) {
            socket.emit('error', 'User not found');
            return;
         }

         // Save message to database
         await Message.create(user.id, user.room, msg);

         // Broadcast message to room
         const message = formatMessage(user.username, msg);
         io.to(user.room).emit('message', message);

         console.log(`💬 Message from ${user.username} in ${user.room}: ${msg.substring(0, 50)}...`);
      } catch (error) {
         console.error('Error sending message:', error);
         socket.emit('error', 'Error sending message');
      }
   });

   socket.on('typing', () => {
      const user = getCurrentUser(socket.id);
      if (user) {
         socket.to(user.room).emit('typing', {
            username: user.username,
            isTyping: true
         });
      }
   });

   socket.on('stopTyping', () => {
      const user = getCurrentUser(socket.id);
      if (user) {
         socket.to(user.room).emit('typing', {
            username: user.username,
            isTyping: false
         });
      }
   });

   socket.on('disconnect', async () => {
      try {
         const user = await userLeave(socket.id);

         if (user) {
            // Notify others in room
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat! 👋`));

            // Save system message
            await Message.create(user.id, user.room, `${user.username} has left the chat!`, 'system');

            // Update room users list
            const roomUsers = await getRoomUsers(user.room);
            io.to(user.room).emit('roomUsers', {
               room: user.room,
               users: roomUsers,
            });

            console.log(`👤 ${user.username} left room: ${user.room}`);
         }
      } catch (error) {
         console.error('Error handling disconnect:', error);
      }
   });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
   console.log(`🚀 XeroxChat Server is running on PORT: ${PORT}`);
   console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
   console.log(`🕐 Timezone: ${process.env.DEFAULT_TIMEZONE || 'Asia/Dhaka'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
   console.log('🔄 SIGTERM received, shutting down gracefully...');
   server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
   });
});