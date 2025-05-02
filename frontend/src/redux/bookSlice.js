import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentlyReading: [],
  wantToRead: [],
  finishedReading: []
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
    },
    
    addToReadingList: (state, action) => {
      const { book, category } = action.payload;
      state[category].push(book);
    },
    
    updateProgress: (state, action) => {
      const { bookId, category, progress } = action.payload;
      
      const bookIndex = state[category].findIndex(book => 
        book._id === bookId || book.googleBookId === bookId
      );
      
      if (bookIndex !== -1) {
        state[category][bookIndex].progress = progress;
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
    }
  }
});

export const { 
  setBooks, 
  addToReadingList, 
  updateProgress, 
  updateBookStatus,
  removeBook
} = bookSlice.actions;

export default bookSlice.reducer;