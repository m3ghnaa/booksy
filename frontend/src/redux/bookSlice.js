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
  },
});

export const { setBooks, clearBooks } = bookSlice.actions;
export default bookSlice.reducer;
