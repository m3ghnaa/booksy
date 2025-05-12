const express = require('express');
const router = express.Router();
const { getUserStats } = require('../controllers/userController');
const { getReadingActivity } = require('../controllers/readingActivityController');
const { protect } = require('../middlewares/authMiddleware');
const { updateUserSettings } = require('../controllers/userController');

router.get('/stats', protect, getUserStats);
router.get('/reading-activity', protect, getReadingActivity);
router.put('/settings', protect, updateUserSettings);

module.exports = router;