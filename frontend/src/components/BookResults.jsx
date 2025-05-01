import React from 'react';

const BookResults = ({ books, onAddBook }) => {
  // Add debugging information
  console.log('BookResults rendering with books:', books);
  console.log('Books is array:', Array.isArray(books));
  console.log('Books length:', books.length);
  
  // If no books or books is not an array, show appropriate message
  if (!books || !Array.isArray(books) || books.length === 0) {
    return (
      <div className="mt-4 text-center">
        <p>No books found. Try another search term.</p>
      </div>
    );
  }

  return (
    <div className="row mt-4">
      {books.map((book, index) => {
        // Safely extract book information with fallbacks
        const title = book.volumeInfo?.title || 'Unknown Title';
        const thumbnail = book.volumeInfo?.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192?text=No+Cover';
        const authors = book.volumeInfo?.authors || ['Unknown Author'];
        const pageCount = book.volumeInfo?.pageCount || 'N/A';
        const description = book.volumeInfo?.description || 'No description available';

        return (
          <div key={book.id || index} className="col-md-4 mb-4">
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
                  </div>
                </div>
              </div>
              <div className="card-footer bg-white">
                <div className="d-flex justify-content-between flex-wrap">
                  <button
                    className="btn btn-outline-primary btn-sm mb-1"
                    onClick={() => onAddBook(book, 'currentlyReading')}
                  >
                    <i className="bi bi-book"></i> Reading
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm mb-1"
                    onClick={() => onAddBook(book, 'wantToRead')}
                  >
                    <i className="bi bi-bookmark"></i> Want to Read
                  </button>
                  <button
                    className="btn btn-outline-success btn-sm mb-1"
                    onClick={() => onAddBook(book, 'finishedReading')}
                  >
                    <i className="bi bi-check2-circle"></i> Finished
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BookResults;