import React from 'react';
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

const App = () => {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/shelf" element={<ShelfPage />} />
          <Route path="/login" element={
    <AuthRedirect>
      <LoginPage />
    </AuthRedirect>
  } />
          <Route path="/signup" element={
    <AuthRedirect>
      <SignupPage />
    </AuthRedirect>
  }  />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        <ToastContainer />
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
