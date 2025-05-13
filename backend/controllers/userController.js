const Book = require('../models/Book');
const User = require('../models/User');
const validator = require('validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// Base URL for serving uploads (adjust based on your server URL)
const BASE_URL = process.env.SERVER_URL || 'http://localhost:5000';

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads');
    console.log('Multer destination:', uploadPath);
    try {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log('Uploads directory created or exists');
      cb(null, uploadPath);
    } catch (err) {
      console.error('Error creating uploads directory:', err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${req.user.id}-${uniqueSuffix}${ext}`;
    console.log('Multer filename:', filename, 'Original:', file.originalname);
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  console.log('File mimetype:', file.mimetype);
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG, JPG, and JPEG files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('avatar');

// Controller for getting user stats
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch book statistics
    const totalBooks = await Book.countDocuments({ userId });
    const completedBooks = await Book.countDocuments({ userId, category: 'finishedReading' });
    const inProgressBooks = await Book.countDocuments({ userId, category: 'currentlyReading' });

    // Fetch books for total pages read
    const finishedBooks = await Book.find({ userId, category: 'finishedReading' });
    const readingBooks = await Book.find({ userId, category: 'currentlyReading' });

    // Calculate total pages read
    const finishedPages = finishedBooks.reduce((sum, book) => {
      const pageCount = typeof book.pageCount === 'number' && !isNaN(book.pageCount) ? book.pageCount : 0;
      return sum + pageCount;
    }, 0);
    const readingPages = readingBooks.reduce((sum, book) => {
      const pagesRead = typeof book.pagesRead === 'number' && !isNaN(book.pagesRead) ? book.pagesRead : 0;
      return sum + pagesRead;
    }, 0);
    const totalPagesRead = finishedPages + readingPages;

    // Fetch user for readingLog and stats
    const user = await User.findById(userId).select('readingLog totalPagesRead maxReadingStreak currentStreak');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate maximum streak
    let maxReadingStreak = user.maxReadingStreak || 0;
    if (user.readingLog.length > 0) {
      const sortedDates = [...new Set(
        user.readingLog.map((log) => new Date(log.date).toISOString().split('T')[0])
      )].map((dateStr) => new Date(dateStr)).sort((a, b) => a - b);

      let currentStreak = 1;
      let calculatedMaxStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = sortedDates[i - 1];
        const currentDate = sortedDates[i];
        const diffDays = (currentDate - prevDate) / (1000 * 60 * 60 * 24);

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
      currentStreak: user.currentStreak || 0,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      message: 'Error fetching user stats',
      error: error.message,
    });
  }
};



/**
 * Update user settings
 */
const updateUserSettings = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const userId = req.user.id;
      const { name, email } = req.body;

      // Validate inputs
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Name is required' });
      }
      if (!email || !validator.isEmail(email)) {
        return res.status(400).json({ message: 'Valid email is required' });
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

      let avatarFilename = null;
      if (req.file) {
        const user = await User.findById(userId);
        if (user.avatar && user.avatar.startsWith(`${process.env.SERVER_URL}/uploads/`)) {
          const oldAvatarPath = path.join(__dirname, '../public', user.avatar.replace(`${process.env.SERVER_URL}`, ''));
          try {
            fs.unlinkSync(oldAvatarPath);
          } catch (err) {}
        }
        updateData.avatar = `${process.env.SERVER_URL}/uploads/${req.file.filename}`;
        avatarFilename = req.file.filename;
        const filePath = path.join(__dirname, '../public/uploads', req.file.filename);
        if (!fs.existsSync(filePath)) {
          return res.status(500).json({ message: 'Failed to save avatar' });
        }
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
          avatar: updatedUser.avatar
        },
        avatarFilename
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
};


/**
 * Get current user
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Fetched current user:', { _id: user._id, name: user.name, email: user.email, avatar: user.avatar });
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || ''
      }
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete user avatar
 */
const deleteAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the avatar file from the uploads folder
    if (user.avatar && user.avatar.startsWith(`${process.env.SERVER_URL}/uploads/`)) {
      const filename = user.avatar.split('/').pop().split('?')[0];
      const filePath = path.join(__dirname, '../public/uploads', filename);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted avatar file: ${filePath}`);
        } else {
          console.log(`Avatar file not found: ${filePath}`);
        }
      } catch (err) {
        console.error('Error deleting avatar file:', err);
        // Continue even if file deletion fails (file might already be deleted)
      }
    }

    // Update user avatar to null
    user.avatar = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar removed successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || ''
      }
    });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getUserStats,
  updateUserSettings,
  getCurrentUser,
  deleteAvatar
};