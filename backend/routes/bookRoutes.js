const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  addBook,
  getBooks,
  updateProgress,
  deleteBook,
  updateBook
} = require('../controllers/bookController');

/**
 * @route   POST /api/books
 * @desc    Add a new book to user's collection
 * @access  Private
 */
router.post('/', protect, addBook);

/**
 * @route   GET /api/books
 * @desc    Get all books for the current user, categorized
 * @access  Private
 */
router.get('/', protect, getBooks);

/**
 * @route   PATCH /api/books/:id/progress
 * @desc    Update book progress
 * @access  Private
 */
router.patch('/:id/progress', protect, updateProgress);

/**
 * @route   DELETE /api/books/:id
 * @desc    Delete a book
 * @access  Private
 */
router.delete('/:id', protect, deleteBook);

/**
 * @route   PUT /api/books/:id
 * @desc    Update book details (category, progress)
 * @access  Private
 */
router.put('/:id', protect, updateBook);

module.exports = router;
