const express = require('express');
const router = express.Router();
const ChecklistResult = require('../models/ChecklistResult');
const User = require('../models/User');

// Submit checklist results
router.post('/submit', async (req, res) => {
  try {
    const { userId, answers, totalQuestions, correctCount, skipCount, percentage } = req.body;

    if (!userId || !answers || !totalQuestions || correctCount === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = new ChecklistResult({
      userId,
      answers,
      totalQuestions,
      correctCount,
      skipCount: skipCount || 0,
      percentage
    });

    await result.save();

    res.status(201).json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('Error submitting checklist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard data for a specific period
router.get('/dashboard/:userId/:period', async (req, res) => {
  try {
    const { userId, period } = req.params;
    const { year, month, week, day } = req.query;

    let startDate, endDate;
    const now = new Date();

    switch (period) {
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate = new Date(now.getFullYear(), now.getMonth(), diff);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59);
        break;
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      default:
        return res.status(400).json({ error: 'Invalid period' });
    }

    // Get results for the period
    const results = await ChecklistResult.find({
      userId,
      completedAt: { $gte: startDate, $lte: endDate }
    }).sort({ completedAt: -1 });

    // Calculate overall percentage for the period
    const totalCorrect = results.reduce((sum, result) => sum + result.correctCount, 0);
    const totalQuestions = results.reduce((sum, result) => sum + result.totalQuestions, 0);
    const overallPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    // Format history data
    const history = results.map(result => {
      const date = result.completedAt;
      let formattedDate;

      switch (period) {
        case 'year':
          formattedDate = date.getFullYear().toString();
          break;
        case 'month':
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                             'July', 'August', 'September', 'October', 'November', 'December'];
          formattedDate = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay() + 1);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          const monthNames2 = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
          formattedDate = `${monthNames2[weekStart.getMonth()]} ${weekStart.getDate()}-${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
          break;
        case 'day':
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const monthNames3 = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
          formattedDate = `${dayNames[date.getDay()]}, ${monthNames3[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
          break;
      }

      return {
        date: formattedDate,
        correct: `${result.correctCount}/${result.totalQuestions}`,
        skip: result.skipCount,
        percent: result.percentage,
        color: result.percentage >= 50 ? '#ffe066' : result.percentage >= 25 ? '#ffa366' : '#ff6666'
      };
    });

    res.json({
      period,
      percent: overallPercentage,
      history
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent results for a user
router.get('/recent/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const results = await ChecklistResult.find({ userId })
      .sort({ completedAt: -1 })
      .limit(limit);

    res.json(results);
  } catch (error) {
    console.error('Error getting recent results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 