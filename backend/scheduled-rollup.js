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

async function runScheduledRollup() {
  try {
    console.log('Running scheduled rollup at:', new Date().toISOString());
    
    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to process`);
    
    let processedCount = 0;
    let rollupCount = 0;
    
    for (const user of users) {
      try {
        // Check if any rollup is needed by calling rollupStats
        const beforeProgress = user.progress.length;
        await user.rollupStats();
        const afterProgress = user.progress.length;
        
        if (afterProgress > beforeProgress) {
          rollupCount++;
          console.log(`Rollup performed for user: ${user.userId}`);
        }
        
        processedCount++;
      } catch (error) {
        console.error(`Error processing user ${user.userId}:`, error);
      }
    }
    
    console.log(`Scheduled rollup completed. Processed ${processedCount} users, performed ${rollupCount} rollups.`);
    
  } catch (error) {
    console.error('Error in scheduled rollup:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the rollup
runScheduledRollup(); 