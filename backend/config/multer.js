const multer = require('multer');

// Use memory storage since we'll upload to Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
  fileFilter: (req, file, cb) => {
    console.log('Multer - Request headers:', req.headers);
    console.log('Multer - File received:', file);
    if (!file) {
      console.log('Multer: No file received');
      return cb(null, false);
    }
    if (!file.mimetype.startsWith('image/')) {
      console.log('Multer: Invalid file type:', file.mimetype);
      return cb(new Error('Only images are allowed'), false);
    }
    console.log('Multer: File accepted');
    cb(null, true);
  },
}).single('avatar');

module.exports = upload;