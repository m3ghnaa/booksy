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
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    favoriteGenre: '',
    readingGoal: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  const getApiBaseUrl = () => {
    return process.env.REACT_APP_SERVER_URL || 'https://booksy-17xg.onrender.com/api';
  };

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
      setPreview(user.avatar || null);
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
    if (avatar) {
      if (!avatar.type.startsWith('image/')) {
        newErrors.avatar = 'Only image files are allowed';
      }
      if (avatar.size > 5 * 1024 * 1024) {
        newErrors.avatar = 'Image size must be less than 5MB';
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log('Selected file:', file);
    if (file) {
      setAvatar(file);
      setIsRemovingAvatar(false);
      setHasError(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('FileReader preview generated:', reader.result);
        setPreview(reader.result);
      };
      reader.onerror = () => {
        console.error('FileReader error occurred');
        setHasError(true);
        setPreview(null);
        setAvatar(null);
        toast.error('Failed to read the image file');
      };
      reader.readAsDataURL(file);
    } else {
      setAvatar(null);
      setPreview(null);
      setHasError(false);
      console.log('No file selected, clearing avatar and preview');
    }
  };

  const handleRemoveAvatar = async () => {
    console.log('Removing avatar');
    setAvatar(null);
    setPreview(null);
    setHasError(false);
    setIsRemovingAvatar(true);
    try {
      await api.delete('/users/avatar');
      console.log('Avatar deleted on server');
      const updatedUser = { ...user, avatar: null };
      dispatch(updateUser(updatedUser));
      dispatch(setUserProfile(updatedUser));
      toast.success('Avatar removed successfully');
    } catch (error) {
      console.error('Failed to delete avatar on server:', error);
      toast.error('Failed to remove avatar');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('handleSubmit called at:', new Date().toISOString()); // Test log
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
      if (avatar) {
        console.log('Appending avatar to FormData:', avatar);
        formDataToSend.append('avatar', avatar);
        formDataToSend.append('avatarExpected', 'true');
      } else {
        console.log('No avatar to append to FormData');
        if (isRemovingAvatar) {
          formDataToSend.append('avatar', '');
        }
      }

      for (let [key, value] of formDataToSend.entries()) {
        console.log(`FormData entry: ${key}=${value}`);
      }

      const response = await api.put('/users/settings', formDataToSend);
      console.log('Update response:', response.data);
      const updatedUser = response.data.user;
      dispatch(updateUser(updatedUser));
      dispatch(setUserProfile(updatedUser));
      setPreview(updatedUser.avatar || null);
      setIsRemovingAvatar(false);
      const refreshResponse = await api.get('/auth/me');
      console.log('Refresh response (/auth/me):', refreshResponse.data);
      dispatch(updateUser(refreshResponse.data.user));
      toast.success('Profile updated successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      console.error('Update error:', error);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    dispatch(setBooks({
      currentlyReading: [],
      wantToRead: [],
      finishedReading: []
    }));
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
            <label htmlFor="avatar" className="form-label">Profile Picture</label>
            <div className="d-flex align-items-center mb-2">
              {preview ? (
                <img
                  src={preview}
                  alt="Avatar Preview"
                  className="rounded-circle me-3"
                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="rounded-circle bg-secondary me-3 d-flex align-items-center justify-content-center"
                  style={{ width: '50px', height: '50px' }}
                >
                  <span className="text-white">No Image</span>
                </div>
              )}
              <div>
                <input
                  type="file"
                  id="avatar"
                  name="avatar"
                  accept="image/*"
                  onChange={handleFileChange}
                  className={`form-control ${errors.avatar ? 'is-invalid' : ''}`}
                  disabled={isSubmitting}
                />
                {preview && (
                  <button
                    type="button"
                    className="btn btn-link text-danger p-0 mt-1"
                    onClick={handleRemoveAvatar}
                    disabled={isSubmitting}
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>
            {errors.avatar && <div className="invalid-feedback d-block">{errors.avatar}</div>}
            {hasError && <div className="text-danger">Error loading image</div>}
          </div>
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