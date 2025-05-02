import React from 'react';
import BookCard from './BookCard';

const BookResults = ({ books, onAddBook }) => {
  if (!books || !Array.isArray(books) || books.length === 0) {
    return (
      <div className="mt-4 text-center">
        <p>No books found. Try another search term.</p>
      </div>
    );
  }

  return (
    <div className="row mt-4">
      {books.map((book, index) => (
        <BookCard
          key={book.id || index}
          book={book}
          onAddBook={onAddBook}
        />
      ))}
    </div>
  );
};

export default BookResults;