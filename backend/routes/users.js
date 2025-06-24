const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Create or get user
router.post('/create', async (req, res) => {
  try {
    const { userId, name } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let user = await User.findOne({ userId });

    if (!user) {
      user = new User({
        userId,
        name
      });
      await user.save();
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user preferences
router.put('/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    const { fontSize } = req.body;

    if (!fontSize || !['small', 'medium', 'big'].includes(fontSize)) {
      return res.status(400).json({ error: 'Invalid fontSize value' });
    }

    const user = await User.findOneAndUpdate(
      { userId },
      { 'preferences.fontSize': fontSize },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 