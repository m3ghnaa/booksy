import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Tab, Tabs } from 'react-bootstrap';
import { setUserProfile, clearUserProfile } from '../redux/userSlice'; 
import { useNavigate } from 'react-router-dom'; 

const Dashboard = () => {
  const [key, setKey] = useState('currentlyReading');
  const dispatch = useDispatch();
  const navigate = useNavigate(); 
  
  // Redux state for user profile and books
  const { profile } = useSelector((state) => state.user);
  const { currentlyReading, wantToRead, finishedReading } = useSelector((state) => state.books);

  // Fetch user profile when the component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Assuming you have the token in localStorage
        const token = localStorage.getItem('token');
        if (token) {
          // Decoding JWT token (or fetch from API if needed)
          const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decoding JWT

          // Dispatch the action to update the Redux store with the decoded profile
          dispatch(setUserProfile(decodedToken));
        } else {
          // If no token, maybe show an error or redirect to login
          console.log("No token found");
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }

    };

    fetchUserProfile();
  }, [dispatch]); 

  const handleLogout = () => {
    dispatch(clearUserProfile());
    localStorage.removeItem('token');

    navigate('/login');  
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12 text-center">
          {/* User profile info */}
          {profile ? (
            <div>
              <img
                src={profile.avatar}
                alt="User Avatar"
                className="rounded-circle"
                width="80"
                height="80"
              />
              <h3>{profile.name}</h3>
              <button onClick={handleLogout} className="btn btn-danger">
            Logout
          </button>
            </div>
          ) : (
            <p>Loading profile...</p> // Handle loading state
          )}
        </div>
      </div>

      <Tabs
        id="book-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-3"
      >
        <Tab eventKey="currentlyReading" title="Currently Reading">
          <div className="mt-3">
            {currentlyReading.length > 0 ? (
              <ul className="list-group">
                {currentlyReading.map((book) => (
                  <li key={book._id} className="list-group-item">
                    {book.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No books in this category.</p>
            )}
          </div>
        </Tab>
        <Tab eventKey="wantToRead" title="Want to Read">
          <div className="mt-3">
            {wantToRead.length > 0 ? (
              <ul className="list-group">
                {wantToRead.map((book) => (
                  <li key={book._id} className="list-group-item">
                    {book.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No books in this category.</p>
            )}
          </div>
        </Tab>
        <Tab eventKey="finishedReading" title="Finished Reading">
          <div className="mt-3">
            {finishedReading.length > 0 ? (
              <ul className="list-group">
                {finishedReading.map((book) => (
                  <li key={book._id} className="list-group-item">
                    {book.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No books in this category.</p>
            )}
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default Dashboard;
