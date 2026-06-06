const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('connections', 'name email profilePic bio');
    
    // Transform user object to include 'id' (consistent with login response)
    const userResponse = {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      intent: user.intent || [],
      industries: user.industries || [],
      location: user.location || '',
      onboardingCompleted: user.onboardingCompleted,
      isVerified: user.isVerified,
      profilePic: user.profilePic,
      bio: user.bio,
      skills: user.skills,
      experience: user.experience,
      connections: user.connections,
      pendingRequests: user.pendingRequests,
      sentRequests: user.sentRequests
    };
    
    res.json({ user: userResponse });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile', message: error.message });
  }
});

router.get('/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .populate('connections', 'name email profilePic');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile', message: error.message });
  }
});

router.put('/update', auth, async (req, res) => {
  try {
    const { name, bio, profilePic, skills, experience } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePic !== undefined) updateData.profilePic = profilePic;
    if (skills) updateData.skills = skills;
    if (experience) updateData.experience = experience;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile', message: error.message });
  }
});

// Onboarding: save intent / industries / basic profile and mark complete.
// Partial saves are allowed (per-step), completion is set on the final step.
router.put('/onboarding', auth, async (req, res) => {
  try {
    const { role, intent, industries, bio, location, skills, profilePic, complete } = req.body;

    const VALID_ROLES = ['student', 'professional', 'firm'];
    const VALID_INTENT = ['learn', 'network', 'hire', 'get_hired'];
    const VALID_INDUSTRY = ['architecture', 'interiors', 'construction', 'real_estate', 'related'];

    const update = {};
    if (VALID_ROLES.includes(role)) update.role = role;
    if (Array.isArray(intent)) {
      update.intent = intent.filter((i) => VALID_INTENT.includes(i));
    }
    if (Array.isArray(industries)) {
      update.industries = industries.filter((i) => VALID_INDUSTRY.includes(i));
    }
    if (bio !== undefined) update.bio = String(bio).slice(0, 500);
    if (location !== undefined) update.location = String(location).slice(0, 120);
    if (Array.isArray(skills)) update.skills = skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 30);
    if (profilePic !== undefined) update.profilePic = profilePic;
    if (complete === true) update.onboardingCompleted = true;

    const user = await User.findByIdAndUpdate(
      req.userId,
      update,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Onboarding saved', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save onboarding', message: error.message });
  }
});

router.get('/search/users', auth, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query too short' });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.userId } },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { bio: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name email profilePic bio role')
    .limit(20);

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Search failed', message: error.message });
  }
});

module.exports = router;