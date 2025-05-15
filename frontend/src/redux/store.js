import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, createTransform } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';

import authReducer from './authSlice';
import userReducer from './userSlice';
import bookReducer from './bookSlice';
import searchReducer from './searchSlice';

// Transform to handle serialization/deserialization of expiresAt
const expiresAtTransform = createTransform(
  // Transform state on its way to being serialized and persisted
  (inboundState, key) => {
    if (key === 'auth' && inboundState.expiresAt) {
      return {
        ...inboundState,
        expiresAt: inboundState.expiresAt // Already a string (serialized in reducer)
      };
    }
    return inboundState;
  },
  // Transform state being rehydrated
  (outboundState, key) => {
    if (key === 'auth' && outboundState.expiresAt) {
      return {
        ...outboundState,
        expiresAt: new Date(outboundState.expiresAt) // Convert back to Date
      };
    }
    return outboundState;
  },
  { whitelist: ['auth'] }
);

// Persistence configurations for each slice
const persistConfigs = {
  auth: {
    key: 'auth',
    storage,
    whitelist: ['token', 'refreshToken', 'expiresAt', 'isAuthenticated'],
    transforms: [expiresAtTransform]
    // Persists authentication-related data for session continuity
  },
  user: {
    key: 'user',
    storage,
    whitelist: ['profile']
    // Persists user profile data (e.g., favoriteGenre, readingGoal)
  },
  books: {
    key: 'books',
    storage,
    whitelist: ['currentlyReading', 'wantToRead', 'finishedReading', 'lastFetched']
    // Persists book lists but not readingActivity or stats, which are refetched
  },
  search: {
    key: 'search',
    storage,
    whitelist: []
    // Search results are not persisted to ensure fresh data on load
  }
};

// Combine reducers with persistence
const rootReducer = combineReducers({
  auth: persistReducer(persistConfigs.auth, authReducer),
  user: persistReducer(persistConfigs.user, userReducer),
  books: persistReducer(persistConfigs.books, bookReducer),
  search: persistReducer(persistConfigs.search, searchReducer)
});

// Configure the store
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/PURGE']
      }
      // Thunk is included by default in getDefaultMiddleware
    })
});

// Create the persistor
export const persistor = persistStore(store);

export default store;