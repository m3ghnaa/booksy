import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentlyReading: [],
  wantToRead: [],
  finishedReading: [],
  progressUpdated: false,
  lastFetched: null, // For general book lists cache
  stats: {
    maxReadingStreak: 0,
    currentStreak: 0,
    totalPagesRead: 0,
    totalBooksRead: 0,
    lastFetched: null // For stats cache
  },
  // readingActivity state is REMOVED from Redux
  // readingActivity: {
  //   data: [],
  //   lastFetched: null // For reading activity cache
  // }
};

const bookSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    setBooks: (state, action) => {
      const { currentlyReading, wantToRead, finishedReading } = action.payload;
      state.currentlyReading = Array.isArray(currentlyReading) ? currentlyReading : [];
      state.wantToRead = Array.isArray(wantToRead) ? wantToRead : [];
      state.finishedReading = Array.isArray(finishedReading) ? finishedReading : [];
      state.lastFetched = Date.now();
    },

    addToReadingList: (state, action) => {
      const { book, category } = action.payload;
      if (book && state[category] && Array.isArray(state[category])) {
          state[category].push(book);
      } else {
           console.warn(`Failed to add book to category ${category}. Invalid book or category.`, book, category);
      }
    },

    updateProgress: (state, action) => {
      const { bookId, category, progress, pagesRead, progressType } = action.payload;

      if (!state[category] || !Array.isArray(state[category])) {
          console.warn(`updateProgress: Invalid category "${category}".`);
          return;
      }

      const bookIndex = state[category].findIndex(book =>
        book && (book._id === bookId || book.googleBookId === bookId)
      );

      if (bookIndex !== -1) {
        const book = state[category][bookIndex];
        state[category][bookIndex].progress = Number(progress);

        if (typeof pagesRead === 'number' && !isNaN(pagesRead)) {
          state[category][bookIndex].pagesRead = pagesRead;
        } else if (book.pageCount && typeof progress === 'number' && !isNaN(progress)) {
          state[category][bookIndex].pagesRead = Math.round((progress / 100) * book.pageCount);
        } else if (typeof book.pagesRead !== 'number' || isNaN(book.pagesRead)) {
             state[category][bookIndex].pagesRead = 0;
        }

        if (typeof progressType === 'string') {
          state[category][bookIndex].progressType = progressType;
        } else if (book.progressType === undefined) {
              state[category][bookIndex].progressType = null;
        }

        state[category][bookIndex].lastRead = new Date().toISOString();
      } else {
          console.warn(`updateProgress: Book with ID "${bookId}" not found in category "${category}".`);
      }
    },

    updateBookStatus: (state, action) => {
      const { bookId, oldCategory, newCategory } = action.payload;

      if (oldCategory === newCategory) return;

       if (!state[oldCategory] || !Array.isArray(state[oldCategory]) || !state[newCategory] || !Array.isArray(state[newCategory])) {
          console.warn(`updateBookStatus: Invalid oldCategory "${oldCategory}" or newCategory "${newCategory}".`);
          return;
      }

      const bookIndex = state[oldCategory].findIndex(book =>
         book && (book._id === bookId || book.googleBookId === bookId)
      );

      if (bookIndex !== -1) {
        const book = state[oldCategory][bookIndex];

        state[oldCategory] = state[oldCategory].filter((_, index) => index !== bookIndex);
        state[newCategory].push(book);
      } else {
           console.warn(`updateBookStatus: Book with ID "${bookId}" not found in oldCategory "${oldCategory}".`);
      }
    },

    removeBook: (state, action) => {
      const { bookId, category } = action.payload;
       if (!state[category] || !Array.isArray(state[category])) {
          console.warn(`removeBook: Invalid category "${category}".`);
          return;
      }

      state[category] = state[category].filter(book =>
         book && (book._id !== bookId && book.googleBookId !== bookId)
      );
    },

    setProgressUpdated: (state, action) => {
      state.progressUpdated = action.payload;
    },

    setUserStats: (state, action) => {
        const { maxReadingStreak, currentStreak, totalPagesRead, totalBooksRead } = action.payload;
        if (typeof maxReadingStreak === 'number' && typeof currentStreak === 'number' &&
            typeof totalPagesRead === 'number' && typeof totalBooksRead === 'number') {
             state.stats = {
                maxReadingStreak,
                currentStreak,
                totalPagesRead,
                totalBooksRead,
                lastFetched: Date.now()
             };
             console.log('setUserStats: Stats updated successfully.');
        } else {
             console.warn('setUserStats: Invalid stats data received, not updating.', action.payload);
        }
    },

    // setReadingActivity reducer is REMOVED
    // setReadingActivity: (state, action) => { ... }
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
} = bookSlice.actions;

export default bookSlice.reducer;