import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUserProfile, clearUserProfile } from '../redux/userSlice'; 
import { useNavigate } from 'react-router-dom'; 
import { clearSearchResults } from '../redux/searchSlice';
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';  
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); 

  const { profile } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(clearSearchResults());
  }, [dispatch]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        dispatch(setUserProfile(decodedToken));
      } catch (error) {
        console.error('Failed to fetch profile', error);
        navigate('/login');
      }
    };

    fetchInitialData();
  }, [dispatch, navigate]);
  


  const handleLogout = () => {
    dispatch(clearUserProfile());
    localStorage.removeItem('token');
    navigate('/login');
    toast.info('You have logged out.');
  };



  return (
    <>   
    <Navbar user={profile} onLogout={handleLogout} />
    <div className="container mt-4">
      <div className="row">
        <div className="col-12 text-center mb-4">
          {profile ? (
            <div>
              <img
                src={profile.avatar || 'https://via.placeholder.com/80'}
                alt="User Avatar"
                className="rounded-circle"
                width="80"
                height="80"
              />
              <h3>{profile.name}</h3>

              <p> Profile stats or something...</p>
            </div>
          ) : (
            <p>Loading profile...</p>
          )}
        </div>
      </div>

    </div>
  </>
  );
};

export default Dashboard;