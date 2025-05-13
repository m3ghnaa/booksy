import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchResults } from '../redux/searchSlice';
import { addToReadingList, setBooks } from '../redux/bookSlice';
import { toast } from 'react-toastify';
import api from '../utils/axiosConfig';
import SearchBar from '../components/SearchBar';
import BookResults from '../components/BookResults';
import Navbar from '../components/Navbar';

const SearchPage = () => {
  const dispatch = useDispatch();
  const { books, loading, error } = useSelector((state) => state.search);
  const { currentlyReading, wantToRead, finishedReading } = useSelector((state) => state.books);
  const { profile } = useSelector((state) => state.user);

  const handleSearchResults = (books) => {
    dispatch(setSearchResults(books));
  };

  const handleAddBook = async (book, category) => {
    const existing = [...currentlyReading, ...wantToRead, ...finishedReading];
    const alreadyAdded = existing.find(b => b.googleBookId === book.id);
    
    // If book exists in a different category, we'll let the backend handle moving it
    if (alreadyAdded) {
      const existingCategory = alreadyAdded.category || 
        (currentlyReading.some(b => b.googleBookId === book.id) ? 'currentlyReading' :
         wantToRead.some(b => b.googleBookId === book.id) ? 'wantToRead' : 'finishedReading');
      
      if (existingCategory === category) {
        toast.warning(`This book is already in your ${category} list.`);
        return;
      } else {
        // We'll continue and let the backend handle moving the book between categories
        toast.info(`Moving book from ${existingCategory} to ${category}...`);
      }
    }

    const bookData = {
      googleBookId: book.id,
      title: book.volumeInfo.title,
      authors: book.volumeInfo.authors || ['Unknown Author'],
      thumbnail: book.volumeInfo.imageLinks?.thumbnail,
      pageCount: book.volumeInfo.pageCount,
      progress: 0,
    };

    dispatch(addToReadingList({ book: bookData, category }));

    const token = localStorage.getItem('token');
    try {
      const response = await api.post('/books', {
        category,
        ...bookData
      });

      // Check if book was added or moved
      if (response.status === 200) {
        toast.success(response.data.message || 'Book moved successfully!');
      } else {
        toast.success('Book added successfully!');
      }

      const res = await api.get('/books');

      const categorizedBooks = {
        currentlyReading: res.data.currentlyReading || [],
        wantToRead: res.data.wantToRead || [],
        finishedReading: res.data.finishedReading || [],
      };

      dispatch(setBooks(categorizedBooks));
    } catch (error) {
      console.error('Error adding book:', error);
      toast.error('Error adding book');
    }
  };

  return (
    <>
      <Navbar user={profile} />
      <div className="container mt-5 pt-5">
        <div className="card">
          <div className="card-header bg-secondary text-white">
            <h5 className="mb-0">Search Books</h5>
          </div>
          <div className="card-body">
            <SearchBar onSearchResults={handleSearchResults} />
            {loading && (
              <div className="text-center my-4">
                <div className="spinner-border text-primary" role="status" />
              </div>
            )}
            {error && (
              <div className="alert alert-danger mt-3" role="alert">
                Error: {error}
              </div>
            )}
            <BookResults
              books={books || []}
              onAddBook={handleAddBook}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchPage;
