import { createSlice } from '@reduxjs/toolkit';
import { clearUserProfile } from './userSlice';
import api from '../utils/axiosConfig';
import { PURGE } from 'redux-persist';

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  expiresAt: null,
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
      state.expiresAt = action.payload.expiresAt || null;
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
      state.expiresAt = action.payload.expiresAt || null;
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
  } catch (error) {
    console.error('logoutUser: Error during logout:', error);
    dispatch(logout());
    dispatch(clearUserProfile());
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