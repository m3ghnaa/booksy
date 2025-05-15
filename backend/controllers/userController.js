const Book = require('../models/Book');
const User = require('../models/User');
const validator = require('validator');

// Allowed avatar values
const allowedAvatars = [
  'FaUserCircle',
  'FaUserAstronaut',
  'FaUserNinja',
  'FaUserSecret',
  'FaUserTie'
];

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch book statistics
    const totalBooks = await Book.countDocuments({ userId });
    const completedBooks = await Book.countDocuments({ userId, category: 'finishedReading' });
    const inProgressBooks = await Book.countDocuments({ userId, category: 'currentlyReading' });

    // Calculate total pages read
    const finishedBooks = await Book.find({ userId, category: 'finishedReading' });
    const readingBooks = await Book.find({ userId, category: 'currentlyReading' });

    const finishedPages = finishedBooks.reduce((sum, book) => sum + (book.pageCount || 0), 0);
    const readingPages = readingBooks.reduce((sum, book) => sum + (book.pagesRead || 0), 0);
    const totalPagesRead = finishedPages + readingPages;

    // Fetch user for readingLog and stats
    const user = await User.findById(userId).select('readingLog maxReadingStreak currentStreak');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate maximum streak
    let maxReadingStreak = user.maxReadingStreak || 0;
    if (user.readingLog.length > 0) {
      const sortedDates = [...new Set(
        user.readingLog.map(log => new Date(log.date).toISOString().split('T')[0])
      )].map(dateStr => new Date(dateStr)).sort((a, b) => a - b);

      let currentStreak = 1;
      let calculatedMaxStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const diffDays = (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          currentStreak += 1;
          calculatedMaxStreak = Math.max(calculatedMaxStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
      maxReadingStreak = Math.max(maxReadingStreak, calculatedMaxStreak);
    }

    // Update user stats
    user.totalPagesRead = totalPagesRead;
    user.maxReadingStreak = maxReadingStreak;
    await user.save();

    res.json({
      totalBooks,
      completedBooks,
      inProgressBooks,
      totalPagesRead,
      maxReadingStreak,
      currentStreak: user.currentStreak || 0
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching user stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user settings
const updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, favoriteGenre, readingGoal, avatar } = req.body;

    // Validate inputs
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }
    if (readingGoal !== undefined && readingGoal !== '') {
      const parsedReadingGoal = parseInt(readingGoal);
      if (isNaN(parsedReadingGoal) || parsedReadingGoal < 0) {
        return res.status(400).json({ message: 'Reading goal must be a non-negative number' });
      }
    }
    if (avatar && !allowedAvatars.includes(avatar)) {
      return res.status(400).json({ message: `Avatar must be one of: ${allowedAvatars.join(', ')}` });
    }

    // Check if email is taken by another user
    const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already in use' });
    }

    // Prepare update data
    const updateData = {
      name: name.trim(),
      email: email.toLowerCase()
    };
    if (favoriteGenre !== undefined) {
      updateData.favoriteGenre = favoriteGenre.trim();
    }
    if (readingGoal !== undefined && readingGoal !== '') {
      updateData.readingGoal = parseInt(readingGoal);
    }
    if (avatar) {
      updateData.avatar = avatar;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        favoriteGenre: updatedUser.favoriteGenre,
        readingGoal: updatedUser.readingGoal,
        avatar: updatedUser.avatar, // Include avatar in response
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        favoriteGenre: user.favoriteGenre || '',
        readingGoal: user.readingGoal || 0,
        avatar: user.avatar || 'FaUserCircle', // Include avatar
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getUserStats,
  updateUserSettings,
  getCurrentUser
};