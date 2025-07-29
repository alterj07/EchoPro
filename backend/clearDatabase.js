const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/echopro', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function clearDatabase() {
  try {
    console.log('🗑️  Clearing all users from MongoDB database...');
    
    // Delete all users
    const result = await User.deleteMany({});
    
    console.log(`✅ Deleted ${result.deletedCount} users from database`);
    console.log('🎉 Database cleared successfully!');
    
    // Verify database is empty
    const remainingUsers = await User.find({});
    console.log(`📊 Remaining users: ${remainingUsers.length}`);
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    mongoose.connection.close();
  }
}

clearDatabase(); 