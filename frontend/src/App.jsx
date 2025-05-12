import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/DashboardPage';
import { GoogleOAuthProvider } from '@react-oauth/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SearchPage from './pages/SearchPage';
import ShelfPage from './pages/ShelfPage';
import AuthRedirect from './components/AuthRedirect';
import ProtectedRoute from './components/ProtectedRoute';
import SettingsPage from './pages/SettingsPage';
import { useDispatch } from 'react-redux';
import { loginSuccess, logout } from './redux/authSlice';
import { setUserProfile, clearUserProfile } from './redux/userSlice';
import api from './utils/axiosConfig';

const App = () => {
  const dispatch = useDispatch();
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          if (response.data.user) {
            dispatch(loginSuccess({
              user: response.data.user,
              token
            }));
            dispatch(setUserProfile(response.data.user));
          } else {
            localStorage.removeItem('token');
            dispatch(logout({ dispatch }));
            dispatch(clearUserProfile());
          }
        } catch (error) {
          console.error('App.jsx: Error initializing auth:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
          localStorage.removeItem('token');
          dispatch(logout({ dispatch }));
          dispatch(clearUserProfile());
        }
      } else {
        dispatch(logout({ dispatch }));
        dispatch(clearUserProfile());
      }
      setIsAuthInitialized(true);
    };
    initializeAuth();
  }, [dispatch]);

  if (!isAuthInitialized) {
    return <div className="container mt-5">Loading...</div>;
  }

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/search" element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          } />
          <Route path="/shelf" element={
            <ProtectedRoute>
              <ShelfPage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/login" element={
            <AuthRedirect>
              <LoginPage />
            </AuthRedirect>
          } />
          <Route path="/signup" element={
            <AuthRedirect>
              <SignupPage />
            </AuthRedirect>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
        <ToastContainer />
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;