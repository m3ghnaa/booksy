const jwt = require('jsonwebtoken');


const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('Authorization Header:', authHeader); 
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded); 
    req.user = decoded; 
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message); 
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

module.exports = { protect };