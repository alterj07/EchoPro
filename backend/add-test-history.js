const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/echopro', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function addTestHistory() {
  try {
    console.log('Adding test history data...');
    
    // Find the user
    const user = await User.findOne({ email: 'rafflit@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('Found user:', user.userId);
    
    // Find daily progress
    let dailyProgress = user.progress.find(p => p.period === 'daily');
    if (!dailyProgress) {
      console.log('No daily progress found');
      return;
    }
    
    console.log('Current daily progress:', dailyProgress);
    
    // Add some test history entries
    const testHistoryEntries = [
      {
        date: new Date(),
        quizId: 'quiz_test_1',
        questionsAnswered: 5,
        correct: 3,
        incorrect: 1,
        skipped: 1,
        score: 60,
        timeSpent: 120
      },
      {
        date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        quizId: 'quiz_test_2',
        questionsAnswered: 3,
        correct: 2,
        incorrect: 1,
        skipped: 0,
        score: 66.67,
        timeSpent: 90
      }
    ];
    
    // Add history entries
    dailyProgress.history.push(...testHistoryEntries);
    
    // Update stats to match history
    const totalCorrect = testHistoryEntries.reduce((sum, entry) => sum + entry.correct, 0);
    const totalIncorrect = testHistoryEntries.reduce((sum, entry) => sum + entry.incorrect, 0);
    const totalSkipped = testHistoryEntries.reduce((sum, entry) => sum + entry.skipped, 0);
    const totalQuestions = testHistoryEntries.reduce((sum, entry) => sum + entry.questionsAnswered, 0);
    
    dailyProgress.stats.correctAnswers = totalCorrect;
    dailyProgress.stats.incorrectAnswers = totalIncorrect;
    dailyProgress.stats.skippedAnswers = totalSkipped;
    dailyProgress.stats.totalQuestions = totalQuestions;
    dailyProgress.stats.totalQuizzes = testHistoryEntries.length;
    
    await user.save();
    
    console.log('Test history added successfully!');
    console.log('Updated daily progress:', dailyProgress);
    
  } catch (error) {
    console.error('Error adding test history:', error);
  } finally {
    mongoose.connection.close();
  }
}

addTestHistory(); 