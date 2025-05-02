const express = require('express');
const passport = require('passport');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcrypt');
const Book = require('../models/Book');

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        name: payload.name,
        email: payload.email,
        avatar: payload.picture,
        googleId: payload.sub,
        authType: 'google'
      });
    } else {
      if (!user.googleId) {
        user.googleId = payload.sub;
        user.authType = 'google';
        await user.save();
      }
    }


    const jwtToken = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token: jwtToken, user });
  } catch (err) {
    console.error('Error verifying Google ID token:', err);
    res.status(500).json({ message: 'Authentication failed', error: err.message });
  }
});


router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  console.log('Received signup request for:', email);

  try {
    if (!name || !email || !password) {
      console.log('Missing required fields in signup request');
      return res.status(400).json({ message: 'All fields are required' });
    }

    let user = await User.findOne({ email });
    if (user) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    const userData = {
      name,
      email,
      password: hashedPassword,
      authType: 'local'
    };
    
    console.log('Creating new user with data:', { ...userData, password: '[HIDDEN]' });
    user = await User.create(userData);
    console.log('User created successfully:', user._id);

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
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
    res.status(500).json({ 
      message: 'Server error during signup',
      error: err.message,
      code: err.code,
      name: err.name
    });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.authType === 'google' && !user.password) {
      return res.status(400).json({ 
        message: 'This account uses Google authentication. Please sign in with Google.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
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
    const user = await User.findById(req.user.id).select('-password');
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
    user.books[category].push(newBook);
    await user.save();

    res.status(200).json({ message: 'Book added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;