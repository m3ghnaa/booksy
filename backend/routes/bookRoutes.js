// routes/bookRoutes.js
const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const { protect } = require('../middlewares/authMiddleware');

// POST /api/books
router.post('/', protect, async (req, res) => {
  const { googleBookId, title, authors, thumbnail, pageCount, category } = req.body;

  try {
    const existingBook = await Book.findOne({
      googleBookId,
      userId: req.user.id,
      category,
    });

    if (existingBook) {
      return res.status(409).json({ message: 'Book already exists in this category' });
    }

    const newBook = new Book({
      googleBookId,
      title,
      authors,
      thumbnail,
      pageCount,
      userId: req.user.id,
      category, // Add category to Book model
    });

    await newBook.save();

    return res.status(201).json({ message: 'Book added successfully', book: newBook });
  } catch (error) {
    console.error('Error adding book:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
