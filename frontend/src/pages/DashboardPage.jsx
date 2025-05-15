import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { clearSearchResults } from '../redux/searchSlice';
import { setBooks, setProgressUpdated, setUserStats } from '../redux/bookSlice'; // Removed setReadingActivity
import { logout } from '../redux/authSlice';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../components/Navbar';
import api from '../utils/axiosConfig';
import { FaBook, FaFileAlt, FaFire, FaQuoteLeft, FaUserCircle } from 'react-icons/fa';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Static array of book quotes
const bookQuotes = [
  { text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.", book: "Pride and Prejudice", author: "Jane Austen" },
  { text: "All happy families are alike; each unhappy family is unhappy in its own way.", book: "Anna Karenina", author: "Leo Tolstoy" },
  { text: "It was the best of times, it was the worst of times...", book: "A Tale of Two Cities", author: "Charles Dickens" },
  { text: "The only way out of the labyrinth of suffering is to forgive.", book: "Looking for Alaska", author: "John Green" },
  { text: "So it goes.", book: "Slaughterhouse-Five", author: "Kurt Vonnegut" },
  { text: "Not all those who wander are lost.", book: "The Lord of the Rings", author: "J.R.R. Tolkien" },
  { text: "We are all in the gutter, but some of us are looking at the stars.", book: "Lady Windermere's Fan", author: "Oscar Wilde" },
  { text: "There is no greater agony than bearing an untold story inside you.", book: "I Know Why the Caged Bird Sings", author: "Maya Angelou" },
  { text: "Do I dare disturb the universe?", book: "The Love Song of J. Alfred Prufrock", author: "T.S. Eliot" },
  { text: "Tomorrow is tomorrow. Future cares have future cures, And we must mind today.", book: "Antigone", author: "Sophocles" },
  { text: "The life so short, the craft so long to learn.", book: "The Parliament of Fowls", author: "Geoffrey Chaucer" },
  { text: "You never really understand a person until you consider things from his point of view.", book: "To Kill a Mockingbird", author: "Harper Lee" },
  { text: "In the beginning the Universe was created. This has made a lot of people very angry and been widely regarded as a bad move.", book: "The Hitchhiker's Guide to the Galaxy", author: "Douglas Adams" },
  { text: "It does not do to dwell on dreams and forget to live.", book: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling" },
  { text: "The truth is rarely pure and never simple.", book: "The Importance of Being Earnest", author: "Oscar Wilde" },
  { text: "I am no bird; and no net ensnares me: I am a free human being with an independent will.", book: "Jane Eyre", author: "Charlotte Brontë" },
  { text: "The world breaks everyone, and afterward, some are strong at the broken places.", book: "A Farewell to Arms", author: "Ernest Hemingway" },
  { text: "One cannot think well, love well, sleep well, if one has not dined well.", book: "A Room of One's Own", author: "Virginia Woolf" },
  { text: "Many lack originality to lack originality.", book: "Amusing Ourselves to Death", author: "Neil Postman" },
  { text: "Until I feared I would lose it, I never loved to read. One does not love breathing.", book: "Scout, Atticus & Boo", author: "Mary McDonough Murphy" }
];

const getDailyQuote = () => {
  const today = new Date().toDateString();
  const storedQuote = localStorage.getItem('dailyQuote');
  const storedDate = localStorage.getItem('quoteDate');

  if (storedQuote && storedDate === today) {
    try {
      return JSON.parse(storedQuote);
    } catch (e) {
      console.error("Failed to parse stored quote:", e);
      // Fallback to recalculating if stored quote is invalid
    }
  }

  const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const randomIndex = seed % bookQuotes.length;
  const selectedQuote = bookQuotes[randomIndex];

  localStorage.setItem('dailyQuote', JSON.stringify(selectedQuote));
  localStorage.setItem('quoteDate', today);
  return selectedQuote;
};

// Utility function to sanitize data for local component state
// Less strict than Redux sanitization as it's not going into the store,
// but still good practice to ensure expected format for the chart.
const sanitizeReadingActivityForLocalState = (activity) => {
  console.log('Sanitizing reading activity for local state...');
  if (!Array.isArray(activity)) {
    console.error('Invalid activity data: Input is not an array', activity);
    return [];
  }

  const sanitized = [];
  try {
    for (const entry of activity) {
       if (entry && typeof entry === 'object') {
         sanitized.push({
           date: typeof entry.date === 'string' ? entry.date : String(new Date().toISOString()),
           pagesRead: typeof entry.pagesRead === 'number' ? entry.pagesRead : 0
         });
       } else {
         console.warn('Sanitize skipped invalid entry for local state:', entry);
       }
    }
    console.log('Sanitized reading activity array for local state (length:', sanitized.length, '), first 5 entries:', JSON.stringify(sanitized.slice(0, 5)));
    return sanitized;
  } catch (error) {
    console.error('Error during reading activity sanitization for local state:', error);
    return [];
  }
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  // Use state derived from Redux cache initially for stats
  const cachedStats = useSelector((state) => state.books.stats);

  const [maxReadingStreak, setMaxReadingStreak] = useState(cachedStats?.maxReadingStreak || 0);
  const [currentStreak, setCurrentStreak] = useState(cachedStats?.currentStreak || 0);
  const [totalPagesRead, setTotalPagesRead] = useState(cachedStats?.totalPagesRead || 0);
  const [totalBooksRead, setTotalBooksRead] = useState(cachedStats?.totalBooksRead || 0);
  // Manage readingActivity in local state
  const [readingActivity, setReadingActivity] = useState([]);
  // State to manage caching for local reading activity
  const [localActivityCache, setLocalActivityCache] = useState({ data: [], lastFetched: null });


  const [dailyQuote, setDailyQuote] = useState(getDailyQuote());
  const [hasAvatarError, setHasAvatarError] = useState(false);

  const { isAuthenticated, user, books } = useSelector((state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    user: state.auth.user,
    books: state.books, // Still need this for lastFetched/progressUpdated checks
  }));

  // Production backend URL
  const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://booksy-17xg.onrender.com';

  // Construct full avatar URL
  const formatAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('/uploads/')) {
      return `${API_URL}${avatarPath}`;
    }
    if (avatarPath.includes('localhost')) {
      try {
        const filename = avatarPath.split('/uploads/')[1];
        return `${API_URL}/uploads/${filename}`;
      } catch (e) {
        console.error("Failed to parse localhost avatar path:", avatarPath, e);
        return null;
      }
    }
    return avatarPath;
  };

  const fetchData = async () => { // Renamed from fetchBooksAndStats
    setLoading(true);
    try {
      // Fetch books - only if cache is old or progress updated
      const shouldFetchBooks = !books.lastFetched || (Date.now() - books.lastFetched > 5 * 60 * 1000) || books.progressUpdated;
      if (shouldFetchBooks) {
        console.log('Dashboard: Fetching books from API...');
        const resBooks = await api.get('/books');
        const { currentlyReading = [], wantToRead = [], finishedReading = [] } = resBooks.data;
        console.log('Dashboard: Books API response received.');
        dispatch(setBooks({ currentlyReading, wantToRead, finishedReading }));
      } else {
        console.log('Dashboard: Using cached books data...');
      }

      // Fetch user stats - only if cache is old or progress updated
      const shouldFetchStats = !cachedStats.lastFetched || (Date.now() - cachedStats.lastFetched > 5 * 60 * 1000) || books.progressUpdated;
      if (shouldFetchStats) {
        console.log('Dashboard: Fetching user stats from API...');
        const resStats = await api.get('/users/stats');
        const { maxReadingStreak = 0, currentStreak = 0, totalPagesRead = 0, completedBooks = 0 } = resStats.data;
        console.log('Dashboard: Stats API response received.');

        const statsPayload = {
          maxReadingStreak,
          currentStreak,
          totalPagesRead,
          totalBooksRead: completedBooks,
        };
        console.log('Dashboard: Dispatching setUserStats with payload:', statsPayload);
        dispatch(setUserStats(statsPayload));

        setMaxReadingStreak(maxReadingStreak);
        setCurrentStreak(currentStreak);
        setTotalPagesRead(totalPagesRead);
        setTotalBooksRead(completedBooks);
      } else {
        console.log('Dashboard: Using cached stats data...');
        setMaxReadingStreak(cachedStats?.maxReadingStreak || 0);
        setCurrentStreak(cachedStats?.currentStreak || 0);
        setTotalPagesRead(cachedStats?.totalPagesRead || 0);
        setTotalBooksRead(cachedStats?.totalBooksRead || 0);
      }

      // Fetch reading activity - manage locally
      // Check local cache for reading activity
      const shouldFetchActivity = !localActivityCache.lastFetched || (Date.now() - localActivityCache.lastFetched > 5 * 60 * 1000) || books.progressUpdated;
      if (shouldFetchActivity) {
        console.log('Dashboard: Fetching reading activity from API (for local state)...');
        const resActivity = await api.get('/users/reading-activity');
        const rawReadingActivity = resActivity.data?.readingActivity || [];
        console.log('Dashboard: Reading Activity API response received (for local state).');

        const sanitizedActivity = sanitizeReadingActivityForLocalState(rawReadingActivity);

        // Update local state and local cache
        setReadingActivity(sanitizedActivity);
        setLocalActivityCache({ data: sanitizedActivity, lastFetched: Date.now() });

      } else {
        console.log('Dashboard: Using cached reading activity data from local state...');
        // Use data from local cache
        setReadingActivity(localActivityCache.data);
      }


    } catch (error) {
      console.error('Dashboard: Error fetching data:', error);
      toast.error('Failed to load your data');
      // Set state to default/empty on error
      setMaxReadingStreak(cachedStats?.maxReadingStreak || 0);
      setCurrentStreak(cachedStats?.currentStreak || 0);
      setTotalPagesRead(cachedStats?.totalPagesRead || 0);
      setTotalBooksRead(cachedStats?.totalBooksRead || 0);
      // On error, fall back to cached local activity data if available
      setReadingActivity(Array.isArray(localActivityCache?.data) ? localActivityCache.data : []);
    } finally {
      setLoading(false);
      dispatch(setProgressUpdated(false));
    }
  };

  useEffect(() => {
    dispatch(clearSearchResults());
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Fetch data on mount or when isAuthenticated/progressUpdated changes
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchData();
  }, [dispatch, isAuthenticated, books.progressUpdated]); // Depend on progressUpdated state

  useEffect(() => {
    const today = new Date().toDateString();
    if (localStorage.getItem('quoteDate') !== today) {
      setDailyQuote(getDailyQuote());
    }
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(setBooks({
      currentlyReading: [],
      wantToRead: [],
      finishedReading: []
    }));
    dispatch(setUserStats({
      maxReadingStreak: 0,
      currentStreak: 0,
      totalPagesRead: 0,
      totalBooksRead: 0,
    }));
    // Clear local reading activity state and cache on logout
    setReadingActivity([]);
    setLocalActivityCache({ data: [], lastFetched: null });

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/login');
    toast.info('You have logged out.');
  };

  const handleRefresh = () => {
    // Force refetch by setting progressUpdated to true temporarily
    dispatch(setProgressUpdated(true));
    toast.info('Refreshing data...');
  };

  // Memoize chart data based on local readingActivity state
  const chartData = useMemo(() => {
    const activityArray = Array.isArray(readingActivity) ? readingActivity : [];
    const validActivity = activityArray.filter(entry =>
        entry && typeof entry === 'object' && typeof entry.date === 'string' && typeof entry.pagesRead === 'number'
    );

    validActivity.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      labels: validActivity.map((entry) => {
        try {
           return new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch (e) {
            console.error("Error formatting date for chart:", entry.date, e);
            return 'Invalid Date';
        }
      }),
      datasets: [
        {
          label: 'Pages Read',
          data: validActivity.map((entry) => entry.pagesRead || 0),
          fill: false,
          backgroundColor: 'rgba(0, 184, 148, 0.6)',
          borderColor: 'rgb(0, 184, 148)',
          tension: 0.1,
        },
      ],
    };
  }, [readingActivity]); // Dependency is local state

   // Chart options remain the same, memoized
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 10,
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: window.innerWidth < 576 ? 10 : 12,
          },
        },
      },
      title: {
        display: true,
        text: 'Daily Reading Activity (Last 30 Days)',
        font: {
          size: window.innerWidth < 576 ? 14 : 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            return `Pages Read: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Pages Read',
          font: {
            size: window.innerWidth < 576 ? 10 : 12,
          },
        },
        ticks: {
          font: {
            size: window.innerWidth < 576 ? 8 : 10,
          },
          precision: 0
        },
      },
      x: {
        title: {
          display: true,
          font: {
            size: window.innerWidth < 576 ? 10 : 12,
          },
        },
        ticks: {
          font: {
            size: window.innerWidth < 576 ? 8 : 10,
          },
          autoSkip: true,
          maxTicksLimit: window.innerWidth < 576 ? 7 : 15
        },
      },
    },
  }), []);


  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'May 2025';

  return (
    <>
      <style>
        {`
          /* Added basic styles based on the provided CSS strings for clarity */
          .responsive-card {
              height: 120px; /* Default height */
              min-height: 100px; /* Minimum height */
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              text-align: center;
          }
          .responsive-card h6 {
            font-size: 0.9rem;
          }
          .responsive-card p {
            font-size: 1rem;
          }
           .responsive-card h5 {
              font-size: 1.1rem;
            }
          .chart-container {
              height: 350px; /* Default height */
              width: 100%; /* Ensure chart takes full width */
              position: relative; /* Needed for chart.js resize */
          }
           .profile-avatar {
              width: 100px;
              height: 100px;
              object-fit: cover;
          }
           .profile-name {
              font-size: 1.8rem;
           }
           .profile-info {
              font-size: 1rem;
           }


          @media (max-width: 576px) {
            .responsive-card {
              height: 100px !important;
              min-height: 100px !important;
              padding: 10px !important; /* Adjusted padding */
            }
            .responsive-card h6 {
              font-size: 0.8rem !important;
            }
            .responsive-card p {
              font-size: 0.85rem !important;
               margin-bottom: 0 !important; /* Reduce margin */
            }
            .responsive-card h5 {
              font-size: 1rem !important;
               margin-top: 5px !important; /* Adjust margin */
            }
            .chart-container {
              height: 250px !important;
            }
            .profile-avatar {
              width: 60px !important;
              height: 60px !important;
            }
            .profile-name {
              font-size: 1.2rem !important;
            }
            .profile-info {
              font-size: 0.85rem !important;
              margin-bottom: 2px !important; /* Adjust margin */
            }
             .responsive-card .position-absolute { /* Adjust icon position on small screens */
                 top: -15px !important;
                 width: 30px !important;
                 height: 30px !important;
             }
             .responsive-card .position-absolute .text-muted,
             .responsive-card .position-absolute .text-primary,
             .responsive-card .position-absolute .text-success,
             .responsive-card .position-absolute .text-danger {
                 font-size: 1.2rem !important; /* Adjust icon size */
             }
              .responsive-card .position-absolute span {
                   font-size: 1.5rem !important; /* Adjust fire icon size */
              }
              .card.p-3 { /* Adjust profile card padding */
                 padding: 10px !important;
              }
          }
          @media (min-width: 576px) and (max-width: 768px) {
            .responsive-card {
              height: 110px !important;
              min-height: 110px !important;
              padding: 15px !important; /* Adjusted padding */
            }
            .responsive-card h6 {
              font-size: 0.85rem !important;
            }
            .responsive-card p {
              font-size: 0.9rem !important;
               margin-bottom: 2px !important; /* Reduce margin */
            }
            .responsive-card h5 {
              font-size: 1.05rem !important;
               margin-top: 8px !important; /* Adjust margin */
            }
            .chart-container {
              height: 300px !important;
            }
            .profile-avatar {
              width: 80px !important;
              height: 80px !important;
            }
            .profile-name {
              font-size: 1.5rem !important;
            }
            .profile-info {
              font-size: 0.9rem !important;
               margin-bottom: 3px !important; /* Adjust margin */
            }
             .responsive-card .position-absolute { /* Adjust icon position on medium screens */
                 top: -18px !important;
                 width: 36px !important;
                 height: 36px !important;
             }
              .responsive-card .position-absolute .text-muted,
             .responsive-card .position-absolute .text-primary,
             .responsive-card .position-absolute .text-success,
             .responsive-card .position-absolute .text-danger {
                 font-size: 1.4rem !important; /* Adjust icon size */
             }
              .responsive-card .position-absolute span {
                   font-size: 1.8rem !important; /* Adjust fire icon size */
              }
             .card.p-3 { /* Adjust profile card padding */
                 padding: 15px !important;
              }
          }
           @media (min-width: 769px) {
             .responsive-card {
               padding: 20px !important; /* Adjusted padding */
             }
              .responsive-card .position-absolute { /* Default icon position */
                 top: -20px;
                 width: 40px;
                 height: 40px;
             }
             .responsive-card .position-absolute .text-muted,
             .responsive-card .position-absolute .text-primary,
             .responsive-card .position-absolute .text-success,
             .responsive-card .position-absolute .text-danger {
                 font-size: 1.6rem; /* Default icon size */
             }
              .responsive-card .position-absolute span {
                   font-size: 2rem; /* Default fire icon size */
              }
              .card.p-3 { /* Default profile card padding */
                 padding: 20px;
              }
           }
        `}
      </style>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="container d-flex flex-column min-vh-100 mt-5 pt-5">
        <div className="row align-items-center">
          {loading ? (
            <div className="col-12 text-center my-5">
              <div className="d-flex justify-content-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Profile Info Section */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card p-3 shadow-sm d-flex flex-row align-items-center">
                    <div className="me-3">
                      {user?.avatar && !hasAvatarError ? (
                        <img
                          src={formatAvatarUrl(user.avatar)}
                          alt="User Avatar"
                          className="rounded-circle profile-avatar"
                          onError={() => {
                             console.error("Failed to load avatar image:", formatAvatarUrl(user.avatar));
                             setHasAvatarError(true);
                           }}
                        />
                      ) : (
                        <FaUserCircle className="text-muted profile-avatar" />
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <h4 className="profile-name mb-1">{user?.name || 'User'}</h4>
                      <p className="text-muted profile-info mb-1">Member since {joinDate}</p>
                      <p className="text-muted profile-info mb-1">
                        Favorite Genre: {user?.favoriteGenre || 'Not set'}
                      </p>
                      <p className="text-muted profile-info mb-0">
                        Reading Goal: {user?.readingGoal || 'Not set'} books this year
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Streak and Quote Section */}
              <div className="row mt-1 mt-md-5">
                <div className="col-12 col-sm-6 text-center mb-3 mb-sm-0">
                  <div className="border border-muted p-2 p-md-3 position-relative shadow-sm responsive-card">
                    <div className="position-absolute start-50 translate-middle-x bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ zIndex: 10 }}>
                      <span>🔥</span>
                    </div>
                    <h6 className="text-muted mb-1 text-center pt-3">Current Streak</h6>
                    <h5 className="text-muted text-center pt-1">
                      {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                    </h5>
                  </div>
                </div>
                <div className="col-12 col-sm-6 text-center">
                  <div className="border border-muted p-2 p-md-3 position-relative shadow-sm responsive-card">
                    <div className="position-absolute start-50 translate-middle-x bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ zIndex: 10 }}>
                      <FaQuoteLeft className="text-muted" />
                    </div>
                    <p className="text-muted mb-1 text-center pt-3" style={{ fontStyle: 'italic' }}>
                      "{dailyQuote.text}"
                    </p>
                    <p className="text-muted text-center">
                      — {dailyQuote.author}, <em>{dailyQuote.book}</em>
                    </p>
                  </div>
                </div>
              </div>

              {/* Reading Activity Chart */}
              <div className="row mt-3 mt-md-5 mb-4 mb-md-4">
                <div className="col-12">
                  <div className="card p-2 p-md-3 shadow-sm chart-container">
                    <div className="d-flex justify-content-end mb-2">
                      <button className="btn btn-outline-primary btn-sm" onClick={handleRefresh} disabled={loading}>
                        {loading ? 'Refreshing...' : 'Refresh Chart'}
                      </button>
                    </div>
                    {!loading && chartData.labels.length > 0 ? (
                       <Line data={chartData} options={chartOptions} />
                    ) : (
                        <div className="d-flex align-items-center justify-content-center h-100">
                           <p className="text-muted">{loading ? 'Loading chart data...' : 'No reading activity data available for the last 30 days.'}</p>
                        </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary Stats Section */}
              <div className="row mt-1 mt-md-5">
                <div className="col-12 col-sm-4 text-center mb-3 mb-sm-0">
                  <div className="border border-muted p-2 p-md-3 position-relative shadow-sm responsive-card">
                    <div className="position-absolute start-50 translate-middle-x bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ zIndex: 10 }}>
                      <FaBook className="text-primary" />
                    </div>
                    <h6 className="text-muted mb-1 text-center pt-3">Total Books Read</h6>
                    <h5 className="text-muted text-center pt-1">{totalBooksRead}</h5>
                  </div>
                </div>
                <div className="col-12 col-sm-4 text-center mb-3 mb-sm-0">
                  <div className="border border-muted p-2 p-md-3 position-relative shadow-sm responsive-card">
                    <div className="position-absolute start-50 translate-middle-x bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ zIndex: 10 }}>
                      <FaFileAlt className="text-success" />
                    </div>
                    <h6 className="text-muted mb-1 text-center pt-3">Total Pages Read</h6>
                    <h5 className="text-muted text-center pt-1">{totalPagesRead}</h5>
                  </div>
                </div>
                <div className="col-12 col-sm-4 text-center">
                  <div className="border border-muted p-2 p-md-3 position-relative shadow-sm responsive-card">
                    <div className="position-absolute start-50 translate-middle-x bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ zIndex: 10 }}>
                      <FaFire className="text-danger" />
                    </div>
                    <h6 className="text-muted mb-1 text-center pt-3">Longest Streak</h6>
                    <h5 className="text-muted text-center pt-1">
                      {maxReadingStreak} {maxReadingStreak === 1 ? 'day' : 'days'}
                    </h5>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;