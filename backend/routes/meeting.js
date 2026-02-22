const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');

router.post('/create', auth, async (req, res) => {
  try {
    const { title, scheduledTime, participants, duration } = req.body;

    const meetingId = crypto.randomBytes(6).toString('hex');

    const meeting = new Meeting({
      host: req.userId,
      meetingId,
      title: title || 'Untitled Meeting',
      scheduledTime: scheduledTime || Date.now(),
      participants: participants || [],
      duration: duration || 60,
      status: scheduledTime > Date.now() ? 'scheduled' : 'ongoing'
    });

    await meeting.save();
    await meeting.populate('host', 'name email profilePic');

    res.status(201).json({ message: 'Meeting created', meeting });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create meeting', message: error.message });
  }
});

router.get('/list', auth, async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [
        { host: req.userId },
        { participants: req.userId }
      ],
      status: { $in: ['scheduled', 'ongoing'] }
    })
    .populate('host', 'name email profilePic')
    .populate('participants', 'name email profilePic')
    .sort({ scheduledTime: 1 });

    res.json({ meetings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meetings', message: error.message });
  }
});

router.get('/:meetingId', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId })
      .populate('host', 'name email profilePic')
      .populate('participants', 'name email profilePic');

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json({ meeting });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meeting', message: error.message });
  }
});

router.post('/:meetingId/join', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (!meeting.participants.includes(req.userId) && meeting.host.toString() !== req.userId.toString()) {
      meeting.participants.push(req.userId);
    }

    if (meeting.status === 'scheduled') {
      meeting.status = 'ongoing';
    }

    await meeting.save();
    await meeting.populate('host', 'name email profilePic');
    await meeting.populate('participants', 'name email profilePic');

    res.json({ message: 'Joined meeting', meeting });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join meeting', message: error.message });
  }
});

router.put('/:meetingId/end', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (meeting.host.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Only host can end the meeting' });
    }

    meeting.status = 'ended';
    await meeting.save();

    res.json({ message: 'Meeting ended', meeting });
  } catch (error) {
    res.status(500).json({ error: 'Failed to end meeting', message: error.message });
  }
});

router.delete('/:meetingId', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (meeting.host.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Only host can delete the meeting' });
    }

    await meeting.deleteOne();

    res.json({ message: 'Meeting deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete meeting', message: error.message });
  }
});

module.exports = router;
