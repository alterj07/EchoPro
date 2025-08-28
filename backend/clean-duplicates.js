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

async function cleanDuplicates() {
  try {
    console.log('Cleaning duplicate history entries...');
    
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
    
    console.log('Before cleaning - History entries:', dailyProgress.history.length);
    
    // Remove duplicate entries (keep only unique entries based on correct/incorrect/skipped)
    const uniqueEntries = [];
    const seen = new Set();
    
    dailyProgress.history.forEach(entry => {
      const key = `${entry.correct}-${entry.incorrect}-${entry.skipped}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueEntries.push(entry);
      } else {
        console.log('Removing duplicate entry:', entry);
      }
    });
    
    dailyProgress.history = uniqueEntries;
    
    console.log('After cleaning - History entries:', dailyProgress.history.length);
    
    await user.save();
    
    console.log('Duplicate entries cleaned successfully!');
    
  } catch (error) {
    console.error('Error cleaning duplicates:', error);
  } finally {
    mongoose.connection.close();
  }
}

cleanDuplicates(); 