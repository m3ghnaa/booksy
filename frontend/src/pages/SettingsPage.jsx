import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../utils/axiosConfig';
import { updateUser, logoutUser } from '../redux/authSlice';
import { setUserProfile } from '../redux/userSlice';
import Navbar from '../components/Navbar';
import { setBooks } from '../redux/bookSlice';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';

const SettingsPage = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: null,
    favoriteGenre: '',
    readingGoal: ''
  });
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);

  const getApiBaseUrl = () => {
    return process.env.REACT_APP_SERVER_URL || 'https://booksy-17xg.onrender.com/api';
  };

  const formatAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) {
      return avatarPath.replace('http:', 'https:');
    }
    if (avatarPath.startsWith('/uploads/')) {
      const baseUrl = getApiBaseUrl();
      return `${baseUrl}${avatarPath}?t=${Date.now()}`;
    }
    return avatarPath;
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
        avatar: null,
        favoriteGenre: user.favoriteGenre || '',
        readingGoal: user.readingGoal ? user.readingGoal.toString() : ''
      });
      if (user.avatar) {
        setPreview(formatAvatarUrl(user.avatar));
      } else {
        setPreview(null);
      }
      setHasError(false);
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
    if (formData.readingGoal && (isNaN(formData.readingGoal) || parseInt(formData.readingGoal) < 0)) {
      newErrors.readingGoal = 'Reading goal must be a non-negative number';
    }
    if (formData.avatar) {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(formData.avatar.type)) {
        newErrors.avatar = 'Avatar must be a PNG, JPG, or JPEG file';
      }
      if (formData.avatar.size > 5 * 1024 * 1024) {
        newErrors.avatar = 'Avatar file size must be less than 5MB';
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
    setFormData((prev) => ({
      ...prev,
      avatar: file || null
    }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setHasError(false);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(user?.avatar ? formatAvatarUrl(user.avatar) : null);
      setHasError(false);
    }
    if (errors.avatar) {
      setErrors((prev) => ({
        ...prev,
        avatar: ''
      }));
    }
  };

  const handleRemoveAvatar = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to remove avatar');
      return;
    }
    setIsRemovingAvatar(true);
    try {
      const response = await api.delete('/users/avatar');
      const updatedUser = {
        ...user,
        avatar: null
      };
      dispatch(updateUser(updatedUser));
      dispatch(setUserProfile(updatedUser));
      setFormData((prev) => ({
        ...prev,
        avatar: null
      }));
      setPreview(null);
      setHasError(false);
      toast.success('Avatar removed successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to remove avatar';
      toast.error(errorMessage);
    } finally {
      setIsRemovingAvatar(false);
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
      formDataToSend.append('readingGoal', formData.readingGoal);
      if (formData.avatar) {
        formDataToSend.append('avatar', formData.avatar);
      }

      const response = await api.put('/users/settings', formDataToSend); 

      let updatedAvatar = response.data.user.avatar;
      if (response.data.avatarFilename) {
        updatedAvatar = formatAvatarUrl(`/uploads/${response.data.avatarFilename}`);
      } else if (updatedAvatar) {
        updatedAvatar = formatAvatarUrl(updatedAvatar);
      }
      const updatedUser = {
        ...response.data.user,
        avatar: updatedAvatar
      };
      dispatch(updateUser(updatedUser));
      dispatch(setUserProfile(updatedUser));
      const refreshResponse = await api.get('/auth/me');
      const refreshedUser = {
        ...refreshResponse.data.user,
        avatar: formatAvatarUrl(refreshResponse.data.user.avatar)
      };
      dispatch(updateUser(refreshedUser));
      setPreview(updatedUser.avatar);
      setFormData((prev) => ({
        ...prev,
        avatar: null
      }));
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
          <div className="mb-3">
            <label htmlFor="avatar" className="form-label">Avatar (PNG, JPG, JPEG, max 5MB)</label>
            <input
              type="file"
              id="avatar"
              name="avatar"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileChange}
              className={`form-control ${errors.avatar ? 'is-invalid' : ''}`}
              disabled={isSubmitting}
            />
            {errors.avatar && <div className="invalid-feedback">{errors.avatar}</div>}
          </div>
          {preview ? (
            <div className="mb-3">
              <label className="form-label">Avatar Preview</label>
              <div>
                <img
                  src={preview}
                  alt="Avatar Preview"
                  className="img-fluid rounded"
                  style={{ maxWidth: '100px', maxHeight: '100px' }}
                  onError={() => {
                    console.error('Failed to load avatar image');
                    setHasError(true);
                    setPreview(null);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <label className="form-label">Avatar Preview</label>
              <FaUserCircle
                className="rounded text-muted"
                size={100}
                style={{ display: 'block', margin: 'auto' }}
              />
            </div>
          )}
          {preview && (
            <div className="mb-3">
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleRemoveAvatar}
                disabled={isRemovingAvatar || isSubmitting}
              >
                {isRemovingAvatar ? 'Removing...' : 'Remove Avatar'}
              </button>
            </div>
          )}
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