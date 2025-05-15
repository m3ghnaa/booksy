import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/axiosConfig';
import Navbar from '../components/Navbar';
import { syncUserWithUserSlice } from '../redux/authSlice';

const SettingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    favoriteGenre: '',
    readingGoal: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      setFormData({
        name: user.name || '',
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
    // Clear error for the field being edited
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name || formData.name.length < 3 || formData.name.length > 50) {
      newErrors.name = 'Name must be between 3 and 50 characters';
    }
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
        favoriteGenre: formData.favoriteGenre,
        ...(readingGoalNum >= 1 && { readingGoal: readingGoalNum }), // Only include readingGoal if >= 1
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
            <label htmlFor="favoriteGenre" className="form-label">Favorite Genre</label>
            <input
              type="text"
              className="form-control"
              id="favoriteGenre"
              name="favoriteGenre"
              value={formData.favoriteGenre}
              onChange={handleChange}
            />
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