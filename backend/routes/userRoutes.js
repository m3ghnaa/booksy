const express = require('express');
const router = express.Router();
const { getUserStats, updateUserSettings, updateUserProfile, getCurrentUser, deleteAvatar } = require('../controllers/userController');
const { getReadingActivity } = require('../controllers/readingActivityController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../config/multer');

router.get('/stats', protect, getUserStats);
router.get('/reading-activity', protect, getReadingActivity);
router.get('/me', protect, getCurrentUser);
router.put('/settings', protect, upload.single('avatar'), (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Route /settings hit with method PUT`);
  console.log('Request body in routes:', req.body);
  console.log('Request file in routes:', req.file);
  next();
}, updateUserSettings);
router.put('/profile', protect, updateUserProfile);
router.delete('/avatar', protect, deleteAvatar);

module.exports = router;