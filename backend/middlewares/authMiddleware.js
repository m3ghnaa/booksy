const jwt = require('jsonwebtoken');

/**
 * Authentication middleware to protect routes
 * Checks for token in cookies or Authorization header
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const protect = (req, res, next) => {
  let token;

  // Check for token in Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // Check for token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // If no token found, return unauthorized
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Not authorized, no token provided' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user data to request object
    req.user = decoded;
    console.log('Token verified successfully for user:', decoded.id);
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message, error.name);
    
    // Check if the error is due to token expiration
    if (error.name === 'TokenExpiredError') {
      console.log('TOKEN EXPIRED - Sending 401 with TOKEN_EXPIRED code');
      return res.status(401).json({ 
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    // For other token errors
    console.log('Token invalid - Sending 401');
    res.status(401).json({ 
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Not authorized, token is invalid' 
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token exists, but doesn't require it
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const optionalAuth = (req, res, next) => {
  let token;

  // Check for token in Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // Check for token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // If no token, continue without attaching user
  if (!token) {
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user data to request object
    req.user = decoded;
    next();
  } catch (error) {
    // Continue without attaching user if token is invalid
    next();
  }
};

module.exports = { protect, optionalAuth };