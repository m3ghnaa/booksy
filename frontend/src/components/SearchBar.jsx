import React, { useState } from 'react';
import axios from 'axios';

const SearchBar = ({ onSearchResults }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const fetchBooks = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      onSearchResults([]);
      
      const timestamp = new Date().getTime();
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes`, {
          params: {
            q: query,
            maxResults: 20,
            _: timestamp
          }
        }
      );
      
      const books = response.data.items || [];

      
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
        className="btn" 
        disabled={loading || !query.trim()}
        style={{ backgroundColor: "#008080", color: "white" }}
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
};

export default SearchBar;