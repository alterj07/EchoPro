const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testRollup() {
  try {
    console.log('Testing rollup functionality...');
    
    // Find a test user
    const user = await User.findOne({});
    if (!user) {
      console.log('No users found in database');
      return;
    }
    
    console.log('Testing with user:', user.userId);
    console.log('Current progress periods:', user.progress.map(p => p.period));
    
    // Show current stats
    console.log('\nCurrent stats:');
    user.progress.forEach(p => {
      console.log(`${p.period}:`, {
        totalQuizzes: p.stats.totalQuizzes,
        totalQuestions: p.stats.totalQuestions,
        correctAnswers: p.stats.correctAnswers,
        incorrectAnswers: p.stats.incorrectAnswers,
        skippedAnswers: p.stats.skippedAnswers,
        startDate: p.startDate,
        endDate: p.endDate
      });
    });
    
    // Test rollup
    console.log('\nRunning rollup...');
    await user.rollupStats();
    
    console.log('\nAfter rollup stats:');
    user.progress.forEach(p => {
      console.log(`${p.period}:`, {
        totalQuizzes: p.stats.totalQuizzes,
        totalQuestions: p.stats.totalQuestions,
        correctAnswers: p.stats.correctAnswers,
        incorrectAnswers: p.stats.incorrectAnswers,
        skippedAnswers: p.stats.skippedAnswers,
        startDate: p.startDate,
        endDate: p.endDate
      });
    });
    
    console.log('\nRollup test completed!');
    
  } catch (error) {
    console.error('Error testing rollup:', error);
  } finally {
    mongoose.connection.close();
  }
}

testRollup(); 