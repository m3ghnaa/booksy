const express = require('express');
const passport = require('passport');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcrypt');
const Book = require('../models/Book');

// Endpoint to start Google authentication
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  const { token } = req.body;
  console.log('Google token received:', token);  // Debugging log

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    console.log('Google ID Token verified successfully');  // Debugging log

    const payload = ticket.getPayload();
    console.log('Google payload:', payload);  // Debugging log

    // Check if user exists or create a new user
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      console.log('Creating new user with email:', payload.email);  // Debugging log
      user = await User.create({
        name: payload.name,
        email: payload.email,
        avatar: payload.picture,
        googleId: payload.sub,
        authType: 'google'
      });
      console.log('New user created:', user);  // Debugging log
    } else {
      console.log('User already exists:', user);  // Debugging log
      // Update the user's googleId if they're signing in with Google for the first time
      if (!user.googleId) {
        user.googleId = payload.sub;
        user.authType = 'google';
        await user.save();
      }
    }

    // Create JWT token
    const jwtToken = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('JWT token generated:', jwtToken);  // Debugging log

    res.json({ token: jwtToken, user });
  } catch (err) {
    console.error('Error verifying Google ID token:', err);
    res.status(500).json({ message: 'Authentication failed', error: err.message });
  }
});

// Signup Route
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  console.log('Received signup request for:', email);

  try {
    // Validate input
    if (!name || !email || !password) {
      console.log('Missing required fields in signup request');
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if the user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Create a new user with minimal required fields
    const userData = {
      name,
      email,
      password: hashedPassword,
      authType: 'local'
    };
    
    console.log('Creating new user with data:', { ...userData, password: '[HIDDEN]' });
    user = await User.create(userData);
    console.log('User created successfully:', user._id);

    // Generate and return a JWT token after successful signup
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('JWT token generated successfully');

    res.status(201).json({ 
      message: 'User signed up successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error('Signup error details:', err);
    // Return more specific error information
    res.status(500).json({ 
      message: 'Server error during signup',
      error: err.message,
      code: err.code,
      name: err.name
    });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if this is a Google authenticated user without a password
    if (user.authType === 'google' && !user.password) {
      return res.status(400).json({ 
        message: 'This account uses Google authentication. Please sign in with Google.'
      });
    }

    // Verify the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create and send JWT token
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/protected-route', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // exclude password

    // Example: Assume each book has a `status` field like "currentlyReading", "wantToRead", etc.
    const books = await Book.find({ user: req.user.id });

    const categorizedBooks = {
      currentlyReading: books.filter(book => book.status === 'currentlyReading'),
      wantToRead: books.filter(book => book.status === 'wantToRead'),
      finishedReading: books.filter(book => book.status === 'finishedReading')
    };

    res.status(200).json({
      user,
      books: categorizedBooks
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/books', protect, async (req, res) => {
  const { category, googleBookId, title, authors, thumbnail, pageCount } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(400).json({ message: 'User not found' });

    const newBook = new Book({ googleBookId, title, authors, thumbnail, pageCount, userId: user._id });

    // Add book to the appropriate category
    user.books[category].push(newBook);
    await user.save();

    res.status(200).json({ message: 'Book added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;