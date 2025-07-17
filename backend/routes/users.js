const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Create or get user
router.post('/create', async (req, res) => {
  try {
    const { userId, name, email } = req.body;
    
    let user = await User.findOne({ userId });
    
    if (!user) {
      user = new User({
        userId,
        name,
        email
      });
      await user.save();
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error creating/getting user:', error);
    res.status(500).json({ error: 'Failed to create/get user' });
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
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user progress
router.post('/:userId/progress', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period, quizData } = req.body;
    
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update progress for all periods
    const periods = ['daily', 'weekly', 'monthly', 'yearly', 'all-time'];
    const updatedProgress = {};
    
    for (const p of periods) {
      const progress = await user.updateProgress(p, quizData);
      updatedProgress[p] = progress;
    }
    
    res.json({
      message: 'Progress updated successfully',
      progress: updatedProgress,
      overallStats: user.stats
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get user progress for specific period
router.get('/:userId/progress/:period', async (req, res) => {
  try {
    const { userId, period } = req.params;
    
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const progress = user.getProgress(period);
    if (!progress) {
      return res.json({
        period,
        stats: {
          totalQuizzes: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          skippedAnswers: 0,
          averageScore: 0,
          bestScore: 0,
          worstScore: 0,
          streakDays: 0,
          currentStreak: 0,
          longestStreak: 0
        },
        history: []
      });
    }
    
    res.json(progress);
  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

// Get all user progress
router.get('/:userId/progress', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const allProgress = user.getAllProgress();
    res.json({
      overallStats: user.stats,
      progress: allProgress
    });
  } catch (error) {
    console.error('Error getting all progress:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

// Update user preferences
router.put('/:userId/preferences', async (req, res) => {
  try {
    console.log('req.body', req.body);
    const { userId } = req.params;
    console.log('userId', userId);
    const { preferences } = req.body;
    console.log('preferences', preferences);
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('hi');
    user.preferences = { ...user.preferences, ...preferences };
    await user.save();
    
    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Update user profile
router.put('/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const { profile } = req.body;
    
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.profile = { ...user.profile, ...profile };
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      profile: user.profile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get leaderboard (top users by accuracy)
router.get('/leaderboard/accuracy', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const users = await User.find({
      'stats.totalQuizzesTaken': { $gt: 0 }
    })
    .sort({ 'stats.overallAccuracy': -1 })
    .limit(parseInt(limit))
    .select('name stats.overallAccuracy stats.totalQuizzesTaken profile.avatar');
    
    res.json(users);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Get leaderboard (top users by streak)
router.get('/leaderboard/streak', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const users = await User.find({
      'stats.currentStreak': { $gt: 0 }
    })
    .sort({ 'stats.currentStreak': -1 })
    .limit(parseInt(limit))
    .select('name stats.currentStreak stats.longestStreak profile.avatar');
    
    res.json(users);
  } catch (error) {
    console.error('Error getting streak leaderboard:', error);
    res.status(500).json({ error: 'Failed to get streak leaderboard' });
  }
});

module.exports = router; 