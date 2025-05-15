const multer = require('multer');

   // Use memory storage since we'll upload to Cloudinary
   const storage = multer.memoryStorage();

   const upload = multer({
     storage,
     limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
     fileFilter: (req, file, cb) => {
       console.log('Multer file filter - File received:', file);
       if (!file.mimetype.startsWith('image/')) {
         console.log('Multer file filter - Invalid file type:', file.mimetype);
         return cb(new Error('Only images are allowed'), false);
       }
       cb(null, true);
     },
   });

   module.exports = upload;