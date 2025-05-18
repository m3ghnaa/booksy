import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/axiosConfig';
import Navbar from '../components/Navbar';
import { syncUserWithUserSlice, logoutUser } from '../redux/authSlice';
import { FaUserCircle, FaUserAstronaut, FaUserNinja, FaUserSecret, FaUserTie } from 'react-icons/fa';

// Static list of genres
const genres = [
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

// Avatar options with styles
const avatarOptions = [
  { icon: FaUserCircle, name: 'FaUserCircle', style: { color: '#008080', backgroundColor: '#e7f1ff', borderColor: '#008080' } }, 
  { icon: FaUserAstronaut, name: 'FaUserAstronaut', style: { color: '#ff5733', backgroundColor: '#ffe7e3', borderColor: '#ff5733' } },
  { icon: FaUserNinja, name: 'FaUserNinja', style: { color: '#28a745', backgroundColor: '#e6f4ea', borderColor: '#28a745' } },
  { icon: FaUserSecret, name: 'FaUserSecret', style: { color: '#6f42c1', backgroundColor: '#f3e8ff', borderColor: '#6f42c1' } },
  { icon: FaUserTie, name: 'FaUserTie', style: { color: '#dc3545', backgroundColor: '#f8e1e4', borderColor: '#dc3545' } }
];

const SettingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    favoriteGenre: '',
    readingGoal: '',
    avatar: ''
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
        email: user.email || '',
        favoriteGenre: user.favoriteGenre || '',
        readingGoal: user.readingGoal || '',
        avatar: user.avatar || 'FaUserCircle'
      });
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleAvatarSelect = (avatarName) => {
    setFormData((prev) => ({
      ...prev,
      avatar: avatarName
    }));
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
        email: formData.email,
        favoriteGenre: formData.favoriteGenre,
        ...(readingGoalNum >= 1 && { readingGoal: readingGoalNum }),
        avatar: formData.avatar
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

  const handleLogout = () => {
      dispatch(logoutUser());
      navigate('/login');
      toast.info('You have logged out.');
    };

  return (
    <>
      <style>
        {`
          .avatar-option {
            cursor: pointer;
            padding: 10px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-right: 10px;
            transition: all 0.3s ease;
            width: 60px;
            height: 60px;
          }
          .avatar-option.selected {
            border: 3px solid;
            transform: scale(1.1);
          }
          .avatar-option:hover {
            transform: scale(1.1);
          }
          .avatar-icon {
            font-size: 2rem;
          }
          /* Custom teal button style to override btn-primary */
          .btn-teal {
            background-color: #008080 !important;
            border-color: #008080 !important;
            color: #fff !important;
          }
          .btn-teal:hover {
            background-color: #006666 !important; /* Darker teal on hover */
            border-color: #006666 !important;
          }
          .btn-teal:disabled {
            background-color: #00808080 !important; /* Lighter teal when disabled */
            border-color: #00808080 !important;
            opacity: 0.65;
          }
        `}
      </style>
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
            <label className="form-label">Select Avatar</label>
            <div className="d-flex flex-wrap">
              {avatarOptions.map(({ icon: Icon, name, style }) => (
                <div
                  key={name}
                  className={`avatar-option ${formData.avatar === name ? 'selected' : ''}`}
                  style={{
                    color: style.color,
                    backgroundColor: style.backgroundColor,
                    borderColor: style.borderColor,
                    border: formData.avatar === name ? `3px solid ${style.borderColor}` : '1px solid #ccc'
                  }}
                  onClick={() => handleAvatarSelect(name)}
                  title={name}
                >
                  <Icon className="avatar-icon" />
                </div>
              ))}
            </div>
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
          <button type="submit" className="btn btn-teal" disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </>
  );
};

export default SettingsPage;