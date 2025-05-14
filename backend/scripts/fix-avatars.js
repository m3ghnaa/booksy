const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('Connected to MongoDB');

    const users = await User.find({ avatar: { $exists: true } });
    for (const user of users) {
      if (user.avatar && !user.avatar.startsWith('/uploads/')) {
        const filename = user.avatar.split('/').pop();
        user.avatar = `/uploads/${filename}`;
        await user.save();
        console.log(`Updated avatar for user ${user._id}: ${user.avatar}`);
      }
    }

    console.log('Avatar update complete');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error updating avatars:', err);
    mongoose.connection.close();
  });