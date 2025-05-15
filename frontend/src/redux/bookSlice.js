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
  readingActivity: {
    data: [],
    lastFetched: null // For reading activity cache
  }
};

const bookSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    setBooks: (state, action) => {
      const { currentlyReading, wantToRead, finishedReading } = action.payload;
      // Ensure assigned values are arrays
      state.currentlyReading = Array.isArray(currentlyReading) ? currentlyReading : [];
      state.wantToRead = Array.isArray(wantToRead) ? wantToRead : [];
      state.finishedReading = Array.isArray(finishedReading) ? finishedReading : [];
      state.lastFetched = Date.now(); // Update general books cache timestamp
    },

    addToReadingList: (state, action) => {
      const { book, category } = action.payload;
      // Basic check before pushing
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
          return; // Exit if category is invalid
      }

      const bookIndex = state[category].findIndex(book =>
        book && (book._id === bookId || book.googleBookId === bookId) // Add null/undefined check for book
      );

      if (bookIndex !== -1) {
        const book = state[category][bookIndex];

        // Update progress (ensure it's a number)
        state[category][bookIndex].progress = Number(progress); // Number() handles various inputs safely

        // Update pagesRead if provided and is a valid number
        if (typeof pagesRead === 'number' && !isNaN(pagesRead)) {
          state[category][bookIndex].pagesRead = pagesRead;
        } else if (book.pageCount && typeof progress === 'number' && !isNaN(progress)) {
          // Calculate pagesRead if not provided and progress/pageCount are valid numbers
          state[category][bookIndex].pagesRead = Math.round((progress / 100) * book.pageCount);
        } else if (typeof book.pagesRead !== 'number' || isNaN(book.pagesRead)) {
             // Ensure pagesRead is at least 0 if calculation failed or initial value was bad
             state[category][bookIndex].pagesRead = 0;
        }


        // Update progressType if provided and is a string (basic check)
        if (typeof progressType === 'string') {
          state[category][bookIndex].progressType = progressType;
        } else if (book.progressType === undefined) {
             // Ensure progressType exists if it wasn't set before
              state[category][bookIndex].progressType = null; // Or a default like ''
        }


        // Update lastRead to current timestamp string
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
          return; // Exit if categories are invalid
      }


      const bookIndex = state[oldCategory].findIndex(book =>
         book && (book._id === bookId || book.googleBookId === bookId) // Add null/undefined check for book
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
          return; // Exit if category is invalid
      }

      state[category] = state[category].filter(book =>
         book && (book._id !== bookId && book.googleBookId !== bookId) // Add null/undefined check for book
      );
    },

    setProgressUpdated: (state, action) => {
      state.progressUpdated = action.payload;
    },

    setUserStats: (state, action) => {
        const { maxReadingStreak, currentStreak, totalPagesRead, totalBooksRead } = action.payload;
        // Basic validation for incoming stats data
        if (typeof maxReadingStreak === 'number' && typeof currentStreak === 'number' &&
            typeof totalPagesRead === 'number' && typeof totalBooksRead === 'number') {
             state.stats = {
                maxReadingStreak,
                currentStreak,
                totalPagesRead,
                totalBooksRead,
                lastFetched: Date.now() // Update stats cache timestamp
             };
             console.log('setUserStats: Stats updated successfully.');
        } else {
             console.warn('setUserStats: Invalid stats data received, not updating.', action.payload);
        }
    },

    setReadingActivity: (state, action) => {
      try {
        // Expected payload format: { data: Array<{ date: string, pagesRead: number }> }
        if (action.payload && typeof action.payload === 'object' && Array.isArray(action.payload.data)) {
            const incomingActivityData = action.payload.data;

            // --- Diagnostic Deep Clone to force serializability ---
            // This attempts to create a new object containing only JSON serializable data.
            // If the error disappears, the issue was likely a non-serializable value
            // that JSON.parse(JSON.stringify) removed or converted.
            let deeplyClonedData;
            try {
                 deeplyClonedData = JSON.parse(JSON.stringify(incomingActivityData));
                 console.log('setReadingActivity: Successfully attempted deep clone of incoming data.');
                 // Optional: Add a check here to see if the cloning *changed* the data significantly,
                 // which might indicate non-serializable parts were present.
                //  if (JSON.stringify(deeplyClonedData) !== JSON.stringify(incomingActivityData)) {
                //      console.warn("setReadingActivity: Deep clone altered data, non-serializable items might have been present.");
                //  }

            } catch (cloneError) {
                 console.error('setReadingActivity: Error during diagnostic deep cloning with JSON.parse(JSON.stringify):', cloneError, incomingActivityData);
                 // If cloning fails (e.g., contains circular references or unsupported types),
                 // fall back to the original data and log the issue. The error might still occur.
                 deeplyClonedData = incomingActivityData;
            }
            // --- End Diagnostic Deep Clone ---

            // Add a runtime check for the expected structure *after* cloning
            const isDataSerializableShape = Array.isArray(deeplyClonedData) && deeplyClonedData.every(item =>
                item && typeof item === 'object' && typeof item.date === 'string' &&
                typeof item.pagesRead === 'number' && Object.keys(item).length === 2
            );

            if (isDataSerializableShape) {
                state.readingActivity = {
                    data: deeplyClonedData, // Assign the potentially cloned data
                    lastFetched: Date.now() // Update activity cache timestamp
                };
                 console.log('setReadingActivity: State updated with data matching serializable shape.');
            } else {
                console.error('setReadingActivity: Data does not match expected serializable shape after cloning attempt, not updating state.', deeplyClonedData);
                // Optionally, set to empty or previous valid state on error
                 if (!state.readingActivity || !Array.isArray(state.readingActivity.data)) {
                     state.readingActivity = { data: [], lastFetched: Date.now() };
                 }
            }

        } else {
            console.warn('setReadingActivity: Invalid payload format received. Expected { data: Array }.', action.payload);
             // Optionally, set to empty state if payload format is wrong
             if (!state.readingActivity || !Array.isArray(state.readingActivity.data)) {
                 state.readingActivity = { data: [], lastFetched: Date.now() };
             }
        }
      } catch (error) {
        console.error('Error in setReadingActivity reducer:', error);
        // Ensure we always have a valid state structure on error
        if (!state.readingActivity || !Array.isArray(state.readingActivity.data)) {
             state.readingActivity = { data: [], lastFetched: Date.now() };
        }
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