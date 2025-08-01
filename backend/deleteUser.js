const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/echopro', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function deleteUser(email) {
  try {
    console.log(`🗑️  Deleting user with email: ${email}`);
    
    // Find and delete the user
    const result = await User.deleteOne({ email: email });
    
    if (result.deletedCount > 0) {
      console.log(`✅ Successfully deleted user with email: ${email}`);
    } else {
      console.log(`❌ No user found with email: ${email}`);
    }
    
    // Show remaining users
    const remainingUsers = await User.find({}, { email: 1, name: 1, _id: 0 });
    console.log(`📊 Remaining users: ${remainingUsers.length}`);
    remainingUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}, Name: ${user.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error deleting user:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Delete the specific user
deleteUser('wwnspider@gmail.com'); 