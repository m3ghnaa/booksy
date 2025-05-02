import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { updateProgress, updateBookStatus, removeBook, setBooks } from '../redux/bookSlice';

const BookCard = ({ book, onAddBook, category }) => {
  const dispatch = useDispatch();
  const [progress, setProgress] = useState(book.progress || 0);
  const [status, setStatus] = useState(category || 'currentlyReading');
  
  const isSearchResult = book.id && book.volumeInfo;
  const { currentlyReading, wantToRead, finishedReading } = useSelector((state) => state.books);
  const allBooks = [...currentlyReading, ...wantToRead, ...finishedReading];
  
  const isInReadingList = isSearchResult 
    ? allBooks.some(b => b.googleBookId === book.id)
    : true;
  
  const title = isSearchResult 
    ? book.volumeInfo.title 
    : (book.title || 'Unknown Title');
    
  const thumbnail = isSearchResult
    ? book.volumeInfo.imageLinks?.thumbnail
    : (book.thumbnail || 'https://via.placeholder.com/128x192?text=No+Cover');
    
  const authors = isSearchResult
    ? book.volumeInfo.authors || ['Unknown Author']
    : (book.authors || ['Unknown Author']);
    
  const pageCount = isSearchResult
    ? book.volumeInfo.pageCount || 'N/A'
    : (book.pageCount || 'N/A');

  const bookId = isSearchResult ? book.id : book.googleBookId;
  
  const handleProgressChange = async (e) => {
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    
    if (isInReadingList && !isSearchResult) {
      try {
        dispatch(updateProgress({ 
          bookId: book._id || book.googleBookId, 
          category: status, 
          progress: newProgress 
        }));
        
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:5000/api/books/${book._id || book.googleBookId}`, 
          { progress: newProgress },
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        toast.success('Progress updated');
      } catch (error) {
        console.error('Error updating progress:', error);
        toast.error('Failed to update progress');
      }
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    
    if (isInReadingList && !isSearchResult) {
      try {
        dispatch(updateBookStatus({ 
          bookId: book._id || book.googleBookId, 
          oldCategory: category,
          newCategory: newStatus 
        }));
        
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:5000/api/books/${book._id || book.googleBookId}`, 
          { category: newStatus },
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        toast.success('Book moved to ' + newStatus);
      } catch (error) {
        console.error('Error updating book status:', error);
        toast.error('Failed to update book status');
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get('http://localhost:5000/api/books', {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          const categorizedBooks = {
            currentlyReading: res.data.currentlyReading || [],
            wantToRead: res.data.wantToRead || [],
            finishedReading: res.data.finishedReading || [],
          };
          
          dispatch(setBooks(categorizedBooks));
        } catch (refetchError) {
          console.error('Error refetching books:', refetchError);
        }
      }
    }
  };

  const handleRemoveBook = async () => {
    if (!isInReadingList || isSearchResult) return;
    
    try {
      dispatch(removeBook({ 
        bookId: book._id || book.googleBookId, 
        category 
      }));
      
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/books/${book._id || book.googleBookId}`, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      toast.success('Book removed from your shelf');
    } catch (error) {
      console.error('Error removing book:', error);
      toast.error('Failed to remove book');
      
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/books', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const categorizedBooks = {
          currentlyReading: res.data.currentlyReading || [],
          wantToRead: res.data.wantToRead || [],
          finishedReading: res.data.finishedReading || [],
        };
        
        dispatch(setBooks(categorizedBooks));
      } catch (refetchError) {
        console.error('Error refetching books:', refetchError);
      }
    }
  };

  return (
    <div className="col-md-4 mb-4">
      <div className="card h-100 shadow-sm">
        <div className="row g-0">
          <div className="col-md-4">
            <img
              src={thumbnail}
              className="img-fluid rounded-start h-100 object-fit-cover"
              alt={title}
              style={{ maxHeight: '200px' }}
            />
          </div>
          <div className="col-md-8">
            <div className="card-body">
              <h5 className="card-title">{title}</h5>
              <p className="card-text">
                <small className="text-muted">{authors.join(', ')}</small>
              </p>
              <p className="card-text">
                <small>Pages: {pageCount}</small>
              </p>

              {isInReadingList && !isSearchResult && category === "currentlyReading" && (
                <div className="mt-3">
                  <label htmlFor={`progress-${bookId}`}>Progress: </label>
                  <input
                    type="number"
                    id={`progress-${bookId}`}
                    min="0"
                    max="100"
                    step="1"
                    value={progress}
                    onChange={handleProgressChange}
                    className="form-control"
                  />
                  <div className="progress mt-2">
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${progress}%` }}
                      aria-valuenow={progress}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      {progress}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="card-footer bg-white">
          <div className="d-flex justify-content-between flex-wrap">
            {isSearchResult ? (
              <>
                {!isInReadingList ? (
                  <>
                    <select
                      className="form-select form-select-sm mb-1"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="currentlyReading">Currently Reading</option>
                      <option value="wantToRead">Want to Read</option>
                      <option value="finishedReading">Finished Reading</option>
                    </select>
                    <button
                      className="btn btn-outline-primary btn-sm mb-1"
                      onClick={() => onAddBook(book, status)}
                    >
                      <i className="bi bi-book"></i> Add to Shelf
                    </button>
                  </>
                ) : (
                  <span className="text-success w-100 text-center">Already in your reading list</span>
                )}
              </>
            ) : (
              <>
                <select
                  className="form-select form-select-sm mb-1"
                  value={status}
                  onChange={handleStatusChange}
                >
                  <option value="currentlyReading">Currently Reading</option>
                  <option value="wantToRead">Want to Read</option>
                  <option value="finishedReading">Finished Reading</option>
                </select>
                <button
                  className="btn btn-outline-danger btn-sm mb-1"
                  onClick={handleRemoveBook}
                >
                  <i className="bi bi-trash"></i> Remove
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookCard;