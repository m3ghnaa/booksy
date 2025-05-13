import React, { useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setBooks } from '../redux/bookSlice';
import { toast } from 'react-toastify';

const BookDebug = () => {
  const dispatch = useDispatch();
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found');
        setLoading(false);
        return;
      }

      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/books`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setApiResponse(res.data);
      
      // Update Redux store with fetched books
      const categorizedBooks = {
        currentlyReading: res.data.currentlyReading || [],
        wantToRead: res.data.wantToRead || [],
        finishedReading: res.data.finishedReading || [],
      };
      
      dispatch(setBooks(categorizedBooks));
      toast.success('Books loaded successfully');
    } catch (err) {
      console.error('Error fetching books:', err);
      setError(err.message || 'Error fetching books');
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mt-3">
      <div className="card-header bg-info text-white">
        <h5 className="mb-0">Book Debugging Tool</h5>
      </div>
      <div className="card-body">
        <button 
          className="btn btn-primary mb-3" 
          onClick={fetchBooks}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch Books Directly'}
        </button>
        
        {error && (
          <div className="alert alert-danger">{error}</div>
        )}
        
        {apiResponse && (
          <div>
            <h6>API Response:</h6>
            <pre className="bg-light p-3" style={{ maxHeight: '300px', overflow: 'auto' }}>
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookDebug;
