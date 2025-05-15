const express = require('express');
  const dotenv = require('dotenv');
  const cors = require('cors');
  const passport = require('passport');
  const cookieParser = require('cookie-parser');
  const authRoutes = require('./routes/authRoutes');
  const bookRoutes = require('./routes/bookRoutes');
  const userRoutes = require('./routes/userRoutes');
  const path = require('path');
  const fs = require('fs');

  // Load environment variables
  dotenv.config();

  // Initialize Passport config
  require('./config/passport');

  // Initialize Express app
  const app = express();

  // Create public/uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, 'public/uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });

  // Serve static files from public/uploads
  app.use('/uploads', express.static(uploadsDir));

  // CORS configuration
  app.use(cors({
    origin: 'https://booksy-shelf.netlify.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
  }));

  // Handle preflight requests explicitly
  app.options('*', cors({
    origin: 'https://booksy-shelf.netlify.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
  }));

  // Set Cross-Origin-Opener-Policy header
  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    next();
  });

  // Body parser middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Cookie parser middleware
  app.use(cookieParser());

  // Initialize Passport
  app.use(passport.initialize());

  // API health check route
  app.get('/', (req, res) => {
    res.status(200).json({ 
      success: true, 
      message: 'API is running', 
      version: '1.0.0' 
    });
  });

  // Add middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/books', bookRoutes);
  app.use('/api/users', userRoutes);

  // Test logging endpoint
app.get('/test-logging', (req, res) => {
  console.log('Test logging endpoint hit at:', new Date().toISOString());
  res.json({ message: 'Logging test successful' });
});

  // 404 handler
  app.use((req, res, next) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.originalUrl}`
    });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  // MongoDB Connection
  const { connectDB } = require('./config/db');
  connectDB();

  // Start server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  module.exports = app;