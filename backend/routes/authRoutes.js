const express = require('express');
const passport = require('passport');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { 
  signup, 
  login, 
  logoutUser, 
  googleCallback, 
  googleLogin, 
  getCurrentUser,
  refreshToken
} = require('../controllers/authController');

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', signup);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/logout
 * @desc    Logout user and clear cookie
 * @access  Public
 */
router.get('/logout', logoutUser);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, getCurrentUser);

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get(
  '/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallback
);

/**
 * @route   POST /api/auth/google
 * @desc    Authenticate with Google token (client-side flow)
 * @access  Public
 */
router.post('/google', googleLogin);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', refreshToken);

module.exports = router;