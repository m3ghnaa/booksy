import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../utils/axiosConfig';
import { toast } from 'react-toastify';
import { updateProgress, updateBookStatus, removeBook, setBooks, setProgressUpdated } from '../redux/bookSlice';

const BookCard = ({ book, onAddBook, category }) => {
  const dispatch = useDispatch();
  const [progress, setProgress] = useState(book.progress ? Math.round(book.progress) : 0);
  const [progressType, setProgressType] = useState(book.progressType || 'percentage');
  const [inputProgress, setInputProgress] = useState(
    book.pagesRead
      ? book.pagesRead
      : book.progress
      ? Math.round(book.progress)
      : ''
  );
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

  const handleInputProgressChange = (e) => {
    const value = e.target.value;
    // Allow empty string for deletion
    setInputProgress(value === '' ? '' : Number(value));
  };

  const handleConfirmProgress = async () => {
    const newProgressValue = inputProgress === '' ? 0 : Number(inputProgress);
    const previousProgress = progress;
    const previousProgressType = progressType;

    if (isInReadingList && !isSearchResult) {
      try {
        const bookId = book._id;
        if (!bookId) {
          throw new Error('Book ID is missing');
        }

        // Validate pageCount for page-based progress
        if (progressType === 'pages' && (!book.pageCount || book.pageCount === 'N/A')) {
          toast.error('Cannot update progress: Page count is missing');
          return;
        }

        // Validate input
        if (isNaN(newProgressValue) || newProgressValue < 0) {
          toast.error('Progress must be a non-negative number');
          return;
        }
        if (progressType === 'percentage' && newProgressValue > 100) {
          toast.error('Percentage must be between 0 and 100');
          return;
        }
        if (progressType === 'pages' && book.pageCount && newProgressValue > book.pageCount) {
          toast.error(`Pages read cannot exceed ${book.pageCount}`);
          return;
        }

        // Calculate progress and pagesRead based on progressType
        let newProgress, pagesRead;
        if (progressType === 'percentage') {
          newProgress = Math.round(newProgressValue); // Round to whole number for percentage
          pagesRead = book.pageCount ? Math.round((newProgressValue / 100) * book.pageCount) : 0;
        } else {
          pagesRead = newProgressValue;
          newProgress = book.pageCount ? Math.round((newProgressValue / book.pageCount) * 100) : 0;
        }

        setProgress(newProgress);
        setInputProgress(progressType === 'percentage' ? newProgress : pagesRead); // Sync input with rounded value

        // Update Redux store
        dispatch(updateProgress({
          bookId,
          category: status,
          progress: newProgress,
          pagesRead,
          progressType
        }));

        // Call the PATCH endpoint for progress
        await api.patch(`/books/${bookId}/progress`, {
          progress: progressType === 'percentage' ? newProgress : pagesRead,
          progressType
        });

        // If progress is 100% and book is in currentlyReading, move to finishedReading
        if (newProgress === 100 && status === 'currentlyReading') {
          try {
            setStatus('finishedReading');
            dispatch(updateBookStatus({
              bookId,
              oldCategory: 'currentlyReading',
              newCategory: 'finishedReading'
            }));

            // Call the PUT endpoint to update category
            await api.put(`/books/${bookId}`, {
              category: 'finishedReading'
            });

            toast.success('Book moved to Finished Reading');
          } catch (error) {
            toast.error('Failed to move book to Finished Reading');
            // Revert progress update if category change fails
            setProgress(previousProgress);
            setInputProgress(progressType === 'percentage' ? previousProgress : book.pagesRead);
            dispatch(updateProgress({
              bookId,
              category: status,
              progress: previousProgress,
              pagesRead: book.pageCount ? Math.round((previousProgress / 100) * book.pageCount) : 0,
              progressType: previousProgressType
            }));
            return;
          }
        }

        // Trigger chart refresh
        dispatch(setProgressUpdated(true));

        toast.success('Progress updated successfully');
      } catch (error) {
        toast.error('Failed to update progress. Please try again.');
        setProgress(previousProgress);
        setInputProgress(previousProgress);
        dispatch(updateProgress({
          bookId: book._id || book.googleBookId,
          category: status,
          progress: previousProgress,
          pagesRead: book.pageCount ? Math.round((previousProgress / 100) * book.pageCount) : 0,
          progressType: previousProgressType
        }));
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleConfirmProgress();
    }
  };

  const handleProgressTypeChange = (e) => {
    const newProgressType = e.target.value;
    setProgressType(newProgressType);

    // Convert current progress to the new type
    if (book.pageCount && book.pageCount !== 'N/A') {
      if (newProgressType === 'percentage') {
        // Convert pages to percentage
        const newProgress = Math.round((book.pagesRead / book.pageCount) * 100);
        setProgress(newProgress);
        setInputProgress(newProgress);
      } else {
        // Convert percentage to pages
        const newPages = Math.round((progress / 100) * book.pageCount);
        setProgress(newPages);
        setInputProgress(newPages);
      }
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);

    if (isInReadingList && !isSearchResult) {
      try {
        const bookId = book._id;
        if (!bookId) {
          toast.error('Book ID is missing');
          return;
        }

        dispatch(updateBookStatus({
          bookId,
          oldCategory: category,
          newCategory: newStatus
        }));

        await api.put(`/books/${bookId}`, {
          category: newStatus
        });

        toast.success('Book moved to ' + newStatus);
      } catch (error) {
        toast.error('Failed to update book status');
        try {
          const res = await api.get('/books');
          const categorizedBooks = {
            currentlyReading: res.data.currentlyReading || [],
            wantToRead: res.data.wantToRead || [],
            finishedReading: res.data.finishedReading || [],
          };
          dispatch(setBooks(categorizedBooks));
        } catch (refetchError) {
          toast.error('Failed to update book status');
        }
      }
    }
  };

  const handleRemoveBook = async () => {
    if (!isInReadingList || isSearchResult) return;

    try {
      const bookId = book._id;
      if (!bookId) {
        toast.error('Book ID is missing');
        return;
      }

      dispatch(removeBook({
        bookId,
        category
      }));

      await api.delete(`/books/${bookId}`);

      // Trigger chart refresh
      dispatch(setProgressUpdated(true));

      toast.success('Book removed from your shelf');
    } catch (error) {
      toast.error('Failed to remove book');
      try {
        const res = await api.get('/books');
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
                  <label htmlFor={`progress-type-${bookId}`}>Progress Type: </label>
                  <select
                    id={`progress-type-${bookId}`}
                    className="form-select form-select-sm mb-2"
                    value={progressType}
                    onChange={handleProgressTypeChange}
                    disabled={!book.pageCount || book.pageCount === 'N/A'}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="pages">Pages</option>
                  </select>

                  <label htmlFor={`progress-${bookId}`}>
                    {progressType === 'percentage' ? 'Progress (%):' : 'Pages Read:'}
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      id={`progress-${bookId}`}
                      min="0"
                      max={progressType === 'percentage' ? 100 : (book.pageCount || 100)}
                      step="1"
                      value={inputProgress}
                      onChange={handleInputProgressChange}
                      onKeyDown={handleKeyDown}
                      className="form-control"
                      disabled={!book.pageCount || book.pageCount === 'N/A'}
                    />
                    <button
                      className="btn"
                      type="button"
                      onClick={handleConfirmProgress}
                      disabled={!book.pageCount || book.pageCount === 'N/A'}
                      style={{ backgroundColor: "#008080", color: "white" }}
                    >
                      Confirm
                    </button>
                  </div>

                  {progressType === 'percentage' && (
                    <div className="progress mt-2">
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${progress}%` }}
                        aria-valuenow={progress}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        {Math.round(progress)}%
                      </div>
                    </div>
                  )}
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
                      className="btn btn-sm mb-1"
                      onClick={() => onAddBook(book, status)}
                      style={{ backgroundColor: "#008080", color: "white" }}
                    >
                      <i className="bi bi-book"></i> Add to Shelf
                    </button>
                  </>
                ) : (
                  <span className="text-success w-100 text-center">Book added to your shelf!</span>
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