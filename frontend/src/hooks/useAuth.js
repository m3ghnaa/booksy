import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout
} from '../redux/authSlice';
import { clearTokens, getUserFromToken } from '../utils/tokenManager';
import api from '../utils/axiosConfig';

/**
 * Custom hook for authentication management
 * Handles login, logout, token refresh, and expiration alerts
 */
const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);

  /**
   * Handle email/password login
   * @param {string} email - User email
   * @param {string} password - User password
   */
  const login = async (email, password) => {
    dispatch(loginStart());

    try {
      // Use axios instance instead of fetch
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;
      
      if (data.token) {
        
        // Store token in localStorage for persistence
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        // Update Redux store
        dispatch(loginSuccess({
          user: data.user,
          token: data.token,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt
        }));
        
        return true;
      } else {
        throw new Error('No token received');
      }
    } catch (err) {
      dispatch(loginFailure(err.message || 'Login failed'));
      return false;
    }
  };

  /**
   * Handle Google login
   * @param {Object} googleResponse - Response from Google OAuth
   */
  const googleLogin = async (googleResponse) => {
    dispatch(loginStart());

    try {
      // Use axios instance instead of fetch
      const response = await api.post('/auth/google', { token: googleResponse.credential });
      const data = response.data;
      
      if (data.token) {
        
        // Store token in localStorage for persistence
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        // Update Redux store
        dispatch(loginSuccess({
          user: data.user,
          token: data.token,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt
        }));
        
        return true;
      } else {
        throw new Error('No token received');
      }
    } catch (err) {
      dispatch(loginFailure(err.message || 'Google login failed'));
      return false;
    }
  };

  /**
   * Handle user logout
   */
  const handleLogout = useCallback(() => {
    // Clear tokens from localStorage
    clearTokens();
    
    // Call logout API
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/logout`, {
      method: 'GET',
      credentials: 'include', // For cookies
    }).catch(() => {});
    
    // Update Redux store
    dispatch(logout());
    
    // Redirect to login page
    navigate('/login');
  }, [dispatch, navigate]);





  return {
    login,
    googleLogin,
    logout: handleLogout,
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    loading: auth.loading,
    error: auth.error
  };
};

export default useAuth;