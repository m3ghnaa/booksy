// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import userReducer from './userSlice';
import bookReducer from './bookSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    books: bookReducer,
  },
});

export default store;
