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
       /* Global background fix */
body, html {
  background-color: white !important;
  margin: 0;
  padding: 0;
}

/* Page container */
.page-container {
  min-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: white;
}

/* Main content layout */
.main-content {
  display: flex;
  width: 100%;
  max-width: 1100px;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  flex-direction: row; /* Default for large screens */
}

/* Form styling */
.login-form-container {
  width: 45%;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-form-header {
  margin-bottom: 2rem;
}

.login-form-header h4 {
  font-family: 'Cinzel', serif;
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
}

.login-subheading {
  color: #666;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.95rem;
}

.form-label {
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  color: #555;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-control {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-family: 'Montserrat', sans-serif;
  transition: all 0.3s ease;
  background-color: #f9f9f9;
}

.form-control:focus {
  border-color: #008080;
  box-shadow: 0 0 0 2px rgba(0, 128, 128, 0.1);
  background-color: #fff;
  outline: none;
}

.form-control.is-invalid {
  border-color: #dc3545;
  background-color: #fff;
}

.invalid-feedback {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.btn-primary {
  background-color: #008080 !important;
  border-color: #008080 !important;
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  padding: 0.75rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 128, 128, 0.2);
}

.btn-primary:hover {
  background-color: #006666 !important;
  border-color: #006666 !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 128, 128, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 128, 128, 0.2);
}

.btn-primary:disabled {
  background-color: #a3bffa !important;
  border-color: #a3bffa !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Illustration styling */
.illustration-container {
  width: 55%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid #e5e5e5;
}

.illustration-container img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply;
  opacity: 0.9;
  z-index: 0;
}

/* Brand styling */
.brand-container {
  width: 100%;
  text-align: center;
  padding: 1rem 1.5rem;
  background-color: #fff;
  border-bottom: 1px solid rgba(229, 229, 229, 0.5);
  /* On large screens, the brand container is inside the layout */
  position: relative;
}

.brand-container a {
  color: #008080 !important;
  text-decoration: none;
  font-size: 1.50rem !important;
  font-weight: 570 !important;
}

.brand-container a div {
  font-family: 'Cinzel', serif !important;
}

.brand-icon {
  color: rgb(89, 91, 91) !important;
  filter: drop-shadow(1px 1px 1px rgba(0, 128, 128, 0.2));
  padding-right: 0.5rem;
}

.brand-tagline {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  color: #666;
  letter-spacing: 0.5px;
}

/* Google button and separator */
.google-login-container {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

.separator {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  color: #888;
  font-size: 0.9rem;
}

.separator::before,
.separator::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #ddd;
}

.separator::before {
  margin-right: 0.5rem;
}

.separator::after {
  margin-left: 0.5rem;
}

.signup-link {
  font-family: 'Montserrat', sans-serif;
  color: #008080;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.signup-link:hover {
  color: #006666;
  text-decoration: underline;
}

/* Footer styling */
.footer {
  position: absolute;
  bottom: -0.1rem;
  left: 0;
  width: 100%;
  text-align: center;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.8rem;
  color: #888;
  z-index: 10;
}

/* Media Queries */
@media (max-width: 991.98px) {
  /* Medium screens */
  .page-container {
    flex-direction: column;
    padding: 0;
  }
  
  .main-content {
    flex-direction: column;
    box-shadow: none;
    max-width: 100%;
    width: 100%;
  }
  
  .brand-container {
    order: 1; /* Brand on top */
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 1px solid #e5e5e5;
    background-color: white;
  }
  
  .illustration-container {
    order: 2; /* Image second */
    width: 100%;
    height: 300px; /* Fixed height for better appearance */
  }
  
  .login-form-container {
    order: 3; /* Form third */
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .footer {
    order: 4; /* Footer last */
    position: relative;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }
}

@media (max-width: 767.98px) {
  /* Small screens */
  .page-container {
    min-height: auto;
    padding: 0;
  }
  
  .main-content {
    border-radius: 0;
  }
  
  .brand-container {
    padding: 0.75rem 1rem;
  }
  
  .illustration-container {
    height: 220px;
  }
  
  .login-form-container {
    padding: 1.5rem;
  }
  
  .footer {
    margin-top: 1.5rem;
  }
}`
}
      </style>
   {/* Brand Container - This will be on top for medium and small screens */}
   <div className="brand-container">
        <a href="/">
          <div className="d-flex align-items-center justify-content-center">
            <FaBook className="brand-icon" />
            booksy
          </div>
        </a>
        <div className="brand-tagline">Organize Your Reading Journey</div>
      </div>
      
      <div className="page-container">
        {/* Main Content */}
        <div className="main-content">
          {/* Login Form */}
          <div className="login-form-container">
            <div className="login-form-header">
              <h4 style={{ fontWeight: '470' }}>Hello!</h4>
              <p className="login-subheading">Sign in to continue to your booksy account</p>
            </div>
            
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
                  placeholder="Your email"
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  disabled={loading}
                  placeholder="Your password"
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
            {error && <div className="text-danger mt-3 text-center">{error}</div>}
            
            {/* Separator and Google Sign-In Button */}
            <div className="separator">or continue with</div>
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

            {/* Sign Up Link */}
            <p className="mt-4 text-center">
              Don't have an account? <a href="/signup" className="signup-link">Create one</a>
            </p>
          </div>

          {/* Illustration (right side on large screens, below brand on medium/small) */}
          <div className="illustration-container">
            <img
              src="/login-image.png"
              alt="Reading Illustration"
              className="illustration-img"
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          © 2025 booksy. All rights reserved.
        </footer>
      </div>
    </>
  );
};

export default LoginPage;