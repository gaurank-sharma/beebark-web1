const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.get('/:connectionId', auth, async (req, res) => {
  try {
    const { connectionId } = req.params;
    
    const user = await User.findById(req.userId);
    if (!user.connections.includes(connectionId)) {
      return res.status(403).json({ error: 'Not connected with this user' });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: connectionId },
        { sender: connectionId, receiver: req.userId }
      ]
    })
    .sort({ createdAt: 1 })
    .limit(100);

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages', message: error.message });
  }
});

router.post('/send', auth, async (req, res) => {
  try {
    const { receiver, text } = req.body;

    if (!text || !receiver) {
      return res.status(400).json({ error: 'Receiver and text are required' });
    }

    const user = await User.findById(req.userId);
    if (!user.connections.includes(receiver)) {
      return res.status(403).json({ error: 'Can only message connections' });
    }

    const message = new Message({
      sender: req.userId,
      receiver,
      text
    });

    await message.save();
    
    // Try to send via socket.io if receiver is online
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    
    if (io && connectedUsers) {
      const receiverSocketId = connectedUsers.get(receiver);
      if (receiverSocketId) {
        const messageData = {
          _id: message._id.toString(),
          sender: req.userId,
          receiver,
          text,
          createdAt: message.createdAt
        };
        io.to(receiverSocketId).emit('receive-message', messageData);
        console.log('✅ Message delivered via socket to:', receiverSocketId);
      }
    }

    res.json({ 
      message: 'Message sent', 
      data: {
        _id: message._id.toString(),
        sender: req.userId,
        receiver,
        text,
        createdAt: message.createdAt
      }
    });
  } catch (error) {
    console.error('Message send error:', error);
    res.status(500).json({ error: 'Failed to send message', message: error.message });
  }
});

module.exports = router;
