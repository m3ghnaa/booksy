import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Tab, Tabs } from 'react-bootstrap';
import { setUserProfile, clearUserProfile } from '../redux/userSlice'; 
import { useNavigate } from 'react-router-dom'; 
import SearchBar from '../components/SearchBar';
import BookResults from '../components/BookResults';
import { setSearchResults, clearSearchResults } from '../redux/searchSlice';
import { addToReadingList } from '../redux/bookSlice';
import axios from 'axios';

const Dashboard = () => {
  const [key, setKey] = useState('currentlyReading');
  const dispatch = useDispatch();
  const navigate = useNavigate(); 
  
  // Use books from search state
  const { books, loading, error } = useSelector((state) => state.search);
  
  // Redux state for user profile and books
  const { profile } = useSelector((state) => state.user);
  const { currentlyReading, wantToRead, finishedReading } = useSelector((state) => state.books);

  // Clear search results when component mounts
  useEffect(() => {
    dispatch(clearSearchResults());
  }, [dispatch]);

  // Fetch user profile when the component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          dispatch(setUserProfile(decodedToken));
        } else {
          console.log("No token found");
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [dispatch]); 

  const handleAddBook = (book, category) => {
    // Dispatch to Redux
    dispatch(addToReadingList({ book, category }));

    // Save book to database via API call
    const token = localStorage.getItem('token');
    console.log('Token:', token);
    axios.post('http://localhost:5000/api/books', {
      category,
      googleBookId: book.id,
      title: book.volumeInfo.title,
      authors: book.volumeInfo.authors,
      thumbnail: book.volumeInfo.imageLinks?.thumbnail,
      pageCount: book.volumeInfo.pageCount,
    },{
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => {
      console.log('Book added successfully');
    })
    .catch((error) => {
      console.error('Error adding book:', error);
    });
  };
  
  const handleLogout = () => {
    dispatch(clearUserProfile());
    localStorage.removeItem('token');
    navigate('/login');  
  };

  const handleSearchResults = (books) => {
    // Direct dispatch of the books array to Redux
    console.log(`Dispatching ${books.length} search results to Redux`);
    dispatch(setSearchResults(books));
  };

  return (
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
              <button onClick={handleLogout} className="btn btn-danger mt-2">
                Logout
              </button>
            </div>
          ) : (
            <p>Loading profile...</p>
          )}
        </div>
      </div>

      <div className="row mt-2">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Search Books</h5>
            </div>
            <div className="card-body">
              <SearchBar onSearchResults={handleSearchResults} />
              
              {loading && (
                <div className="text-center my-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="alert alert-danger mt-3" role="alert">
                  Error: {error}
                </div>
              )}
              
              {/* Debug info */}
              <div className="small text-muted mt-2">
                Search results: {Array.isArray(books) ? books.length : 0} books
              </div>
              
              {/* Pass books from Redux state */}
              <BookResults 
                books={books || []} 
                onAddBook={handleAddBook}
              />
            </div>
          </div>
        </div>
      </div>

      <Tabs
        id="book-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-3 mt-4"
      >
        <Tab eventKey="currentlyReading" title="Currently Reading">
          <div className="mt-3">
            {currentlyReading.length > 0 ? (
              <ul className="list-group">
                {currentlyReading.map((book, index) => (
                  <li key={book._id || book.googleBookId || index} className="list-group-item">
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
                {wantToRead.map((book, index) => (
                  <li key={book._id || book.googleBookId || index} className="list-group-item">
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
                {finishedReading.map((book, index) => (
                  <li key={book._id || book.googleBookId || index} className="list-group-item">
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