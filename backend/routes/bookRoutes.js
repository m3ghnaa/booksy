const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const { protect } = require('../middlewares/authMiddleware');

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
        category,
      });
  
      await newBook.save();
  
      return res.status(201).json({ message: 'Book added successfully', book: newBook });
    } catch (error) {
      console.error('Error adding book:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  

router.get('/', protect, async (req, res) => {
  try {
    const books = await Book.find({ userId: req.user.id });
    const booksByCategory = {
      currentlyReading: books.filter(book => book.category === 'currentlyReading'),
      wantToRead: books.filter(book => book.category === 'wantToRead'),
      finishedReading: books.filter(book => book.category === 'finishedReading'),
    };

    res.json(booksByCategory);
  } catch (error) {
    console.error('Failed to fetch books:', error);
    res.status(500).json({ message: 'Failed to fetch books' });
  }
});

router.patch('/:id/progress', protect, async (req, res) => {
  const { progress } = req.body;

  try {
    const book = await Book.findOne({ _id: req.params.id, userId: req.user.id });
    if (!book || book.category !== 'currentlyReading') {
      return res.status(404).json({ message: 'Book not found or not in the "currentlyReading" category' });
    }

    book.progress = progress;
    await book.save();

    res.json({ message: 'Progress updated', book });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ message: 'Error updating progress' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const book = await Book.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({ message: 'Book removed from shelf' });
  } catch (error) {
    console.error('Error removing book:', error);
    res.status(500).json({ message: 'Error removing book' });
  }
});

router.put('/:id', protect, async (req, res) => {
    const { category, progress } = req.body;
  
    try {
      const book = await Book.findOne({ _id: req.params.id, userId: req.user.id });
  
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }

      if (category) {
        book.category = category;
      }
  
      if (typeof progress === 'number') {
        if (book.category !== 'currentlyReading') {
          return res.status(400).json({ message: 'Progress can only be updated for books in "currentlyReading"' });
        }
        book.progress = progress;
      }
  
      await book.save();
  
      res.json({ message: 'Book updated successfully', book });
    } catch (error) {
      console.error('Error updating book:', error);
      res.status(500).json({ message: 'Error updating book' });
    }
  });
  

module.exports = router;
