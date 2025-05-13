import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import api from '../utils/axiosConfig';
import { signupStart, signupSuccess, signupFailure } from '../redux/authSlice';
import { setUserProfile } from '../redux/userSlice';
import Navbar from '../components/Navbar';
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
      // Error handled by toast
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
    <Navbar isAuthPage={true} />
    <div className="container mt-5">
      <h2 className="mb-4 text-center">Sign Up</h2>
      <div className="row justify-content-center">
        <div className="col-md-6">
          <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
            <div className="mb-3">
              <label htmlFor="name" className="form-label">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                disabled={loading}
              />
              {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                disabled={loading}
              />
              {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="name" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                disabled={loading}
              />
              {formErrors.password && <div className="invalid-feedback">{formErrors.password}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-control ${formErrors.confirmPassword ? 'is-invalid' : ''}`}
                disabled={loading}
              />
              {formErrors.confirmPassword && <div className="invalid-feedback">{formErrors.confirmPassword}</div>}
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>

          <div className="text-center mt-3">
            <p>Or sign up with Google:</p>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              disabled={loading}
            />
          </div>

          <p className="text-center mt-3">
            Already have an account? <a href="/login">Log in</a>
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default SignupPage;