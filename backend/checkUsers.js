const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/echopro', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkUsers() {
  try {
    console.log('🔍 Checking users in MongoDB database...');
    
    const users = await User.find({}, { email: 1, name: 1, userId: 1, _id: 0 });
    
    console.log(`📊 Found ${users.length} users in database:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}, Name: ${user.name}, UserID: ${user.userId}`);
    });
    
    // Check specifically for the email that's causing issues
    const specificUser = await User.findOne({ email: 'wwnspider@gmail.com' });
    if (specificUser) {
      console.log('\n⚠️  Found user with email wwnspider@gmail.com:');
      console.log(`   Name: ${specificUser.name}`);
      console.log(`   UserID: ${specificUser.userId}`);
      console.log(`   Has password: ${!!specificUser.password}`);
    } else {
      console.log('\n✅ No user found with email wwnspider@gmail.com');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkUsers(); 