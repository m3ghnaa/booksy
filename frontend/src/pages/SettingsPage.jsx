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

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Populate form with existing user data
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('/users/settings', {
        name: formData.name,
        favoriteGenre: formData.favoriteGenre,
        readingGoal: parseInt(formData.readingGoal) || 0,
      });

      if (response.data.success) {
        // Update both authSlice and userSlice using the sync thunk
        dispatch(syncUserWithUserSlice(response.data.user));
        console.log('SettingsPage: Dispatched syncUserWithUserSlice with:', response.data.user);
        toast.success('Settings updated successfully!');
        navigate('/dashboard');
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('SettingsPage: Error updating settings:', error.message);
      toast.error(error.message || 'Failed to update settings');
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
              className="form-control"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
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
              className="form-control"
              id="readingGoal"
              name="readingGoal"
              value={formData.readingGoal}
              onChange={handleChange}
              min="0"
            />
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