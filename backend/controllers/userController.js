const Book = require('../models/Book');
const User = require('../models/User');
const validator = require('validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Base URL for serving uploads (adjust based on your server URL)
const SERVER_URL = process.env.SERVER_URL;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Uploads directory ensured at: ${uploadsDir}`);
} catch (err) {
  console.error(`Error ensuring uploads directory: ${err.message}`);
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads');
    console.log('Multer destination:', uploadPath);
    try {
      // Double-check directory exists at upload time
      fs.mkdirSync(uploadPath, { recursive: true });
      // Check if directory is writable
      fs.accessSync(uploadPath, fs.constants.W_OK);
      console.log('Uploads directory exists and is writable');
      cb(null, uploadPath);
    } catch (err) {
      console.error('Error with uploads directory:', err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    try {
      if (!req.user || !req.user.id) {
        console.error('User not authenticated for file upload');
        return cb(new Error('User not authenticated'));
      }
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
      const filename = `${req.user.id}-${uniqueSuffix}${ext}`;
      console.log('Multer filename:', filename, 'Original:', file.originalname);
      cb(null, filename);
    } catch (err) {
      console.error('Error generating filename:', err);
      cb(err);
    }
  }
});

const fileFilter = (req, file, cb) => {
  try {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    console.log('File mimetype:', file.mimetype);
    
    // Check if mimetype exists and is allowed
    if (file.mimetype && allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.error('Invalid file type:', file.mimetype);
      cb(new Error('Only PNG, JPG, and JPEG files are allowed'), false);
    }
  } catch (err) {
    console.error('Error in file filter:', err);
    cb(err);
  }
};

// Create multer upload instance with error handling
const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('avatar');

// Use multer directly since we need the callback pattern in the controller
const upload = uploadMiddleware;

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
      console.error('Multer upload error:', err);
      return res.status(400).json({ message: err.message });
    }

    try {
      const userId = req.user.id;
      const { name, email, favoriteGenre, readingGoal } = req.body;

      // Validate inputs
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Name is required' });
      }
      if (!email || !validator.isEmail(email)) {
        return res.status(400).json({ message: 'Valid email is required' });
      }
      if (readingGoal !== undefined && (isNaN(readingGoal) || parseInt(readingGoal) < 0)) {
        return res.status(400).json({ message: 'Reading goal must be a non-negative number' });
      }

      // Check if email is taken by another user
      const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
      if (existingUser) {
        return res.status(409).json({ message: 'Email is already in use' });
      }

      // Prepare update data
      const updateData = {
        name: name.trim(),
        email: email.toLowerCase(),
      };

      if (favoriteGenre !== undefined) {
        updateData.favoriteGenre = favoriteGenre.trim();
      }
      if (readingGoal !== undefined) {
        updateData.readingGoal = parseInt(readingGoal);
      }

      let avatarFilename = null;
      if (req.file) {
        try {
          // Ensure uploads directory exists
          const uploadsDir = path.join(__dirname, '../public/uploads');
          fs.mkdirSync(uploadsDir, { recursive: true });
          
          // Get current user
          const user = await User.findById(userId);
          
          // Remove old avatar if it exists
          if (user.avatar && user.avatar.includes('/uploads/')) {
            try {
              // Extract filename from avatar URL
              const oldAvatarFilename = user.avatar.split('/').pop().split('?')[0];
              const oldAvatarPath = path.join(__dirname, '../public/uploads', oldAvatarFilename);
              
              if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
                console.log(`Deleted old avatar: ${oldAvatarPath}`);
              }
            } catch (err) {
              console.error('Error deleting old avatar:', err);
              // Continue even if old avatar deletion fails
            }
          }
          
          // Set new avatar path
          avatarFilename = req.file.filename;
          const filePath = path.join(uploadsDir, req.file.filename);
          
          // Verify the file was saved
          if (!fs.existsSync(filePath)) {
            console.error(`Avatar file not found at ${filePath}`);
            return res.status(500).json({ message: 'Failed to save avatar' });
          }
          
          // Update avatar URL
          // Make sure we're using the correct server URL with HTTPS for production
          let serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
          
          // Ensure HTTPS is used for production URLs
          if (serverUrl.includes('onrender.com') && serverUrl.startsWith('http:')) {
            serverUrl = serverUrl.replace('http:', 'https:');
          }
          
          updateData.avatar = `${serverUrl}/uploads/${req.file.filename}`;
          console.log(`New avatar set: ${updateData.avatar}`);
        } catch (avatarError) {
          console.error('Avatar processing error:', avatarError);
          return res.status(500).json({ 
            message: 'Error processing avatar upload', 
            error: process.env.NODE_ENV === 'development' ? avatarError.message : undefined 
          });
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
          avatar: updatedUser.avatar,
          favoriteGenre: updatedUser.favoriteGenre,
          readingGoal: updatedUser.readingGoal,
        },
        avatarFilename,
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  });
};

/**
 * Update user profile (without avatar upload)
 */
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, favoriteGenre, readingGoal } = req.body;

    // Validate inputs
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (readingGoal !== undefined && (isNaN(readingGoal) || parseInt(readingGoal) < 0)) {
      return res.status(400).json({ message: 'Reading goal must be a non-negative number' });
    }

    // Prepare update data
    const updateData = {
      name: name.trim(),
    };

    if (favoriteGenre !== undefined) {
      updateData.favoriteGenre = favoriteGenre.trim();
    }
    if (readingGoal !== undefined) {
      updateData.readingGoal = parseInt(readingGoal);
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
        avatar: updatedUser.avatar,
        favoriteGenre: updatedUser.favoriteGenre,
        readingGoal: updatedUser.readingGoal,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
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
    console.log('Fetched current user:', {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      favoriteGenre: user.favoriteGenre,
      readingGoal: user.readingGoal,
    });
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        favoriteGenre: user.favoriteGenre || '',
        readingGoal: user.readingGoal || 0,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
        avatar: user.avatar || '',
        favoriteGenre: user.favoriteGenre || '',
        readingGoal: user.readingGoal || 0,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  getUserStats,
  updateUserSettings,
  updateUserProfile,
  getCurrentUser,
  deleteAvatar,
};