import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  books: [],
  loading: false,
  error: null,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchResults: (state, action) => {
      state.books = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearSearchResults: (state) => {
      state.books = [];
    }
  },
});

export const { setSearchResults, setLoading, setError, clearSearchResults } = searchSlice.actions;
export default searchSlice.reducer;