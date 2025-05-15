import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../utils/axiosConfig';
import { updateUser, logoutUser } from '../redux/authSlice';
import { setUserProfile } from '../redux/userSlice';
import Navbar from '../components/Navbar';
import { setBooks } from '../redux/bookSlice';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    favoriteGenre: '',
    readingGoal: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !user && !isLoadingUser) {
      const fetchUser = async () => {
        setIsLoadingUser(true);
        try {
          const response = await api.get('/auth/me');
          dispatch(updateUser(response.data.user));
          dispatch(setUserProfile(response.data.user));
        } catch (error) {
          toast.error('Failed to load user data. Please log in again.');
          localStorage.removeItem('token');
          dispatch(logoutUser());
        } finally {
          setIsLoadingUser(false);
        }
      };
      fetchUser();
    }
  }, [isAuthenticated, user, dispatch, isLoadingUser]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        favoriteGenre: user.favoriteGenre || '',
        readingGoal: user.readingGoal ? user.readingGoal.toString() : ''
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Name is required';
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (formData.readingGoal !== '') {
      const parsedGoal = parseInt(formData.readingGoal);
      if (isNaN(parsedGoal) || parsedGoal < 0) {
        newErrors.readingGoal = 'Reading goal must be a non-negative number';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to update settings');
      return;
    }
    if (!validateForm()) {
      toast.error('Please fix form errors');
      return;
    }
    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('favoriteGenre', formData.favoriteGenre);
      if (formData.readingGoal !== '') {
        formDataToSend.append('readingGoal', parseInt(formData.readingGoal));
      }

      const response = await api.put('/users/settings', formDataToSend);
      const updatedUser = response.data.user;
      dispatch(updateUser(updatedUser));
      dispatch(setUserProfile(updatedUser));
      await api.get('/auth/me').then((refreshResponse) => {
        dispatch(updateUser(refreshResponse.data.user));
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    dispatch(setBooks({ currentlyReading: [], wantToRead: [], finishedReading: [] }));
    navigate('/login');
    toast.info('You have logged out.');
  };

  if (!isAuthenticated) {
    return <div className="container mt-5">Please log in to view settings.</div>;
  }
  if (isLoadingUser) {
    return <div className="container mt-5">Loading user data...</div>;
  }

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="container mt-5 pt-5">
        <h2 className="mb-4">Settings</h2>
        <form onSubmit={handleSubmit} className="card p-4 shadow-sm" style={{ maxWidth: '500px' }}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              disabled={isSubmitting}
            />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              disabled={isSubmitting}
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>
          <div className="mb-3">
            <label htmlFor="favoriteGenre" className="form-label">Favorite Genre</label>
            <input
              type="text"
              id="favoriteGenre"
              name="favoriteGenre"
              value={formData.favoriteGenre}
              onChange={handleChange}
              className={`form-control ${errors.favoriteGenre ? 'is-invalid' : ''}`}
              disabled={isSubmitting}
              placeholder="e.g. Science Fiction, Fantasy, Mystery"
            />
            {errors.favoriteGenre && <div className="invalid-feedback">{errors.favoriteGenre}</div>}
          </div>
          <div className="mb-3">
            <label htmlFor="readingGoal" className="form-label">Reading Goal (books per year)</label>
            <input
              type="number"
              id="readingGoal"
              name="readingGoal"
              value={formData.readingGoal}
              onChange={handleChange}
              className={`form-control ${errors.readingGoal ? 'is-invalid' : ''}`}
              disabled={isSubmitting}
              min="0"
              placeholder="e.g. 12"
            />
            {errors.readingGoal && <div className="invalid-feedback">{errors.readingGoal}</div>}
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </>
  );
};

export default SettingsPage;