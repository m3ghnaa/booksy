import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { FaBook } from 'react-icons/fa';
import api from '../utils/axiosConfig';
import { signupStart, signupSuccess, signupFailure } from '../redux/authSlice';
import { setUserProfile } from '../redux/userSlice';

const SignupPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Name is required';
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Valid email is required';
    }
    if (!formData.password || formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix form errors');
      return;
    }

    dispatch(signupStart());
    try {
      const response = await api.post('/auth/signup', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      dispatch(signupSuccess({
        user: response.data.user,
        token: response.data.token
      }));
      dispatch(setUserProfile(response.data.user));
      localStorage.setItem('token', response.data.token);
      toast.success('Signup successful');
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Signup failed';
      dispatch(signupFailure(errorMessage));
      toast.error(errorMessage);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    dispatch(signupStart());
    try {
      const response = await api.post('/auth/google', {
        token: credentialResponse.credential
      });

      dispatch(signupSuccess({
        user: response.data.user,
        token: response.data.token
      }));
      dispatch(setUserProfile(response.data.user));
      localStorage.setItem('token', response.data.token);
      toast.success('Google signup successful');
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Google signup failed';
      console.error('Google signup error:', {
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data
      });
      dispatch(signupFailure(errorMessage));
      toast.error(errorMessage);
    }
  };

  const handleGoogleError = () => {
    console.error('Google signup failed: Google login error');
    dispatch(signupFailure('Google signup failed'));
    toast.error('Google signup failed');
  };

  return (
    <>
      <style>{
 `/* Global background fix */
body, html {
  background-color: white !important;
  margin: 0;
  padding: 0;
}

/* Page container */
.page-container {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: white;
}

/* Main content layout */
.main-content {
margin-top: 2rem;
margin-bottom: 1rem;
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
.signup-form-container {
  width: 45%;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.signup-form-header {
  margin-bottom: 2rem;
}

.signup-form-header h4 {
  font-family: 'Cinzel', serif;
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
}

.signup-subheading {
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

.login-link {
  font-family: 'Montserrat', sans-serif;
  color: #008080;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.login-link:hover {
  color: #006666;
  text-decoration: underline;
}

/* Footer styling */
.footer {
  position: absolute;
  bottom: -0.5rem;
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
  
  .signup-form-container {
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
  
  .signup-form-container {
    padding: 1.5rem;
  }
  
  .footer {
    margin-top: 1.5rem;
  }
}`
    }</style>
      
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
          {/* Signup Form */}
          <div className="signup-form-container">
            <div className="signup-form-header">
              <h4 style={{ fontWeight: '570' }}>Join booksy</h4>
              <p className="signup-subheading">Create your account to start your reading journey</p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                  disabled={loading}
                  placeholder="Your name"
                />
                {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
              </div>
              
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                  disabled={loading}
                  placeholder="Your email"
                />
                {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
              </div>
              
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                  disabled={loading}
                  placeholder="Create a password"
                />
                {formErrors.password && <div className="invalid-feedback">{formErrors.password}</div>}
              </div>
              
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-control ${formErrors.confirmPassword ? 'is-invalid' : ''}`}
                  disabled={loading}
                  placeholder="Confirm your password"
                />
                {formErrors.confirmPassword && <div className="invalid-feedback">{formErrors.confirmPassword}</div>}
              </div>
              
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
            
            {error && <div className="text-danger mt-3 text-center">{error}</div>}
            
            {/* Separator and Google Sign-In Button */}
            <div className="separator">or continue with</div>
            <div className="google-login-container">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                disabled={loading}
              />
            </div>

            {/* Login Link */}
            <p className="mt-4 text-center">
              Already have an account? <a href="/login" className="login-link">Sign in</a>
            </p>
          </div>

          {/* Illustration (right side on large screens, below brand on medium/small) */}
          <div className="illustration-container">
            <img
              src="/sign-up-image.png" 
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

export default SignupPage;