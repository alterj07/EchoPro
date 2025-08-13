const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Create or get user
router.post('/create', async (req, res) => {
  try {
    const { userId, name, email, password } = req.body;
    
    console.log('Backend Debug - Request body received:');
    console.log('userId:', userId);
    console.log('name:', name);
    console.log('email:', email);
    console.log('password:', password);
    
    // Check if email already exists (if email is provided)
    if (email) {
      const existingUserWithEmail = await User.findOne({ email });
      if (existingUserWithEmail && existingUserWithEmail.userId !== userId) {
        return res.status(409).json({ 
          error: 'Email already exists',
          message: 'An account with this email address already exists. Please sign up instead.'
        });
      }
    }
    
    let user = await User.findOne({ userId });
    
    if (!user) {
      // Hash password if provided using bcrypt
      let hashedPassword = null;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds for better security
      }
      
      // Only create user if they don't exist - this should only happen during signup
      user = new User({
        userId,
        name: name, // Use the actual name parameter
        email,
        password: hashedPassword,
        // Initialize with clean progress data
        progress: [],
        stats: {
          totalQuizzesTaken: 0,
          totalQuestionsAnswered: 0,
          totalCorrectAnswers: 0,
          totalIncorrectAnswers: 0,
          totalSkippedAnswers: 0,
          overallAccuracy: 0,
          averageQuizScore: 0,
          bestQuizScore: 0,
          totalTimeSpent: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastQuizDate: null
        }
      });
      
      // Ensure all progress periods exist for new user
      user.ensureAllProgressPeriods(new Date());
      
      await user.save();
      console.log('New user created:', userId);
    } else {
      // Update existing user if email, name, or password is provided
      if (email) {
        user.email = email;
      }
      if (name) {
        user.name = name;
      }
      if (password) {
        user.password = await bcrypt.hash(password, 12); // Hash new password
      }
      await user.save();
    }
    
    // Don't return the password in the response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    console.error('Error creating/getting user:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(409).json({ 
        error: 'Email already exists',
        message: 'An account with this email address already exists. Please sign up instead.'
      });
    }
    
    res.status(500).json({ error: 'Failed to create/get user' });
  }
});

// Validate login credentials
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password required',
        message: 'Email and password are required for login'
      });
    }
    
    // Check if user with this email exists in database
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'No account found with this email address. Please sign up instead.'
      });
    }
    
    // Check if user has a password (for users created via email/password)
    if (!user.password) {
      return res.status(401).json({ 
        error: 'Invalid login method',
        message: 'This account was created with a different login method. Please use the original sign-in method.'
      });
    }
    
    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Invalid email or password. Please try again.'
      });
    }
    
    // Update last active time
    user.profile.lastActive = new Date();
    
    // Roll up stats if periods have passed
    await user.rollupStats();
    
    await user.save();
    
    // Don't return the password in the response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    // User exists and password is valid, return success
    res.json({ 
      message: 'Login successful',
      user: userResponse
    });
  } catch (error) {
    console.error('Error validating login:', error);
    res.status(500).json({ error: 'Failed to validate login' });
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
    
    // Roll up stats if periods have passed
    await user.rollupStats();
    
    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Clear user progress data
router.delete('/:userId/progress', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Clear all progress data for the user
    user.progress = [];
    user.stats = {
      totalQuizzesTaken: 0,
      totalQuestionsAnswered: 0,
      totalCorrectAnswers: 0,
      totalIncorrectAnswers: 0,
      totalSkippedAnswers: 0,
      overallAccuracy: 0,
      averageQuizScore: 0,
      bestQuizScore: 0,
      totalTimeSpent: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastQuizDate: null
    };
    
    // Ensure all progress periods exist after clearing
    user.ensureAllProgressPeriods(new Date());
    
    await user.save();
    
    res.json({
      message: 'User progress cleared successfully',
      progress: [],
      stats: user.stats
    });
  } catch (error) {
    console.error('Error clearing user progress:', error);
    res.status(500).json({ error: 'Failed to clear user progress' });
  }
});

// Update user progress
router.post('/:userId/progress', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period, quizData } = req.body;
    
    const user = await User.findOne({ userId });
    if (!user) {
      // Return default data if user doesn't exist yet
      return res.json({
        message: 'User not found - progress not updated',
        progress: {},
        overallStats: {
          totalQuizzesTaken: 0,
          totalQuestionsAnswered: 0,
          totalCorrectAnswers: 0,
          totalIncorrectAnswers: 0,
          totalSkippedAnswers: 0,
          overallAccuracy: 0,
          averageQuizScore: 0,
          bestQuizScore: 0,
          totalTimeSpent: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastQuizDate: null
        }
      });
    }
    
    // Roll up stats if periods have passed
    await user.rollupStats();
    
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
      // Return default data if user doesn't exist yet
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
    
    // Roll up stats if periods have passed
    await user.rollupStats();
    
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
      // Return default data if user doesn't exist yet
      return res.json({
        overallStats: {
          totalQuizzesTaken: 0,
          totalQuestionsAnswered: 0,
          totalCorrectAnswers: 0,
          totalIncorrectAnswers: 0,
          totalSkippedAnswers: 0,
          overallAccuracy: 0,
          averageQuizScore: 0,
          bestQuizScore: 0,
          totalTimeSpent: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastQuizDate: null
        },
        progress: {}
      });
    }
    
    // Roll up stats if periods have passed
    await user.rollupStats();
    
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

