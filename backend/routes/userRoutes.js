const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getUserStats, updateUserSettings, getCurrentUser } = require('../controllers/userController');
const { getReadingActivity } = require('../controllers/readingActivityController');

router.get('/stats', protect, getUserStats);
router.get('/reading-activity', protect, getReadingActivity);
router.get('/me', protect, getCurrentUser);
router.put('/settings', protect, updateUserSettings);

module.exports = router;