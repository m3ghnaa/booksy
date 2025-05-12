const mongoose = require('mongoose');
const { updateProgress } = require('../controllers/bookController');
const Book = require('../models/Book');
const User = require('../models/User');

jest.mock('../models/Book');
jest.mock('../models/User');

const OriginalDate = global.Date;

describe('bookController - updateProgress', () => {
  let req, res, dateSpy;
  const validTestBookObjectIdString = '1234567890abcdef12345678'; // Define a consistent valid ObjectId string

  beforeEach(() => {
    req = {
      user: { id: 'user123' },
      params: { id: validTestBookObjectIdString }, // Use the consistent ID
      body: { progress: 50, progressType: 'pages' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (dateSpy) {
      dateSpy.mockRestore();
    }
    jest.clearAllMocks();
  });

  const setupDateMock = (mockDateInstance) => {
    dateSpy = jest.spyOn(global, 'Date')
      .mockImplementation((...args) => {
        if (args.length === 0) {
          return mockDateInstance;
        }
        return new OriginalDate(...args);
      });
    global.Date.UTC = OriginalDate.UTC;
    global.Date.now = OriginalDate.now;
  };

  const createMockBook = (initialData) => {
    const bookInstance = { ...initialData };
    // Ensure _id is a Mongoose ObjectId instance if that's how it's stored/compared
    if (typeof bookInstance._id === 'string') {
        bookInstance._id = new mongoose.Types.ObjectId(bookInstance._id);
    }
    bookInstance.save = jest.fn().mockResolvedValue(bookInstance);
    return bookInstance;
  };

  it('should update progress and calculate streaks for consecutive days', async () => {
    const mockDate = new OriginalDate('2025-05-06T00:00:00Z');
    setupDateMock(mockDate);

    const user = {
      _id: 'user123',
      readingLog: [
        { date: new OriginalDate('2025-05-04T00:00:00Z'), pagesRead: 0, bookId: new mongoose.Types.ObjectId('1234567890abcdef12345678') },
        { date: new OriginalDate('2025-05-05T00:00:00Z'), pagesRead: 804, bookId: new mongoose.Types.ObjectId('1234567890abcdef12345678') },
      ],
      totalPagesRead: 913,
      currentStreak: 2,
      maxReadingStreak: 2,
    };
    User.findById.mockResolvedValue(user);
    User.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const initialBookData = {
      _id: new mongoose.Types.ObjectId('1234567890abcdef12345678'),
      userId: 'user123',
      category: 'currentlyReading',
      pagesRead: 109,
      pageCount: 300,
      progress: 36.33,
      progressType: 'pages', // Initial progress type
      lastRead: new OriginalDate('2025-05-05T00:00:00Z'), // Last read before this update
    };
    const mockBook = createMockBook(initialBookData);
    Book.findById.mockResolvedValue(mockBook);

    req.body = { progress: 50, progressType: 'pages' }; // This is the new input

    await updateProgress(req, res);

    expect(Book.findById).toHaveBeenCalledWith('1234567890abcdef12345678');
    expect(User.findById).toHaveBeenCalledWith('user123');
    expect(mockBook.save).toHaveBeenCalled();

    const expectedTodayUTC = new OriginalDate(OriginalDate.UTC(mockDate.getUTCFullYear(), mockDate.getUTCMonth(), mockDate.getUTCDate()));
    const expectedBookProgress = (50 / initialBookData.pageCount) * 100;

    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: 'user123' },
      expect.objectContaining({
        $push: {
          readingLog: {
            date: expectedTodayUTC,
            pagesRead: 50, // This is pagesRead for the log entry, from req.body.progress
            bookId: mockBook._id
          }
        },
        $set: expect.objectContaining({
          totalPagesRead: 854, // 913 (initial user) - 109 (initial book) + 50 (new book pagesRead)
          currentStreak: 3,
          maxReadingStreak: 3
        })
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);
    const finalReadingLog = [
      ...user.readingLog,
      { date: expectedTodayUTC, pagesRead: 50, bookId: mockBook._id }
    ];
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Progress updated',
        book: expect.objectContaining({
          _id: mockBook._id,
          pagesRead: 50, // Updated value from req.body.progress
          progress: expectedBookProgress,
          progressType: 'pages', // Updated from req.body.progressType
          lastRead: mockDate, // Updated to "now"
        }),
        readingLog: expect.arrayContaining(
          finalReadingLog.map(logEntry => expect.objectContaining({
            date: logEntry.date,
            pagesRead: logEntry.pagesRead,
            bookId: logEntry.bookId
          }))
        )
      })
    );
  });


  it('should update streaks for pagesRead: 0', async () => {
    const mockDate = new OriginalDate('2025-05-06T00:00:00Z');
    setupDateMock(mockDate);

    const user = {
      _id: 'user123',
      readingLog: [
        { date: new OriginalDate('2025-05-05T00:00:00Z'), pagesRead: 804, bookId: new mongoose.Types.ObjectId('1234567890abcdef12345678') }
      ],
      totalPagesRead: 804,
      currentStreak: 1,
      maxReadingStreak: 1,
    };
    User.findById.mockResolvedValue(user);
    User.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const initialBookData = {
      _id: new mongoose.Types.ObjectId('1234567890abcdef12345678'),
      userId: 'user123',
      category: 'currentlyReading',
      pagesRead: 804, // Current pages read of the book
      pageCount: 1000,
      progressType: 'pages',
      lastRead: new OriginalDate('2025-05-05T00:00:00Z'),
    };
    const mockBook = createMockBook(initialBookData);
    Book.findById.mockResolvedValue(mockBook);

    req.body = { progress: 0, progressType: 'pages' }; // Update to 0 pages

    await updateProgress(req, res);

    const expectedTodayUTC = new OriginalDate(OriginalDate.UTC(mockDate.getUTCFullYear(), mockDate.getUTCMonth(), mockDate.getUTCDate()));

    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: 'user123' },
      expect.objectContaining({
        $push: { readingLog: { date: expectedTodayUTC, pagesRead: 0, bookId: mockBook._id } },
        $set: expect.objectContaining({
          totalPagesRead: 0, // 804 (initial user) - 804 (initial book) + 0 (new book)
          currentStreak: 2,
          maxReadingStreak: 2
        })
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);
    const finalReadingLog = [
        ...user.readingLog,
        {date: expectedTodayUTC, pagesRead: 0, bookId: mockBook._id}
    ];
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Progress updated',
        book: expect.objectContaining({
          pagesRead: 0,
          progress: 0, // (0 / 1000) * 100
          progressType: 'pages',
          lastRead: mockDate,
        }),
        readingLog: expect.arrayContaining(
            finalReadingLog.map(logEntry => expect.objectContaining({
                date: logEntry.date,
                pagesRead: logEntry.pagesRead,
                bookId: logEntry.bookId
            }))
        )
      })
    );
  });

  // Ensure other tests that mock Book.findById and expect a successful book update
  // use the createMockBook helper or a similar approach for book.save.

  it('should set currentStreak to 1 if updating today (break in streak)', async () => {
    const mockDate = new OriginalDate('2025-05-07T00:00:00Z');
    setupDateMock(mockDate);

    const user = {
      _id: 'user123',
      readingLog: [
        // Corrected bookId:
        { date: new OriginalDate('2025-05-04T00:00:00Z'), pagesRead: 10, bookId: new mongoose.Types.ObjectId(validTestBookObjectIdString) },
        { date: new OriginalDate('2025-05-05T00:00:00Z'), pagesRead: 804, bookId: new mongoose.Types.ObjectId(validTestBookObjectIdString) }
      ],
      totalPagesRead: 814, currentStreak: 2, maxReadingStreak: 2,
    };
    User.findById.mockResolvedValue(user);
    User.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const initialBookData = {
      _id: validTestBookObjectIdString, // Use the consistent ID
      userId: 'user123', category: 'currentlyReading', pagesRead: 109, pageCount: 300,
      progressType: 'pages', lastRead: new OriginalDate('2025-05-05T00:00:00Z'),
    };
    const mockBook = createMockBook(initialBookData);
    Book.findById.mockResolvedValue(mockBook);

    req.body = { progress: 50, progressType: 'pages' };

    await updateProgress(req, res);

    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: 'user123' },
      expect.objectContaining({
        $set: expect.objectContaining({ currentStreak: 1, maxReadingStreak: 2 })
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        book: expect.objectContaining({ pagesRead: 50 })
    }));
  });


  it('should handle empty readingLog', async () => {
    const mockDate = new OriginalDate('2025-05-06T00:00:00Z');
    setupDateMock(mockDate);

    const user = {
      _id: 'user123', readingLog: [], totalPagesRead: 0, currentStreak: 0, maxReadingStreak: 0,
    };
    User.findById.mockResolvedValue(user);
    User.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const initialBookData = {
      _id: new mongoose.Types.ObjectId('1234567890abcdef12345678'),
      userId: 'user123', category: 'currentlyReading', pagesRead: 0, pageCount: 300,
      progressType: 'pages', // Assuming a default or it will be set
      lastRead: null,
    };
    const mockBook = createMockBook(initialBookData);
    Book.findById.mockResolvedValue(mockBook);
    
    req.body = { progress: 50, progressType: 'pages' };

    await updateProgress(req, res);

    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: 'user123' },
      expect.objectContaining({
        $set: expect.objectContaining({ totalPagesRead: 50, currentStreak: 1, maxReadingStreak: 1 })
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        book: expect.objectContaining({ pagesRead: 50 })
    }));
  });


  // Tests that do not mock Date (e.g., input validation) remain unchanged
  it('should return 400 for missing progress or progressType', async () => {
    // No Date mock needed
    User.findById.mockResolvedValue({ _id: 'user123' }); // Minimal mock to pass initial checks if any
    Book.findById.mockResolvedValue({ _id: 'book123' });

    req.body = {}; // Missing progress and progressType
    await updateProgress(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Progress and progressType are required' });
  });

  it('should return 400 for invalid progressType', async () => {
    // No Date mock needed
    User.findById.mockResolvedValue({ _id: 'user123' });
    Book.findById.mockResolvedValue({ _id: 'book123' });

    req.body = { progress: 50, progressType: 'invalid' };
    await updateProgress(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid progressType' });
  });

  it('should return 400 for negative progress (pages)', async () => {
    User.findById.mockResolvedValue({ _id: 'user123' });
    Book.findById.mockResolvedValue({ _id: 'book123', pageCount: 300 }); // Ensure pageCount is present

    req.body = { progress: -10, progressType: 'pages' };
    await updateProgress(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid page count' });
  });

  it('should return 400 for progress exceeding pageCount (pages)', async () => {
    User.findById.mockResolvedValue({ _id: 'user123' });
    const book = {
      _id: new mongoose.Types.ObjectId('1234567890abcdef12345678'),
      userId: 'user123',
      pageCount: 300,
      save: jest.fn().mockResolvedValue(true)
    };
    Book.findById.mockResolvedValue(book);

    req.body = { progress: 400, progressType: 'pages' };
    await updateProgress(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid page count' });
  });


  it('should return 400 for progress > 100 (percentage)', async () => {
    User.findById.mockResolvedValue({ _id: 'user123' });
    Book.findById.mockResolvedValue({ _id: 'book123', pageCount: 300 });

    req.body = { progress: 150, progressType: 'percentage' };
    await updateProgress(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Progress must be between 0 and 100' });
  });


  it('should return 400 if book not found', async () => {
    User.findById.mockResolvedValue({ _id: 'user123', readingLog: [] });
    Book.findById.mockResolvedValue(null); // Book not found

    await updateProgress(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'User or Book not found' });
  });

  it('should return 400 if user not found', async () => {
    User.findById.mockResolvedValue(null); // User not found
    Book.findById.mockResolvedValue({
      _id: new mongoose.Types.ObjectId('1234567890abcdef12345678'),
      userId: 'user123'
    });

    await updateProgress(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'User or Book not found' });
  });

 
  it('should not update totalPagesRead for finishedReading books', async () => {
    const mockDate = new OriginalDate('2025-05-06T00:00:00Z');
    setupDateMock(mockDate);

    const user = {
      _id: 'user123', readingLog: [], totalPagesRead: 1000, currentStreak: 0, maxReadingStreak: 0,
    };
    User.findById.mockResolvedValue(user);
    User.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const initialBookData = {
      _id: new mongoose.Types.ObjectId('1234567890abcdef12345678'),
      userId: 'user123', category: 'finishedReading', pagesRead: 300, pageCount: 300, progress: 100,
      progressType: 'pages', lastRead: new OriginalDate('2025-05-05T00:00:00Z'),
    };
    const mockBook = createMockBook(initialBookData);
    Book.findById.mockResolvedValue(mockBook);

    req.body = { progress: 250, progressType: 'pages' }; // Attempting to change progress

    await updateProgress(req, res);

    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: 'user123' },
      expect.objectContaining({
        $set: expect.objectContaining({ totalPagesRead: 1000, currentStreak: 1, maxReadingStreak: 1 })
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        book: expect.objectContaining({ pagesRead: 250, progress: (250/300)*100 }) // Book itself is updated
    }));
  });

  it('should handle longer streak', async () => {
    const mockDate = new OriginalDate('2025-05-06T00:00:00Z');
    setupDateMock(mockDate);

    const user = {
      _id: 'user123',
      readingLog: [
        // Corrected bookId:
        { date: new OriginalDate('2025-05-03T00:00:00Z'), pagesRead: 100, bookId: new mongoose.Types.ObjectId(validTestBookObjectIdString) },
        { date: new OriginalDate('2025-05-04T00:00:00Z'), pagesRead: 100, bookId: new mongoose.Types.ObjectId(validTestBookObjectIdString) },
        { date: new OriginalDate('2025-05-05T00:00:00Z'), pagesRead: 804, bookId: new mongoose.Types.ObjectId(validTestBookObjectIdString) }
      ],
      totalPagesRead: 1004, currentStreak: 3, maxReadingStreak: 3,
    };
    User.findById.mockResolvedValue(user);
    User.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const initialBookData = {
      _id: validTestBookObjectIdString, // Use the consistent ID
      userId: 'user123', category: 'currentlyReading', pagesRead: 804, pageCount: 1000,
      progressType: 'pages', lastRead: new OriginalDate('2025-05-05T00:00:00Z'),
    };
    const mockBook = createMockBook(initialBookData);
    Book.findById.mockResolvedValue(mockBook);

    req.body = { progress: 50, progressType: 'pages' };

    await updateProgress(req, res);

    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: 'user123' },
      expect.objectContaining({
        $set: expect.objectContaining({ totalPagesRead: 250, currentStreak: 4, maxReadingStreak: 4 })
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        book: expect.objectContaining({ pagesRead: 50 })
    }));
  });
  // Tests for 400 errors (no date mocking needed, no book.save call)
  it('should return 400 for missing progress or progressType', async () => {
    User.findById.mockResolvedValue({ _id: 'user123' }); 
    Book.findById.mockResolvedValue({ _id: 'book123' });
    req.body = {};
    await updateProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Progress and progressType are required' });
  });

  it('should return 400 for invalid progressType', async () => {
    User.findById.mockResolvedValue({ _id: 'user123' });
    Book.findById.mockResolvedValue({ _id: 'book123' });
    req.body = { progress: 50, progressType: 'invalid' };
    await updateProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid progressType' });
  });

  it('should return 400 for negative progress (pages)', async () => {
    User.findById.mockResolvedValue({ _id: 'user123' });
    Book.findById.mockResolvedValue({ _id: 'book123', pageCount: 300 });
    req.body = { progress: -10, progressType: 'pages' };
    await updateProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid page count' });
  });

  it('should return 400 for progress exceeding pageCount (pages)', async () => {
    User.findById.mockResolvedValue({ _id: 'user123' });
    const mockBook = createMockBook({ _id: 'book123', pageCount: 300 }); // Use helper for consistency
    Book.findById.mockResolvedValue(mockBook);
    req.body = { progress: 400, progressType: 'pages' };
    await updateProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid page count' });
  });

  it('should return 400 for progress > 100 (percentage)', async () => {
    User.findById.mockResolvedValue({ _id: 'user123' });
    Book.findById.mockResolvedValue({ _id: 'book123', pageCount: 300 });
    req.body = { progress: 150, progressType: 'percentage' };
    await updateProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Progress must be between 0 and 100' });
  });

  it('should return 400 if book not found', async () => {
    User.findById.mockResolvedValue({ _id: 'user123', readingLog: [] });
    Book.findById.mockResolvedValue(null);
    await updateProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'User or Book not found' });
  });

  it('should return 400 if user not found', async () => {
    User.findById.mockResolvedValue(null);
    Book.findById.mockResolvedValue({_id: new mongoose.Types.ObjectId('1234567890abcdef12345678'), userId: 'user123'});
    await updateProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'User or Book not found' });
  });
});
