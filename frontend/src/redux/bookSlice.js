import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentlyReading: [],
  wantToRead: [],
  finishedReading: [],
  progressUpdated: false,
  lastFetched: null,
  stats: {
    maxReadingStreak: 0,
    currentStreak: 0,
    totalPagesRead: 0,
    totalBooksRead: 0,
    lastFetched: null
  },
  readingActivity: {
    data: [],
    lastFetched: null
  }
};

const bookSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    setBooks: (state, action) => {
      const { currentlyReading, wantToRead, finishedReading } = action.payload;
      state.currentlyReading = currentlyReading || [];
      state.wantToRead = wantToRead || [];
      state.finishedReading = finishedReading || [];
      state.lastFetched = Date.now();
    },

    addToReadingList: (state, action) => {
      const { book, category } = action.payload;
      state[category].push(book);
    },

    updateProgress: (state, action) => {
      const { bookId, category, progress, pagesRead, progressType } = action.payload;

      const bookIndex = state[category].findIndex(book => 
        book._id === bookId || book.googleBookId === bookId
      );

      if (bookIndex !== -1) {
        const book = state[category][bookIndex];
        
        // Update progress (ensure it's a number)
        state[category][bookIndex].progress = Number(progress);
        
        // Update pagesRead if provided
        if (typeof pagesRead === 'number') {
          state[category][bookIndex].pagesRead = pagesRead;
        } else if (book.pageCount && typeof progress === 'number') {
          // Calculate pagesRead if not provided (fallback)
          state[category][bookIndex].pagesRead = Math.round((progress / 100) * book.pageCount);
        }

        // Update progressType if provided
        if (progressType) {
          state[category][bookIndex].progressType = progressType;
        }

        // Update lastRead to current timestamp
        state[category][bookIndex].lastRead = new Date().toISOString();
      }
    },

    updateBookStatus: (state, action) => {
      const { bookId, oldCategory, newCategory } = action.payload;

      if (oldCategory === newCategory) return;

      const bookIndex = state[oldCategory].findIndex(book => 
        book._id === bookId || book.googleBookId === bookId
      );

      if (bookIndex !== -1) {
        const book = state[oldCategory][bookIndex];

        state[oldCategory] = state[oldCategory].filter((_, index) => index !== bookIndex);
        state[newCategory].push(book);
      }
    },

    removeBook: (state, action) => {
      const { bookId, category } = action.payload;

      state[category] = state[category].filter(book => 
        book._id !== bookId && book.googleBookId !== bookId
      );
    },

    setProgressUpdated: (state, action) => {
      state.progressUpdated = action.payload;
    },
    
    setUserStats: (state, action) => {
      state.stats = {
        ...action.payload,
        lastFetched: Date.now()
      };
    },
    
    setReadingActivity: (state, action) => {
      try {
        // Simple case: if it's an object with a data property that's an array
        if (action.payload && typeof action.payload === 'object' && 'data' in action.payload && Array.isArray(action.payload.data)) {
          state.readingActivity = {
            data: action.payload.data,
            lastFetched: Date.now()
          };
          return;
        }
        
        // If it's just an array, use that directly
        if (Array.isArray(action.payload)) {
          state.readingActivity = {
            data: action.payload,
            lastFetched: Date.now()
          };
          return;
        }
        
        // Fallback to empty array
        console.warn('Invalid reading activity data format:', action.payload);
        state.readingActivity = {
          data: [],
          lastFetched: Date.now()
        };
      } catch (error) {
        console.error('Error in setReadingActivity reducer:', error);
        // Ensure we always have a valid state
        state.readingActivity = {
          data: [],
          lastFetched: Date.now()
        };
      }
    }
  }
});

export const { 
  setBooks, 
  addToReadingList, 
  updateProgress, 
  updateBookStatus,
  removeBook,
  setProgressUpdated,
  setUserStats,
  setReadingActivity
} = bookSlice.actions;

export default bookSlice.reducer;