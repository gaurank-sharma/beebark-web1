const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get stories from connections
router.get('/feed', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('connections');
    const connectionIds = user.connections.map(c => c._id);
    connectionIds.push(req.userId); // Include own stories

    const stories = await Story.find({
      author: { $in: connectionIds },
      expiresAt: { $gt: new Date() }
    })
    .populate('author', 'name profilePic username')
    .sort({ createdAt: -1 });

    // Group stories by author
    const groupedStories = {};
    stories.forEach(story => {
      const authorId = story.author._id.toString();
      if (!groupedStories[authorId]) {
        groupedStories[authorId] = {
          author: story.author,
          stories: []
        };
      }
      groupedStories[authorId].stories.push(story);
    });

    res.json({ stories: Object.values(groupedStories) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stories', message: error.message });
  }
});

// Create a new story
router.post('/create', auth, async (req, res) => {
  try {
    const { mediaUrl, caption, mediaType } = req.body;

    if (!mediaUrl) {
      return res.status(400).json({ error: 'Media URL is required' });
    }

    const story = new Story({
      author: req.userId,
      mediaUrl,
      caption: caption || '',
      mediaType: mediaType || 'image'
    });

    await story.save();
    await story.populate('author', 'name profilePic username');

    res.status(201).json({ message: 'Story created successfully', story });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create story', message: error.message });
  }
});

// Mark story as viewed
router.post('/:storyId/view', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);
    
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (!story.views.includes(req.userId)) {
      story.views.push(req.userId);
      await story.save();
    }

    res.json({ message: 'Story viewed', viewCount: story.views.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark story as viewed', message: error.message });
  }
});

// Delete own story
router.delete('/:storyId', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);
    
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (story.author.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this story' });
    }

    await Story.findByIdAndDelete(req.params.storyId);
    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete story', message: error.message });
  }
});

module.exports = router;
