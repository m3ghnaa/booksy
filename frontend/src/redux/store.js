import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';

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
  whitelist: ['profile']
};

// Apply persist to reducers
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  user: persistReducer(userPersistConfig, userReducer),
  books: bookReducer,
  search: searchReducer
});

// Create the store
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

// Create the persistor
export const persistor = persistStore(store);

export default store;