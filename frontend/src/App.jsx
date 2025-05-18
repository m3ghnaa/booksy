import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { PacmanLoader } from 'react-spinners';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/DashboardPage';
import { GoogleOAuthProvider } from '@react-oauth/google';
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
import LandingPage from './pages/LandingPage';

// Component to handle routes and authentication logic
const AppContent = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [authAttempted, setAuthAttempted] = useState(false);

  // Define public routes that don't require authentication initialization
  const publicRoutes = ['/', '/login', '/signup'];

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
      setAuthAttempted(true);
      setIsAuthInitialized(true);
    };

    // Skip auth initialization for public routes on initial load
    if (publicRoutes.includes(location.pathname) && !authAttempted) {
      setIsAuthInitialized(true); // Allow public routes to render immediately
    } else if (!authAttempted) {
      initializeAuth(); // Run auth for protected routes
    }
  }, [dispatch, location.pathname, authAttempted]);

  // Show loading spinner only for protected routes during initialization
  if (!isAuthInitialized && !publicRoutes.includes(location.pathname)) {
    return (
      <div className="container d-flex flex-column justify-content-center align-items-center min-vh-100">
        <PacmanLoader
          color="#008080"
          size={40}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
        <p className="mt-3 text-muted text-center">
          Initializing authentication... Please wait.
        </p>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
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
    </>
  );
};

const App = () => {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <Router>
        <AppContent />
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;