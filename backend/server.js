const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGINS || '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'social_network_db';

mongoose.connect(`${mongoUrl}/${dbName}`)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const postRoutes = require('./routes/post');
const connectionRoutes = require('./routes/connection');
const jobRoutes = require('./routes/job');
const messageRoutes = require('./routes/message');
const uploadRoutes = require('./routes/upload');
const meetingRoutes = require('./routes/meeting');
const storyRoutes = require('./routes/story');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/stories', storyRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

app.set('io', io);

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('user-connected', (userId) => {
    // Remove any existing mapping for this user (in case of reconnection)
    for (const [uid, sid] of connectedUsers.entries()) {
      if (uid === userId && sid !== socket.id) {
        connectedUsers.delete(uid);
        console.log('Removed old socket mapping for user:', userId);
      }
    }
    connectedUsers.set(userId, socket.id);
    console.log('✅ User registered:', userId, 'Socket:', socket.id);
    console.log('📊 Active users:', Array.from(connectedUsers.keys()));
  });

  socket.on('send-message', async (data) => {
    console.log('📨 Received message:', data);
    try {
      const Message = require('./models/Message');
      const User = require('./models/User');
      
      // Validate sender is connected with receiver
      const sender = await User.findById(data.sender);
      if (!sender) {
        console.error('❌ Sender not found:', data.sender);
        socket.emit('message-error', { error: 'Sender not found' });
        return;
      }
      
      if (!sender.connections.includes(data.receiver)) {
        console.error('❌ Not connected with this user');
        socket.emit('message-error', { error: 'Not connected with this user' });
        return;
      }
      
      // Save message to database
      const message = new Message({
        sender: data.sender,
        receiver: data.receiver,
        text: data.text
      });
      await message.save();
      
      console.log('✅ Message saved to DB:', message._id);
      
      const messageData = {
        _id: message._id.toString(),
        sender: data.sender,
        receiver: data.receiver,
        text: data.text,
        createdAt: message.createdAt
      };
      
      // Send to receiver if online
      const receiverSocketId = connectedUsers.get(data.receiver);
      console.log('🔍 Looking for receiver:', data.receiver);
      console.log('🔍 Receiver Socket ID:', receiverSocketId);
      console.log('🔍 All connected users:', Array.from(connectedUsers.entries()));
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive-message', messageData);
        console.log('✅ Message sent to receiver socket:', receiverSocketId);
      } else {
        console.log('⚠️ Receiver not online');
      }
      
      // Confirm to sender
      socket.emit('message-sent', messageData);
      console.log('✅ Message confirmed to sender');
      
    } catch (error) {
      console.error('❌ Message error:', error);
      socket.emit('message-error', { error: error.message });
    }
  });

  socket.on('call-user', (data) => {
    console.log('Call initiated from', data.from, 'to', data.to);
    const receiverSocketId = connectedUsers.get(data.to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('call-signal', {
        from: data.from,
        signal: data.signal,
        callType: data.callType
      });
      console.log('Call signal sent to', data.to);
    } else {
      console.log('Receiver not online for call');
    }
  });

  socket.on('answer-call', (data) => {
    console.log('Call answered by', data.to);
    const callerSocketId = connectedUsers.get(data.to);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call-accepted', data.signal);
      console.log('Call accepted signal sent');
    }
  });

  socket.on('end-call', (data) => {
    const receiverSocketId = connectedUsers.get(data.to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('call-ended');
    }
  });
  
  // Meeting room events - Fixed for multi-user support
  const meetingRooms = new Map(); // meetingId -> Set of {socketId, userId, userName}
  
  socket.on('join-meeting', (data) => {
    const { meetingId, userId, userName } = data;
    console.log('User joining meeting:', data);
    
    // Join the socket.io room
    socket.join(meetingId);
    
    // Store user info for this socket
    socket.meetingId = meetingId;
    socket.userId = userId;
    socket.userName = userName;
    
    // Initialize room if it doesn't exist
    if (!meetingRooms.has(meetingId)) {
      meetingRooms.set(meetingId, new Set());
    }
    
    const room = meetingRooms.get(meetingId);
    
    // Get existing participants BEFORE adding new user
    const existingParticipants = Array.from(room).map(p => ({
      socketId: p.socketId,
      userId: p.userId,
      userName: p.userName
    }));
    
    console.log('Existing participants in meeting:', existingParticipants);
    
    // Add new participant to room
    room.add({
      socketId: socket.id,
      userId,
      userName
    });
    
    // Send existing participants to the new joiner
    socket.emit('existing-participants', existingParticipants);
    
    // Notify existing participants about the new user
    socket.to(meetingId).emit('user-joined', {
      socketId: socket.id,
      userId,
      userName
    });
    
    console.log(`User ${userName} joined meeting ${meetingId}. Total participants: ${room.size}`);
  });

  socket.on('send-signal', (data) => {
    const { to, signal } = data;
    console.log('Sending signal from', socket.id, 'to', to);
    io.to(to).emit('receive-signal', {
      from: socket.id,
      userId: socket.userId,
      userName: socket.userName,
      signal
    });
  });

  socket.on('return-signal', (data) => {
    const { to, signal } = data;
    console.log('Returning signal from', socket.id, 'to', to);
    io.to(to).emit('signal-returned', {
      from: socket.id,
      userId: socket.userId,
      userName: socket.userName,
      signal
    });
  });

  socket.on('leave-meeting', (data) => {
    const { meetingId, userId } = data;
    console.log('User leaving meeting:', userId, meetingId);
    
    if (meetingRooms.has(meetingId)) {
      const room = meetingRooms.get(meetingId);
      // Remove user from room
      for (const participant of room) {
        if (participant.socketId === socket.id) {
          room.delete(participant);
          break;
        }
      }
      // Clean up empty rooms
      if (room.size === 0) {
        meetingRooms.delete(meetingId);
      }
    }
    
    socket.leave(meetingId);
    socket.to(meetingId).emit('user-left', { socketId: socket.id, userId });
  });
  
  socket.on('disconnect', () => {
    // Remove from connected users
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log('User disconnected:', userId);
        break;
      }
    }
    
    // Remove from meeting rooms if in one
    if (socket.meetingId) {
      const meetingId = socket.meetingId;
      const userId = socket.userId;
      
      if (meetingRooms.has(meetingId)) {
        const room = meetingRooms.get(meetingId);
        for (const participant of room) {
          if (participant.socketId === socket.id) {
            room.delete(participant);
            break;
          }
        }
        if (room.size === 0) {
          meetingRooms.delete(meetingId);
        }
      }
      
      socket.to(meetingId).emit('user-left', { socketId: socket.id, userId });
    }
    
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 8001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };