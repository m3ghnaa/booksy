import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Tab, Tabs } from 'react-bootstrap';
import BookCard from '../components/BookCard';
import Navbar from '../components/Navbar';
import { logoutUser } from '../redux/authSlice';
import { setBooks } from '../redux/bookSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/axiosConfig';

const ShelfPage = () => {
  const [key, setKey] = useState('currentlyReading');
  const { currentlyReading, wantToRead, finishedReading } = useSelector((state) => state.books);
  const { profile } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Fetch books when component mounts
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await api.get('/books');

        const categorizedBooks = {
          currentlyReading: res.data.currentlyReading || [],
          wantToRead: res.data.wantToRead || [],
          finishedReading: res.data.finishedReading || [],
        };

        dispatch(setBooks(categorizedBooks));
      } catch (error) {
        console.error('Error fetching books:', error);
        toast.error('Error loading your books');
      }
    };

    fetchBooks();
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
    toast.info('You have logged out.');
  };

  return (
    <>
      <style>
        {`
          /* Style for the active tab */
          .nav-tabs .nav-link.active {
            background-color: #008080 !important; /* Teal background for active tab */
            color: #fff !important; /* White text for contrast */
            border-color: #008080 !important; /* Teal border to match background */
          }

          /* Optional: Style for inactive tabs to ensure they look distinct */
          .nav-tabs .nav-link {
            color: #008080; /* Teal text for inactive tabs */
          }

          .nav-tabs .nav-link:hover {
            color: #006666; /* Slightly darker teal on hover for inactive tabs */
            border-color: #006666;
          }

          /* Ensure the bottom border of the tab doesn't interfere */
          .nav-tabs {
            border-bottom: 1px solid #008080; /* Teal border for the tab bar */
          }
        `}
      </style>
      <Navbar user={profile} onLogout={handleLogout} />
      <div className="container mt-5 pt-5">
        <h4 className="text-center mb-5">{profile?.name ? `${profile.name}'s Shelf` : 'My Shelf'}</h4>
        <Tabs id="book-tabs" activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
          <Tab eventKey="currentlyReading" title="Currently Reading">
            <div className="row mt-3">
              {currentlyReading.length > 0 ? (
                currentlyReading.map((book, index) => (
                  <BookCard key={book._id || book.googleBookId || index} book={book} category="currentlyReading" />
                ))
              ) : (
                <p className="col-12 text-center">No books in this category.</p>
              )}
            </div>
          </Tab>
          <Tab eventKey="wantToRead" title="Want to Read">
            <div className="row mt-3">
              {wantToRead.length > 0 ? (
                wantToRead.map((book, index) => (
                  <BookCard key={book._id || book.googleBookId || index} book={book} category="wantToRead" />
                ))
              ) : (
                <p className="col-12 text-center">No books in this category.</p>
              )}
            </div>
          </Tab>
          <Tab eventKey="finishedReading" title="Finished Reading">
            <div className="row mt-3">
              {finishedReading.length > 0 ? (
                finishedReading.map((book, index) => (
                  <BookCard key={book._id || book.googleBookId || index} book={book} category="finishedReading" />
                ))
              ) : (
                <p className="col-12 text-center">No books in this category.</p>
              )}
            </div>
          </Tab>
        </Tabs>
      </div>
    </>
  );
};

export default ShelfPage;