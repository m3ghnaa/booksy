// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import userReducer from './userSlice';
import bookReducer from './bookSlice';
import searchReducer from './searchSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    books: bookReducer,
    search: searchReducer,
  },
});

export default store;
