import React, { useState } from 'react';
import axios from 'axios';

const SearchBar = ({ onSearchResults }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const fetchBooks = async (e) => {
    e.preventDefault(); // Prevent form submission default behavior
    
    if (!query.trim()) return; // Don't search if query is empty
    
    setLoading(true);
    try {
      // Clear previous results first
      onSearchResults([]);
      
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes`, {
          params: {
            q: query,
            maxResults: 20,
            _: timestamp // Add cache-busting parameter
          }
        }
      );
      
      const books = response.data.items || [];
      console.log(`Search results for "${query}":`, books.length);
      
      // Log the first book to verify different results
      if (books.length > 0) {
        console.log("First book:", books[0].volumeInfo.title);
      }
      
      onSearchResults(books);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={fetchBooks} className="d-flex">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search for books..."
        className="form-control me-2"
      />
      <button 
        type="submit" 
        className="btn btn-primary" 
        disabled={loading || !query.trim()}
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
};

export default SearchBar;