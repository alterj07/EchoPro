const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}
mongoose.connect(process.env.MONGODB_URI, {
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