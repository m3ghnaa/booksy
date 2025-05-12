const User = require('../models/User');
const Book = require('../models/Book');

// Controller for getting daily reading activity
const getReadingActivity = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user reading log
    const user = await User.findById(userId).select('readingLog');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch user's books to verify bookIds
    const books = await Book.find({ userId }).select('_id');
    const validBookIds = new Set(books.map(book => book._id.toString()));

    console.log('Raw readingLog:', user.readingLog);
    console.log('Valid bookIds:', validBookIds);

    // Sort readingLog by date descending to ensure latest entry is first
    const sortedLogs = user.readingLog
      .filter(log => validBookIds.has(log.bookId.toString()))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Aggregate latest pages read per book by date
    const activityMap = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Group logs by date and book, keeping the latest entry
    const logsByDateAndBook = {};
    sortedLogs.forEach((log) => {
      const logDate = new Date(log.date).toISOString().split('T')[0];
      if (new Date(logDate) >= thirtyDaysAgo) {
        const bookId = log.bookId.toString();
        if (!logsByDateAndBook[logDate]) {
          logsByDateAndBook[logDate] = {};
        }
        // Keep the latest log entry for this book on this date
        if (!logsByDateAndBook[logDate][bookId]) {
          logsByDateAndBook[logDate][bookId] = log;
        }
      }
    });

    // Sum pages read for each date
    Object.keys(logsByDateAndBook).forEach((date) => {
      activityMap[date] = Object.values(logsByDateAndBook[date]).reduce((sum, log) => {
        return sum + (log.pagesRead || 0);
      }, 0);
    });

    // Debug: Log selected entries and aggregated activity
    console.log('Selected readingLog entries:', logsByDateAndBook);
    console.log('Aggregated reading activity:', activityMap);

    // Generate data for the last 30 days
    const activityData = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      activityData.push({
        date: dateStr,
        pagesRead: activityMap[dateStr] || 0,
      });
    }

    // Sort by date ascending for chart
    activityData.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      readingActivity: activityData,
    });
  } catch (error) {
    console.error('Error fetching reading activity:', error);
    res.status(500).json({
      message: 'Error fetching reading activity',
      error: error.message,
    });
  }
};

module.exports = {
  getReadingActivity,
};