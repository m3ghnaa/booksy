const Book = require('../models/Book');
const User = require('../models/User');

// Utility function to calculate streaks from reading log
const calculateStreaks = (readingLog, todayUTC) => {
  const uniqueDates = [...new Set(
    readingLog.map(log => new Date(log.date).toISOString().split('T')[0])
  )].sort();

  const reversedDates = [...uniqueDates].reverse(); // Newest first
  const todayStr = todayUTC.toISOString().split('T')[0];

  // Calculate current streak
  let currentStreak = 0;
  if (reversedDates.length > 0 && reversedDates[0] === todayStr) {
    currentStreak = 1;
    for (let i = 1; i < reversedDates.length; i++) {
      const currentDate = new Date(reversedDates[i - 1]);
      const prevDate = new Date(reversedDates[i]);
      const diffDays = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate max streak
  let maxStreak = 1;
  let currentMaxStreak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1]);
    const currentDate = new Date(uniqueDates[i]);
    const diffDays = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      currentMaxStreak++;
      maxStreak = Math.max(maxStreak, currentMaxStreak);
    } else {
      currentMaxStreak = 1;
    }
  }

  return { currentStreak, maxStreak };
};

// Add a new book to user's collection
const addBook = async (req, res) => {
  try {
    const { googleBookId, title, authors, thumbnail, pageCount, category } = req.body;

    if (!googleBookId || !title || !category) {
      return res.status(400).json({
        success: false,
        message: 'Book ID, title, and category are required'
      });
    }

    const existingBook = await Book.findOne({ googleBookId, userId: req.user.id });

    if (existingBook) {
      if (existingBook.category === category) {
        return res.status(409).json({
          success: false,
          message: 'Book already exists in this category'
        });
      }
      existingBook.category = category;
      await existingBook.save();
      return res.status(200).json({
        success: true,
        message: `Book moved from ${existingBook.category} to ${category}`,
        book: existingBook
      });
    }

    const newBook = new Book({
      googleBookId,
      title,
      authors,
      thumbnail,
      pageCount,
      userId: req.user.id,
      category
    });

    await newBook.save();

    res.status(201).json({
      success: true,
      message: 'Book added successfully',
      book: newBook
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all books for the current user, categorized
const getBooks = async (req, res) => {
  try {
    const books = await Book.find({ userId: req.user.id });

    const booksByCategory = {
      currentlyReading: books.filter(book => book.category === 'currentlyReading'),
      wantToRead: books.filter(book => book.category === 'wantToRead'),
      finishedReading: books.filter(book => book.category === 'finishedReading')
    };

    res.status(200).json({
      success: true,
      currentlyReading: booksByCategory.currentlyReading,
      wantToRead: booksByCategory.wantToRead,
      finishedReading: booksByCategory.finishedReading
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update book progress and calculate reading statistics
const updateProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookId = req.params.id;
    const { progress, progressType } = req.body;

    // Input validation
    if (!progress && progress !== 0 || !progressType) {
      return res.status(400).json({ message: 'Progress and progressType are required' });
    }

    // Find user and book
    const [user, book] = await Promise.all([
      User.findById(userId),
      Book.findById(bookId)
    ]);

    if (!user || !book) {
      return res.status(404).json({ message: 'User or Book not found' });
    }

    // Store previous pagesRead for totalPagesRead calculation
    const previousPagesRead = book.pagesRead || 0;

    // Calculate new pagesRead based on progressType
    let pagesRead;
    if (progressType === 'pages') {
      if (progress < 0 || (book.pageCount && progress > book.pageCount)) {
        return res.status(400).json({ message: 'Invalid page count' });
      }
      pagesRead = progress;
      book.progress = book.pageCount ? (progress / book.pageCount) * 100 : 0;
    } else if (progressType === 'percentage') {
      if (progress < 0 || progress > 100) {
        return res.status(400).json({ message: 'Progress must be between 0 and 100' });
      }
      pagesRead = book.pageCount ? Math.round((progress / 100) * book.pageCount) : 0;
      book.progress = progress;
    } else {
      return res.status(400).json({ message: 'Invalid progressType' });
    }

    // Update book data
    book.pagesRead = pagesRead;
    book.progressType = progressType;
    book.lastRead = new Date();

    // Calculate totalPagesRead for currentlyReading books
    let totalPagesRead = user.totalPagesRead || 0;
    if (book.category === 'currentlyReading') {
      const pagesReadDiff = pagesRead - previousPagesRead;
      totalPagesRead = Math.max(0, totalPagesRead + pagesReadDiff);
    }

    // Create a new reading log entry with normalized date (UTC midnight)
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const newReadingLogEntry = { date: todayUTC, pagesRead, bookId: book._id };

    // Combine all reading log entries for calculations
    const readingLog = [...(user.readingLog || []), newReadingLogEntry];

    // Calculate streaks
    const { currentStreak, maxStreak } = calculateStreaks(readingLog, todayUTC);
    const maxReadingStreak = Math.max(user.maxReadingStreak || 0, maxStreak);

    // Update book and user in parallel
    const [savedBook] = await Promise.all([
      book.save(),
      User.updateOne(
        { _id: userId },
        {
          $push: { readingLog: newReadingLogEntry },
          $set: {
            totalPagesRead,
            currentStreak,
            maxReadingStreak,
            lastReadingUpdate: new Date()
          }
        }
      )
    ]);

    res.status(200).json({
      message: 'Progress updated',
      book: savedBook,
      readingLog
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete a book
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Update totalPagesRead and remove readingLog entries
    const user = await User.findById(req.user.id);
    let totalPagesRead = user.totalPagesRead || 0;

    if (book.category === 'finishedReading' || book.category === 'currentlyReading') {
      const pagesToSubtract = book.category === 'finishedReading' ? (book.pageCount || 0) : (book.pagesRead || 0);
      totalPagesRead = Math.max(0, totalPagesRead - pagesToSubtract);

      // Remove readingLog entries for this book
      const updatedReadingLog = user.readingLog.filter(
        log => log.bookId.toString() !== book._id.toString()
      );

      // Recalculate streaks
      const todayUTC = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
      const { currentStreak, maxStreak } = calculateStreaks(updatedReadingLog, todayUTC);

      // Update user
      user.readingLog = updatedReadingLog;
      user.totalPagesRead = totalPagesRead;
      user.currentStreak = currentStreak;
      user.maxReadingStreak = maxStreak;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Book removed from shelf'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing book',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update book details (category)
const updateBook = async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    if (!['currentlyReading', 'wantToRead', 'finishedReading'].includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    const book = await Book.findOne({ _id: req.params.id, userId: req.user.id });
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    const oldCategory = book.category;
    book.category = category;
    await book.save();

    // Update totalPagesRead based on category change
    const user = await User.findById(req.user.id);
    const pageCount = book.pageCount || 0;
    const pagesRead = book.pagesRead || 0;
    let totalPagesRead = user.totalPagesRead || 0;

    if (category === 'finishedReading' && oldCategory !== 'finishedReading') {
      totalPagesRead += pageCount - (oldCategory === 'currentlyReading' ? pagesRead : 0);
    } else if (oldCategory === 'finishedReading' && category !== 'finishedReading') {
      totalPagesRead = Math.max(0, totalPagesRead - pageCount + (category === 'currentlyReading' ? pagesRead : 0));
    } else if (category === 'currentlyReading' && oldCategory !== 'currentlyReading') {
      totalPagesRead += pagesRead - (oldCategory === 'finishedReading' ? pageCount : 0);
    } else if (oldCategory === 'currentlyReading' && category !== 'currentlyReading') {
      totalPagesRead = Math.max(0, totalPagesRead - pagesRead + (category === 'finishedReading' ? pageCount : 0));
    }

    user.totalPagesRead = totalPagesRead;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating book',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  addBook,
  getBooks,
  updateProgress,
  deleteBook,
  updateBook
};