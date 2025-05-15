require('dotenv').config();
const mongoose = require('mongoose');

// Define the User schema (same as in your models/User.js)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  favoriteGenre: { type: String, default: '' },
  readingGoal: { type: Number, default: 0 },
  readingLog: [{ date: Date, pagesRead: Number }],
  maxReadingStreak: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  totalPagesRead: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  avatar: { type: String, default: 'FaUserCircle' }
});

const User = mongoose.model('User', userSchema);

const migrate = async () => {
  try {
    // Get MONGO_URI from environment variables
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in the environment variables');
    }

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully');

    // Find users without an avatar field
    console.log('Finding users without an avatar field...');
    const users = await User.find({ avatar: { $exists: false } });
    console.log(`Found ${users.length} users without an avatar field`);

    // Update each user
    let updatedCount = 0;
    for (const user of users) {
      user.avatar = 'FaUserCircle';
      await user.save();
      updatedCount++;
      console.log(`Updated user: ${user.email} (ID: ${user._id})`);
    }

    console.log(`Migration completed: Updated ${updatedCount} users`);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
};

// Run the migration
migrate();