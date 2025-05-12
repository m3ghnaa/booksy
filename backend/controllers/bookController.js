const Book = require('../models/Book');
const User = require('../models/User');

/**
 * Add a new book to user's collection
 */
const addBook = async (req, res) => {
  const { googleBookId, title, authors, thumbnail, pageCount, category } = req.body;

  try {
    if (!googleBookId || !title || !category) {
      return res.status(400).json({
        success: false,
        message: 'Book ID, title, and category are required'
      });
    }

    const existingBook = await Book.findOne({
      googleBookId,
      userId: req.user.id
    });

    if (existingBook) {
      if (existingBook.category === category) {
        return res.status(409).json({
          success: false,
          message: 'Book already exists in this category'
        });
      } else {
        existingBook.category = category;
        await existingBook.save();
        return res.status(200).json({
          success: true,
          message: `Book moved from ${existingBook.category} to ${category}`,
          book: existingBook
        });
      }
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

    return res.status(201).json({
      success: true,
      message: 'Book added successfully',
      book: newBook
    });
  } catch (error) {
    console.error('Error adding book:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all books for the current user, categorized
 */
const getBooks = async (req, res) => {
  try {
    const books = await Book.find({ userId: req.user.id });
    
    const booksByCategory = {
      currentlyReading: books.filter(book => book.category === 'currentlyReading'),
      wantToRead: books.filter(book => book.category === 'wantToRead'),
      finishedReading: books.filter(book => book.category === 'finishedReading'),
    };

    res.status(200).json({
      success: true,
      currentlyReading: booksByCategory.currentlyReading,
      wantToRead: booksByCategory.wantToRead,
      finishedReading: booksByCategory.finishedReading
    });
  } catch (error) {
    console.error('Failed to fetch books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update book progress and calculate reading statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} - JSON response
 */
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
      return res.status(400).json({ message: 'User or Book not found' });
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
    
    // Calculate totalPagesRead - only update for currentlyReading books
    let totalPagesRead = user.totalPagesRead || 0;
    if (book.category === 'currentlyReading') {
      const pagesReadDiff = pagesRead - previousPagesRead;
      totalPagesRead = Math.max(0, totalPagesRead + pagesReadDiff);
    }

    // Create a new reading log entry with normalized date (UTC midnight)
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    
    const newReadingLogEntry = {
      date: todayUTC,
      pagesRead,
      bookId: book._id
    };

    // Combine all reading log entries for calculations
    const readingLog = [...(user.readingLog || []), newReadingLogEntry];
    
    // Convert all dates to normalized YYYY-MM-DD strings for streak calculations
    const uniqueDatesSet = new Set(
      readingLog.map(log => {
        const date = new Date(log.date);
        return new Date(
          Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
        ).toISOString().split('T')[0];
      })
    );
    
    // Convert Set to array and sort for streak calculations
    const uniqueDates = Array.from(uniqueDatesSet).sort();
    const reversedDates = [...uniqueDates].sort((a, b) => b.localeCompare(a)); // Newest first
    
    // Calculate current streak
    let currentStreak = 0;
    const todayStr = todayUTC.toISOString().split('T')[0];
    
    if (uniqueDates.length > 0 && reversedDates[0] === todayStr) {
      currentStreak = 1;
      for (let i = 1; i < reversedDates.length; i++) {
        const currentDate = new Date(reversedDates[i-1]);
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
      const prevDate = new Date(uniqueDates[i-1]);
      const currentDate = new Date(uniqueDates[i]);
      const diffDays = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentMaxStreak++;
        maxStreak = Math.max(maxStreak, currentMaxStreak);
      } else {
        currentMaxStreak = 1;
      }
    }
    
    // Use the larger of current max streak or existing max streak
    const maxReadingStreak = Math.max(user.maxReadingStreak || 0, maxStreak);
    
    // Transaction or concurrent operations for data consistency
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
    
    // Success response
    return res.status(200).json({
      message: 'Progress updated',
      book: savedBook,
      readingLog: [...(user.readingLog || []), newReadingLogEntry]
    });
  } catch (error) {
    console.error('Update progress error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Delete a book
 */
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Update totalPagesRead and remove readingLog entries
    const user = await User.findById(req.user.id);
    console.log('Before deleting readingLog entries:', { bookId: book._id, readingLog: user.readingLog });
    if (book.category === 'finishedReading' || book.category === 'currentlyReading') {
      const pagesToSubtract = book.category === 'finishedReading'
        ? (typeof book.pageCount === 'number' && !isNaN(book.pageCount) ? book.pageCount : 0)
        : (typeof book.pagesRead === 'number' && !isNaN(book.pagesRead) ? book.pagesRead : 0);
      user.totalPagesRead = Math.max(0, (user.totalPagesRead || 0) - pagesToSubtract);

      // Remove readingLog entries for this book
      user.readingLog = user.readingLog.filter(
        (log) => log.bookId.toString() !== book._id.toString()
      );

      // Include all readingLog entries for streak calculations
      const readingLog = user.readingLog;
      const uniqueDates = [...new Set(
        readingLog.map(log => new Date(new Date(log.date).setUTCHours(0, 0, 0, 0)).toISOString().split('T')[0])
      )].sort((a, b) => b.localeCompare(a)); // Newest first

      // Recalculate currentStreak
      let currentStreak = 0;
      const today = new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString().split('T')[0];
      console.log('Current streak debug (deleteBook):', { today, uniqueDates });
      if (uniqueDates.length > 0 && uniqueDates[0] === today) {
        currentStreak = 1; // Start with today
        for (let i = 1; i < uniqueDates.length; i++) {
          const currentDate = new Date(uniqueDates[i - 1]);
          const prevDate = new Date(uniqueDates[i]);
          const diffDays = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
          console.log('Streak loop (deleteBook):', { i, currentDate: currentDate.toISOString(), prevDate: prevDate.toISOString(), diffDays });
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Recalculate maxReadingStreak
      let maxReadingStreak = 0;
      if (readingLog.length > 0) {
        const sortedDatesAsc = [...new Set(
          readingLog.map(log => new Date(new Date(log.date).setUTCHours(0, 0, 0, 0)).toISOString().split('T')[0])
        )].sort((a, b) => a.localeCompare(b)); // Oldest first
        let streak = 1;
        let calculatedMaxStreak = 1;
        for (let i = 1; i < sortedDatesAsc.length; i++) {
          const prevDate = new Date(sortedDatesAsc[i - 1]);
          const currentDate = new Date(sortedDatesAsc[i]);
          const diffDays = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            streak += 1;
            calculatedMaxStreak = Math.max(calculatedMaxStreak, streak);
          } else {
            streak = 1;
          }
        }
        maxReadingStreak = calculatedMaxStreak;
      }

      user.currentStreak = currentStreak;
      user.maxReadingStreak = maxReadingStreak;

      console.log('After deleting readingLog entries:', {
        bookId: book._id,
        readingLog: readingLog.map(log => ({
          date: new Date(log.date).toISOString(),
          pagesRead: log.pagesRead
        })),
        currentStreak,
        maxReadingStreak
      });
    }

    await user.save();
    console.log('After saving user in deleteBook:', {
      readingLog: user.readingLog.map(log => ({
        date: new Date(log.date).toISOString(),
        pagesRead: log.pagesRead
      }))
    });

    res.status(200).json({
      success: true,
      message: 'Book removed from shelf'
    });
  } catch (error) {
    console.error('Error removing book:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing book',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update book details (category, progress)
 */
const updateBook = async (req, res) => {
  const { category } = req.body;
  try {
    const book = await Book.findOne({ _id: req.params.id, userId: req.user.id });
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    if (category) {
      if (!['currentlyReading', 'wantToRead', 'finishedReading'].includes(category)) {
        return res.status(400).json({ success: false, message: 'Invalid category' });
      }
      const oldCategory = book.category;
      book.category = category;
      await book.save();

      // Update totalPagesRead based on category change
      const user = await User.findById(req.user.id);
      const pageCount = typeof book.pageCount === 'number' && !isNaN(book.pageCount) ? book.pageCount : 0;
      const pagesRead = typeof book.pagesRead === 'number' && !isNaN(book.pagesRead) ? book.pagesRead : 0;

      if (category === 'finishedReading' && oldCategory !== 'finishedReading') {
        user.totalPagesRead = (user.totalPagesRead || 0) + pageCount - (oldCategory === 'currentlyReading' ? pagesRead : 0);
      } else if (oldCategory === 'finishedReading' && category !== 'finishedReading') {
        user.totalPagesRead = Math.max(0, (user.totalPagesRead || 0) - pageCount + (category === 'currentlyReading' ? pagesRead : 0));
      } else if (category === 'currentlyReading' && oldCategory !== 'currentlyReading') {
        user.totalPagesRead = (user.totalPagesRead || 0) + pagesRead - (oldCategory === 'finishedReading' ? pageCount : 0);
      } else if (oldCategory === 'currentlyReading' && category !== 'currentlyReading') {
        user.totalPagesRead = Math.max(0, (user.totalPagesRead || 0) - pagesRead + (category === 'finishedReading' ? pageCount : 0));
      }

      await user.save();

      res.status(200).json({ success: true, message: 'Book updated successfully', book });
    } else {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ success: false, message: 'Error updating book', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

module.exports = {
  addBook,
  getBooks,
  updateProgress,
  deleteBook,
  updateBook
};