// Save quiz state (questions and current index)
router.post('/:userId/quiz-state', async (req, res) => {
  try {
    const { userId } = req.params;
    const { questions, currentQuestionIndex, dailyStats } = req.body;
    
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Roll up stats if periods have passed (this will reset daily progress if it's a new day)
    await user.rollupStats();
    
    // Find or create daily progress
    let dailyProgress = user.progress.find(p => p.period === 'daily');
    
    if (!dailyProgress) {
      dailyProgress = {
        period: 'daily',
        startDate: new Date(new Date().setHours(0, 0, 0, 0)),
        endDate: new Date(new Date().setHours(23, 59, 59, 999)),
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
        quizQuestions: [],
        currentQuestionIndex: 0,
        history: [],
        lastUpdated: new Date()
      };
      user.progress.push(dailyProgress);
    }
    
    // Update quiz state
    dailyProgress.quizQuestions = questions;
    dailyProgress.currentQuestionIndex = currentQuestionIndex;
    
    // Update daily stats if provided
    if (dailyStats) {
      dailyProgress.stats.correctAnswers = dailyStats.correct || 0;
      dailyProgress.stats.incorrectAnswers = dailyStats.incorrect || 0;
      dailyProgress.stats.skippedAnswers = dailyStats.skipped || 0;
      dailyProgress.stats.totalQuestions = (dailyStats.correct || 0) + (dailyStats.incorrect || 0) + (dailyStats.skipped || 0);
      
      // Add history entry if we have stats and it's not a duplicate
      if (dailyStats.correct > 0 || dailyStats.incorrect > 0 || dailyStats.skipped > 0) {
        const totalQuestions = (dailyStats.correct || 0) + (dailyStats.incorrect || 0) + (dailyStats.skipped || 0);
        const score = totalQuestions > 0 ? ((dailyStats.correct || 0) / totalQuestions) * 100 : 0;
        
        // Check if we already have a recent entry with the same stats to prevent duplicates
        
      }
    }
    
    dailyProgress.lastUpdated = new Date();
    user.profile.lastActive = new Date();
    
    // Save with retry logic for version conflicts
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        await user.save();
        break; // Success, exit retry loop
      } catch (error) {
        if (error.name === 'VersionError' && retries < maxRetries - 1) {
          console.log(`Version conflict on quiz-state save for user ${userId}, retrying... (${retries + 1}/${maxRetries})`);
          retries++;
          // Reload the document to get the latest version
          const freshUser = await User.findOne({ userId });
          if (!freshUser) {
            return res.status(404).json({ error: 'User not found after reload' });
          }
          // Update the user reference and dailyProgress reference
          user.set(freshUser.toObject());
          dailyProgress = user.progress.find(p => p.period === 'daily');
          if (!dailyProgress) {
            dailyProgress = {
              period: 'daily',
              startDate: new Date(new Date().setHours(0, 0, 0, 0)),
              endDate: new Date(new Date().setHours(23, 59, 59, 999)),
              stats: { totalQuizzes: 0, totalQuestions: 0, correctAnswers: 0, incorrectAnswers: 0, skippedAnswers: 0, averageScore: 0, bestScore: 0, worstScore: 0, streakDays: 0, currentStreak: 0, longestStreak: 0 },
              quizQuestions: [],
              currentQuestionIndex: 0,
              history: [],
              lastUpdated: new Date()
            };
            user.progress.push(dailyProgress);
          }
          // Reapply the changes
          dailyProgress.quizQuestions = questions;
          dailyProgress.currentQuestionIndex = currentQuestionIndex;
          dailyProgress.lastUpdated = new Date();
          user.profile.lastActive = new Date();
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 50));
        } else {
          throw error;
        }
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Quiz state saved successfully',
      currentQuestionIndex: currentQuestionIndex,
      questionsAnswered: dailyProgress.stats.totalQuestions
    });
  } catch (error) {
    console.error('Error saving quiz state:', error);
    res.status(500).json({ error: 'Failed to save quiz state' });
  }
});

// Clear quiz state (when quiz is completed)
router.delete('/:userId/quiz-state', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find daily progress and clear quiz state
    const dailyProgress = user.progress.find(p => p.period === 'daily');
    if (dailyProgress) {
      dailyProgress.quizQuestions = [];
      dailyProgress.currentQuestionIndex = 0;
      dailyProgress.lastUpdated = new Date();
    }
    
    user.profile.lastActive = new Date();
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Quiz state cleared successfully' 
    });
  } catch (error) {
    console.error('Error clearing quiz state:', error);
    res.status(500).json({ error: 'Failed to clear quiz state' });
  }
});

module.exports = router; 