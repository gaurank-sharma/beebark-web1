const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

router.post('/send-request/:targetUserId', auth, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    
    if (req.userId.toString() === targetUserId) {
      return res.status(400).json({ error: 'Cannot send request to yourself' });
    }

    const currentUser = await User.findById(req.userId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentUser.connections.includes(targetUserId)) {
      return res.status(400).json({ error: 'Already connected' });
    }

    if (targetUser.pendingRequests.includes(req.userId)) {
      return res.status(400).json({ error: 'Request already sent' });
    }

    targetUser.pendingRequests.push(req.userId);
    currentUser.sentRequests.push(targetUserId);

    await targetUser.save();
    await currentUser.save();

    res.json({ message: 'Connection request sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send request', message: error.message });
  }
});

router.post('/accept-request/:requesterId', auth, async (req, res) => {
  try {
    const { requesterId } = req.params;

    const currentUser = await User.findById(req.userId);
    const requester = await User.findById(requesterId);

    if (!requester) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!currentUser.pendingRequests.includes(requesterId)) {
      return res.status(400).json({ error: 'No pending request from this user' });
    }

    currentUser.pendingRequests = currentUser.pendingRequests.filter(
      id => id.toString() !== requesterId
    );
    requester.sentRequests = requester.sentRequests.filter(
      id => id.toString() !== req.userId.toString()
    );

    currentUser.connections.push(requesterId);
    requester.connections.push(req.userId);

    await currentUser.save();
    await requester.save();

    res.json({ message: 'Connection request accepted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept request', message: error.message });
  }
});

router.post('/reject-request/:requesterId', auth, async (req, res) => {
  try {
    const { requesterId } = req.params;

    const currentUser = await User.findById(req.userId);
    const requester = await User.findById(requesterId);

    if (!requester) {
      return res.status(404).json({ error: 'User not found' });
    }


router.get('/suggestions', auth, async (req, res) => {
  try {
    const { getConnectionSuggestions } = require('../utils/recommendationEngine');
    const suggestions = await getConnectionSuggestions(req.userId, 10);
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suggestions', message: error.message });
  }
});

    currentUser.pendingRequests = currentUser.pendingRequests.filter(
      id => id.toString() !== requesterId
    );
    requester.sentRequests = requester.sentRequests.filter(
      id => id.toString() !== req.userId.toString()
    );

    await currentUser.save();
    await requester.save();

    res.json({ message: 'Connection request rejected' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject request', message: error.message });
  }
});

router.get('/pending', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('pendingRequests', 'name email profilePic bio');
    
    res.json({ requests: user.pendingRequests });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch requests', message: error.message });
  }
});

router.get('/list', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('connections', 'name email profilePic bio role');
    
    res.json({ connections: user.connections });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch connections', message: error.message });
  }
});

module.exports = router;