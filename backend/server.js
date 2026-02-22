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

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/messages', messageRoutes);

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
    console.log('User registered:', userId);
  });

  socket.on('send-message', async (data) => {
    try {
      const Message = require('./models/Message');
      const message = new Message({
        sender: data.sender || socket.userId,
        receiver: data.receiver,
        text: data.text
      });
      await message.save();
      
      const receiverSocketId = connectedUsers.get(data.receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive-message', message);
      }
      socket.emit('message-sent', message);
    } catch (error) {
      console.error('Message error:', error);
      socket.emit('message-error', { error: error.message });
    }
  });

  socket.on('call-user', (data) => {
    const receiverSocketId = connectedUsers.get(data.to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('incoming-call', {
        from: data.from,
        callType: data.callType
      });
    }
  });
  
  socket.on('disconnect', () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 8001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };