const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { addBook, getBooks, updateProgress, deleteBook, updateBook } = require('../controllers/bookController');

router.post('/', protect, addBook);
router.get('/', protect, getBooks);
router.patch('/:id/progress', protect, updateProgress);
router.delete('/:id', protect, deleteBook);
router.put('/:id', protect, updateBook);

module.exports = router;