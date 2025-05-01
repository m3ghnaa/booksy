// redux/bookSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentlyReading: [],
  wantToRead: [],
  finishedReading: [],
  loading: false,
  error: null,
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
    clearBooks: (state) => {
      state.currentlyReading = [];
      state.wantToRead = [];
      state.finishedReading = [];
    },
    addToReadingList: (state, action) => {
        const { book, category } = action.payload;
        const newBook = {
          googleBookId: book.id,
          title: book.volumeInfo.title,
          authors: book.volumeInfo.authors,
          thumbnail: book.volumeInfo.imageLinks?.thumbnail,
          pageCount: book.volumeInfo.pageCount,
        };
        state[category].push(newBook);
      },
  },
});

export const { setBooks, clearBooks, addToReadingList } = bookSlice.actions;
export default bookSlice.reducer;
