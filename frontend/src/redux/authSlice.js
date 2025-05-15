import { createSlice } from '@reduxjs/toolkit';
import { clearUserProfile } from './userSlice';
import { setUserProfile } from './userSlice'; // Import to sync userSlice
import api from '../utils/axiosConfig';
import { PURGE } from 'redux-persist';
import { toast } from 'react-toastify';

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  expiresAt: null, // Will store as ISO string (e.g., "2025-05-15T16:02:00.000Z")
  isAuthenticated: false,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      if (!action.payload.user) {
        state.loading = false;
        state.error = 'No user data provided';
        state.isAuthenticated = false;
        return;
      }
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || null;
      // Serialize expiresAt to ISO string if it's a Date
      state.expiresAt = action.payload.expiresAt instanceof Date
        ? action.payload.expiresAt.toISOString()
        : action.payload.expiresAt || null;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.expiresAt = null;
    },
    signupStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    signupSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || null;
      // Serialize expiresAt to ISO string if it's a Date
      state.expiresAt = action.payload.expiresAt instanceof Date
        ? action.payload.expiresAt.toISOString()
        : action.payload.expiresAt || null;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
    signupFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.expiresAt = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.expiresAt = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload
        };
      }
    }
  }
});

// Thunk for logout
export const logoutUser = () => async (dispatch) => {
  try {
    // Call backend logout to clear cookies
    await api.get('/api/auth/logout');
    toast.info('Logged out successfully');
  } catch (error) {
    console.error('logoutUser: Error during logout:', error.message);
    toast.error('Failed to logout on server, proceeding with client-side logout');
  } finally {
    // Clear auth and user states
    dispatch(logout());
    dispatch(clearUserProfile());
    
    // Clear persisted state
    dispatch({
      type: PURGE,
      key: 'auth',
      result: () => null
    });
    dispatch({
      type: PURGE,
      key: 'user',
      result: () => null
    });
  }
};

// Thunk to sync user data with userSlice
export const syncUserWithUserSlice = (userData) => (dispatch) => {
  dispatch(updateUser(userData));
  dispatch(setUserProfile(userData));
};

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  signupStart,
  signupSuccess,
  signupFailure,
  logout,
  updateUser
} = authSlice.actions;

export default authSlice.reducer;