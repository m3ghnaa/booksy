import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';
import api from '../utils/axiosConfig';
import Navbar from '../components/Navbar';
import {
  loginStart,
  loginSuccess,
  loginFailure
} from '../redux/authSlice';

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
      console.log('Login payload:', formData);
      const response = await api.post('/auth/login', formData);
      const { user, token } = response.data;
      console.log('Login response:', { user, token });
      dispatch(loginSuccess({ user, token }));
      localStorage.setItem('token', token);
      toast.success('Logged in successfully');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      console.error('Login error:', error.response?.data);
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
      console.log('Google login credential:', response.credential);
      // Get the backend URL from environment variable or use the production URL as fallback
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://booksy-17xg.onrender.com';
      console.log('Using backend URL for Google login:', backendUrl);
      
      // Use axios directly with the full URL to ensure we're not using localhost
      const res = await axios.post(`${backendUrl}/api/auth/google`, { token: response.credential }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      const { user, token } = res.data;
      console.log('Google login response:', { user, token });
      dispatch(loginSuccess({ user, token }));
      localStorage.setItem('token', token);
      toast.success('Logged in with Google');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Google login failed';
      console.error('Google login error:', error);
      dispatch(loginFailure(message));
      toast.error(message);
    }
  };

  return (
    <>
      <Navbar isAuthPage={true} />
      <div className="container mt-5 flex justify-center">
        <div className="card p-4 shadow-sm max-w-md w-full">
          <h3 className="text-center mb-4">Login</h3>
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
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          {error && <div className="text-red-500 mt-2 text-center">{error}</div>}
          <hr className="my-4" />
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => {
                dispatch(loginFailure('Google login failed'));
                toast.error('Google login failed');
              }}
            />
          </div>
          <p className="mt-3 text-center">
            Don’t have an account? <a href="/signup" className="text-blue-500">Sign up</a>
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginPage;