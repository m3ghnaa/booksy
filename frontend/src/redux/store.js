import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
// Ensure thunk is imported correctly for Redux Toolkit
import { thunk } from 'redux-thunk'; // Or from '@reduxjs/toolkit' if using newer versions

import authReducer from './authSlice';
import userReducer from './userSlice';
import bookReducer from './bookSlice';
import searchReducer from './searchSlice';

// Configuration for redux-persist
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['token', 'refreshToken', 'expiresAt', 'isAuthenticated']
};

const userPersistConfig = {
  key: 'user',
  storage,
  whitelist: ['profile'] // Assuming profile contains serializable data
};

// Note: readingActivity and stats are intentionally NOT whitelisted here
// based on the original setup and the desire to refetch them.
const booksPersistConfig = {
  key: 'books',
  storage,
  whitelist: ['currentlyReading', 'wantToRead', 'finishedReading', 'lastFetched']
};

const searchPersistConfig = {
  key: 'search',
  storage,
  whitelist: [] // Search results are not persisted
};

// Apply persist to reducers
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  user: persistReducer(userPersistConfig, userReducer),
  books: persistReducer(booksPersistConfig, bookReducer),
  search: persistReducer(searchPersistConfig, searchReducer)
});

// Create the store with thunk middleware
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // serializableCheck is explicitly FALSE based on the user's original code.
      // If you can make all your state serializable, remove this line.
      serializableCheck: false,

      // immutableCheck can also be disabled if you have large state or
      // complex mutations that cause performance issues, but it's generally
      // recommended to keep it enabled for debugging accidental mutations.
      // immutableCheck: false,
    }).concat(thunk)
});

// Create the persistor
export const persistor = persistStore(store);

export default store;