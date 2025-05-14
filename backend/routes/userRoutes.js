const express = require('express');
const router = express.Router();
const { getUserStats, updateUserSettings, updateUserProfile, getCurrentUser, deleteAvatar } = require('../controllers/userController');
const { getReadingActivity } = require('../controllers/readingActivityController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/stats', protect, getUserStats);
router.get('/reading-activity', protect, getReadingActivity);
router.get('/me', protect, getCurrentUser);
router.put('/settings', protect, updateUserSettings);
router.put('/profile', protect, updateUserProfile);
router.delete('/avatar', protect, deleteAvatar);

module.exports = router;