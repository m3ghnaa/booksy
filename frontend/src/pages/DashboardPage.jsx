import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log("No token found. Redirecting to login...");
      return navigate('/login');
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/auth/protected-route", {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          console.error('Unauthorized. Redirecting to login.');
          localStorage.removeItem('token');
          navigate('/login');
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        navigate('/login');
      }
    };

    fetchUserData();
  }, [navigate]);

  if (!userData) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome to your Dashboard</h1>
      <p>{userData.user?.name || 'User'}</p>
    </div>
  );
};

export default Dashboard;
