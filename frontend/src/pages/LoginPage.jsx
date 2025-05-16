import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';
import api from '../utils/axiosConfig';
import { loginStart, loginSuccess, loginFailure } from '../redux/authSlice';
import { FaBook } from 'react-icons/fa';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix form errors');
      return;
    }

    dispatch(loginStart());
    try {
      const response = await api.post('/auth/login', formData);
      const { user, token } = response.data;

      dispatch(loginSuccess({ user, token }));
      localStorage.setItem('token', token);
      toast.success('Logged in successfully');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      console.error('Login error:', error.response?.data);
      localStorage.removeItem('token');
      dispatch(loginFailure(message));
      if (message.includes('No password found')) {
        toast.error(message, {
          autoClose: 5000,
          action: {
            text: 'Sign up again',
            onClick: () => navigate('/signup')
          }
        });
      } else {
        toast.error(message);
      }
    }
  };

  const handleGoogleLogin = async (response) => {
    dispatch(loginStart());
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://booksy-17xg.onrender.com';
      const res = await axios.post(`${backendUrl}/api/auth/google`, { token: response.credential }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const { user, token } = res.data;

      dispatch(loginSuccess({ user, token }));
      localStorage.setItem('token', token);
      toast.success('Logged in with Google');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Google login failed';
      console.error('Google login error:', error);
      localStorage.removeItem('token');
      dispatch(loginFailure(message));
      toast.error(message);
    }
  };

  return (
    <>
      <style>
        {`
          /* Center the entire page content */
          .page-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0 1rem;
            background-color: #f8f9fa; /* Light background */
          }

          /* Brand styling */
          .brand-container {
            padding: 2rem 0;
            text-align: center;
          }
          .navbar-brand {
            font-family: 'Cinzel', serif !important;
            font-size: 1.5rem !important; /* Slightly larger for prominence */
            color: #008080 !important; /* Teal */
            font-weight: bold !important;
            text-decoration: none;
          }
          .navbar-brand:hover {
            color: #006666 !important; /* Darker teal on hover */
          }
          .brand-icon {
            color: #008080 !important;
            filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.3));
            transition: transform 0.3s ease, filter 0.3s ease !important;
          }
          .brand-icon:hover {
            transform: scale(1.2) !important;
          }

          /* Main content layout for desktop */
          .main-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            max-width: 1200px;
            padding: 2rem 0;
          }

          /* Form styling */
          .login-form-container {
            width: 100%;
            max-width: 400px; /* Slightly wider form */
          }
          .login-form-card {
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            background-color: #fff;
          }
          .login-form-card h3 {
            font-family: 'Cinzel', serif;
            color: #333;
            margin-bottom: 1.5rem;
          }
          .form-label {
            font-family: 'Montserrat', sans-serif;
            font-weight: 600;
            color: #333;
            margin-bottom: 0.5rem;
          }
          .form-control {
            border: 1px solid #ced4da;
            border-radius: 5px;
            padding: 0.75rem;
            font-family: 'Montserrat', sans-serif;
            transition: border-color 0.3s ease;
          }
          .form-control:focus {
            border-color: #008080;
            box-shadow: 0 0 5px rgba(0, 128, 128, 0.3);
            outline: none;
          }
          .form-control.is-invalid {
            border-color: #dc3545;
          }
          .invalid-feedback {
            font-family: 'Montserrat', sans-serif;
            font-size: 0.875rem;
          }
          .btn-primary {
            background-color: #008080 !important; /* Teal */
            border-color: #008080 !important;
            font-family: 'Montserrat', sans-serif;
            font-weight: 500;
            padding: 0.75rem;
            transition: background-color 0.3s ease;
          }
          .btn-primary:hover {
            background-color: #006666 !important; /* Darker teal */
            border-color: #006666 !important;
          }
          .btn-primary:disabled {
            background-color: #a3bffa !important;
            border-color: #a3bffa !important;
            cursor: not-allowed;
          }

          /* Illustration styling */
          .illustration-container {
            width: 100%;
            max-width: 500px;
          }
          .illustration-container img {
            width: 100%;
            height: auto;
            object-fit: cover;
          }

          /* Google button and separator */
          .google-login-container {
            text-align: center;
            margin-top: 1.5rem;
          }
          .separator {
            margin: 1.5rem 0;
            border-top: 1px solid #ced4da;
          }
          .signup-link {
            font-family: 'Montserrat', sans-serif;
            color: #008080;
            text-decoration: none;
          }
          .signup-link:hover {
            color: #006666;
            text-decoration: underline;
          }

          /* Desktop layout */
          @media (min-width: 768px) {
            .page-container {
              justify-content: center;
            }
            .main-content {
              flex-direction: row;
              gap: 2rem;
            }
            .login-form-container {
              width: 40%;
            }
            .illustration-container {
              width: 50%;
              display: block;
            }
          }

          /* Mobile layout */
          @media (max-width: 767.98px) {
            .main-content {
              flex-direction: column;
              padding: 1rem 0;
            }
            .illustration-container {
              max-width: 100%;
              margin-bottom: 1rem;
            }
            .illustration-container img {
              border-bottom-left-radius: 50%;
              border-bottom-right-radius: 50%;
              overflow: hidden;
            }
            .login-form-container {
              max-width: 100%;
            }
            .brand-container {
              padding: 1.5rem 0;
            }
          }
        `}
      </style>
      <div className="page-container">
        {/* Brand Name with Icon */}
        <div className="brand-container">
          <a href="/" className="navbar-brand">
            <div className="d-flex align-items-center justify-content-center">
              <FaBook className="me-2 brand-icon" size={24} />
              Booksy
            </div>
          </a>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Login Form */}
          <div className="login-form-container">
            <div className="login-form-card">
              <h3 className="text-center">Login</h3>
              <form onSubmit={handleEmailLogin}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    disabled={loading}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    disabled={loading}
                  />
                  {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
              {error && <div className="text-red-500 mt-2 text-center">{error}</div>}
            </div>

             {/* Sign Up Link */}
             <p className="mt-3 text-center">
              Don’t have an account? <a href="/signup" className="signup-link">Sign up</a>
            </p>

            {/* Separator and Google Sign-In Button */}
            <hr className="separator" />
            <div className="google-login-container">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => {
                  localStorage.removeItem('token');
                  dispatch(loginFailure('Google login failed'));
                  toast.error('Google login failed');
                }}
              />
            </div>
          </div>

          {/* Illustration (Mobile: Top, Desktop: Right) */}
          <div className="illustration-container">
            <img
              src="/login-image.png"
              alt="Reading Illustration"
              className="illustration-img"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;