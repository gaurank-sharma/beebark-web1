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
    connectedUsers.set(userId, socket.id);
    console.log('User registered:', userId, 'Socket:', socket.id);
    console.log('Active users:', Array.from(connectedUsers.keys()));
  });

  socket.on('send-message', async (data) => {
    console.log('Received message:', data);
    try {
      const Message = require('./models/Message');
      const User = require('./models/User');
      
      // Validate sender is connected with receiver
      const sender = await User.findById(data.sender);
      if (!sender) {
        console.error('Sender not found:', data.sender);
        socket.emit('message-error', { error: 'Sender not found' });
        return;
      }
      
      if (!sender.connections.includes(data.receiver)) {
        console.error('Not connected with this user');
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
      
      console.log('Message saved to DB:', message._id);
      
      const messageData = {
        _id: message._id.toString(),
        sender: data.sender,
        receiver: data.receiver,
        text: data.text,
        createdAt: message.createdAt
      };
      
      // Send to receiver if online
      const receiverSocketId = connectedUsers.get(data.receiver);
      console.log('Looking for receiver:', data.receiver, 'Socket:', receiverSocketId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive-message', messageData);
        console.log('Message sent to receiver socket:', receiverSocketId);
      } else {
        console.log('Receiver not online');
      }
      
      // Confirm to sender
      socket.emit('message-sent', messageData);
      console.log('Message confirmed to sender');
      
    } catch (error) {
      console.error('Message error:', error);
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
  
  // Meeting room events
  socket.on('join-meeting', (data) => {
    console.log('User joining meeting:', data);
    socket.join(data.meetingId);
    socket.to(data.meetingId).emit('user-joined', {
      userId: data.userId,
      userName: data.userName,
      signal: data.signal
    });
  });

  socket.on('returning-signal', (data) => {
    socket.to(data.to).emit('signal-returned', {
      userId: socket.userId,
      signal: data.signal
    });
  });

  socket.on('leave-meeting', (data) => {
    socket.leave(data.meetingId);
    socket.to(data.meetingId).emit('user-left', data.userId);
  });
  
  socket.on('disconnect', () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log('User disconnected:', userId);
        break;
      }
    }
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 8001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };