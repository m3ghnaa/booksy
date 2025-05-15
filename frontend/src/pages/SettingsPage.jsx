import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/axiosConfig';
import Navbar from '../components/Navbar';
import { syncUserWithUserSlice } from '../redux/authSlice';

// Static list of genres as a fallback
const defaultGenres = [
  'Fiction',
  'Non-Fiction',
  'Science Fiction',
  'Fantasy',
  'Self-Help',
  'Mystery',
  'Romance',
  'Thriller',
  'Biography',
  'History'
];

const SettingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '', // Add email field
    favoriteGenre: '',
    readingGoal: '',
  });
  const [genres, setGenres] = useState(defaultGenres);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Attempt to fetch genres from the backend
    const fetchGenres = async () => {
      try {
        const response = await api.get('/genres');
        if (response.data.genres && Array.isArray(response.data.genres)) {
          setGenres(response.data.genres);
        } else {
          console.warn('SettingsPage: Invalid genres response, using default genres:', response.data);
        }
      } catch (error) {
        console.warn('SettingsPage: Failed to fetch genres, using default genres:', error.message);
      }
    };

    fetchGenres();

    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '', // Prepopulate email from user state
        favoriteGenre: user.favoriteGenre || '',
        readingGoal: user.readingGoal || '',
      });
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    // Validate name
    if (!formData.name || formData.name.length < 3 || formData.name.length > 50) {
      newErrors.name = 'Name must be between 3 and 50 characters';
    }
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'A valid email is required';
    }
    // Validate readingGoal
    const readingGoalNum = parseInt(formData.readingGoal);
    if (formData.readingGoal && (isNaN(readingGoalNum) || readingGoalNum < 1)) {
      newErrors.readingGoal = 'Reading goal must be a positive number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setLoading(true);

    try {
      const readingGoalNum = parseInt(formData.readingGoal);
      const payload = {
        name: formData.name,
        email: formData.email, // Include email in the payload
        favoriteGenre: formData.favoriteGenre,
        ...(readingGoalNum >= 1 && { readingGoal: readingGoalNum }),
      };
      console.log('SettingsPage: Sending payload to /api/users/settings:', payload);
      const response = await api.put('/users/settings', payload);

      if (response.data.success) {
        dispatch(syncUserWithUserSlice(response.data.user));
        console.log('SettingsPage: Dispatched syncUserWithUserSlice with:', response.data.user);
        toast.success('Settings updated successfully!');
        navigate('/dashboard');
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('SettingsPage: Error updating settings:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(error.response?.data?.message || error.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar user={user} />
      <div className="container mt-5 pt-5">
        <h2 className="mb-4">Settings</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              type="text"
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>
          <div className="mb-3">
            <label htmlFor="favoriteGenre" className="form-label">Favorite Genre</label>
            <select
              className={`form-control ${errors.favoriteGenre ? 'is-invalid' : ''}`}
              id="favoriteGenre"
              name="favoriteGenre"
              value={formData.favoriteGenre}
              onChange={handleChange}
            >
              <option value="">Select a genre (optional)</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
            {errors.favoriteGenre && <div className="invalid-feedback">{errors.favoriteGenre}</div>}
          </div>
          <div className="mb-3">
            <label htmlFor="readingGoal" className="form-label">Reading Goal (Books per Year)</label>
            <input
              type="number"
              className={`form-control ${errors.readingGoal ? 'is-invalid' : ''}`}
              id="readingGoal"
              name="readingGoal"
              value={formData.readingGoal}
              onChange={handleChange}
              min="0"
            />
            {errors.readingGoal && <div className="invalid-feedback">{errors.readingGoal}</div>}
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </>
  );
};

export default SettingsPage;