import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { clearSearchResults } from '../redux/searchSlice';
import { setBooks, setProgressUpdated, setUserStats, setReadingActivity } from '../redux/bookSlice';
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
    return JSON.parse(storedQuote);
  }

  const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const randomIndex = seed % bookQuotes.length;
  const selectedQuote = bookQuotes[randomIndex];

  localStorage.setItem('dailyQuote', JSON.stringify(selectedQuote));
  localStorage.setItem('quoteDate', today);
  return selectedQuote;
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [maxReadingStreak, setMaxReadingStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalPagesRead, setTotalPagesRead] = useState(0);
  const [totalBooksRead, setTotalBooksRead] = useState(0);
  const [readingActivity, setReadingActivity] = useState([]);
  const [dailyQuote, setDailyQuote] = useState(getDailyQuote());
  const [hasAvatarError, setHasAvatarError] = useState(false);

  const { isAuthenticated, user, books } = useSelector((state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    user: state.auth.user,
    books: state.books,
  }));
  
  // Get cached data from Redux store
  const cachedStats = useSelector((state) => state.books.stats);
  const cachedActivity = useSelector((state) => state.books.readingActivity);

  const fetchBooksAndStats = async () => {
    setLoading(true);
    try {
      // Check if we need to fetch books (if not fetched or older than 5 minutes)
      const shouldFetchBooks = !books.lastFetched || (Date.now() - books.lastFetched > 5 * 60 * 1000) || books.progressUpdated;
      
      if (shouldFetchBooks) {
        console.log('Fetching books from API...');
        const resBooks = await api.get('/books');
        const { currentlyReading = [], wantToRead = [], finishedReading = [] } = resBooks.data;
        dispatch(setBooks({ currentlyReading, wantToRead, finishedReading }));
      } else {
        console.log('Using cached books data...');
      }

      // Check if we need to fetch stats (if not fetched or older than 5 minutes)
      const shouldFetchStats = !cachedStats.lastFetched || (Date.now() - cachedStats.lastFetched > 5 * 60 * 1000) || books.progressUpdated;
      
      if (shouldFetchStats) {
        console.log('Fetching user stats from API...');
        const resStats = await api.get('/users/stats');
        const { maxReadingStreak = 0, currentStreak = 0, totalPagesRead = 0, completedBooks = 0 } = resStats.data;
        
        // Update Redux store
        dispatch(setUserStats({ maxReadingStreak, currentStreak, totalPagesRead, totalBooksRead: completedBooks }));
        
        // Update local state
        setMaxReadingStreak(maxReadingStreak);
        setCurrentStreak(currentStreak);
        setTotalPagesRead(totalPagesRead);
        setTotalBooksRead(completedBooks);
      } else {
        console.log('Using cached stats data...');
        // Use cached data from Redux
        setMaxReadingStreak(cachedStats.maxReadingStreak);
        setCurrentStreak(cachedStats.currentStreak);
        setTotalPagesRead(cachedStats.totalPagesRead);
        setTotalBooksRead(cachedStats.totalBooksRead);
      }

      // Check if we need to fetch reading activity (if not fetched or older than 5 minutes)
      const shouldFetchActivity = !cachedActivity.lastFetched || (Date.now() - cachedActivity.lastFetched > 5 * 60 * 1000) || books.progressUpdated;
      
      if (shouldFetchActivity) {
        console.log('Fetching reading activity from API...');
        const resActivity = await api.get('/users/reading-activity');
        const { readingActivity = [] } = resActivity.data;
        
        // Update Redux store
        dispatch(setReadingActivity(readingActivity));
        
        // Update local state
        setReadingActivity(readingActivity);
      } else {
        console.log('Using cached reading activity data...');
        // Use cached data from Redux
        setReadingActivity(cachedActivity.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load your data');
    } finally {
      setLoading(false);
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

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchBooksAndStats();
    dispatch(setProgressUpdated(false));
  }, [dispatch, isAuthenticated, books.progressUpdated]);

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
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/login');
    toast.info('You have logged out.');
  };

  const handleRefresh = () => {
    fetchBooksAndStats();
    toast.info('Chart refreshed');
  };

  // Memoize chart data to prevent unnecessary recalculations
  const chartData = React.useMemo(() => ({
    labels: readingActivity.map((entry) => new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Pages Read',
        data: readingActivity.map((entry) => entry.pagesRead),
        fill: false,
        backgroundColor: 'rgba(0, 184, 148, 0.6)',
        borderColor: 'rgb(0, 184, 148)',
        tension: 0.1,
      },
    ],
  }), [readingActivity]);

  // Memoize chart options to prevent unnecessary recalculations
  const chartOptions = React.useMemo(() => ({
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
          @media (max-width: 576px) {
            .responsive-card {
              height: 100px !important;
              min-height: 100px !important;
            }
            .responsive-card h6 {
              font-size: 0.8rem !important;
            }
            .responsive-card p {
              font-size: 0.85rem !important;
            }
            .responsive-card h5 {
              font-size: 1rem !important;
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
            }
          }
          @media (min-width: 576px) and (max-width: 768px) {
            .responsive-card {
              height: 110px !important;
              min-height: 110px !important;
            }
            .responsive-card h6 {
              font-size: 0.85rem !important;
            }
            .responsive-card p {
              font-size: 0.9rem !important;
            }
            .responsive-card h5 {
              font-size: 1.05rem !important;
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
            }
          }
          @media (min-width: 769px) {
            .chart-container {
              height: 350px !important;
            }
            .profile-avatar {
              width: 100px !important;
              height: 100px !important;
            }
            .profile-name {
              font-size: 1.8rem !important;
            }
            .profile-info {
              font-size: 1rem !important;
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
      src={
        user.avatar.includes('localhost')
          ? `${process.env.REACT_APP_SERVER_URL || 'https://booksy-backend.onrender.com'}/uploads/${user.avatar.split('/uploads/')[1]}?t=${Date.now()}`
          : user.avatar.startsWith('http:') 
            ? user.avatar.replace('http:', 'https:')
            : user.avatar
      }
      alt="User Avatar"
      className="rounded-circle profile-avatar"
      style={{ width: '100px', height: '100px', objectFit: 'cover' }}
      onError={() => setHasAvatarError(true)}
    />
  ) : (
    <FaUserCircle className="text-muted profile-avatar" style={{ width: '100px', height: '100px' }} />
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


              <div className="row mt-1 mt-md-5">
                <div className="col-12 col-sm-6 text-center mb-3 mb-sm-0">
                  <div className="border border-muted p-2 p-md-3 position-relative shadow-sm responsive-card" style={{ height: '120px' }}>
                    <div className="position-absolute start-50 translate-middle-x bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', top: '-20px', zIndex: 10 }}>
                      <span style={{ fontSize: '2rem' }}>🔥</span>
                    </div>
                    <h6 className="text-muted mb-1 text-center pt-3" style={{ fontSize: '0.9rem' }}>Current Streak</h6>
                    <h5 className="text-muted text-center pt-1" style={{ fontSize: '1.1rem' }}>
                      {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                    </h5>
                  </div>
                </div>
                <div className="col-12 col-sm-6 text-center">
                  <div className="border border-muted p-2 p-md-3 position-relative shadow-sm responsive-card" style={{ height: '120px' }}>
                    <div className="position-absolute start-50 translate-middle-x bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', top: '-18px', zIndex: 10 }}>
                      <FaQuoteLeft className="text-muted" style={{ fontSize: '1.6rem' }} />
                    </div>
                    <p className="text-muted mb-1 text-center pt-3" style={{ fontSize: '1rem', fontStyle: 'italic' }}>
                      "{dailyQuote.text}"
                    </p>
                    <p className="text-muted text-center" style={{ fontSize: '0.9rem' }}>
                      — {dailyQuote.author}, <em>{dailyQuote.book}</em>
                    </p>
                  </div>
                </div>
              </div>

              <div className="row mt-3 mt-md-5 mb-4 mb-md-4">
                <div className="col-12">
                  <div className="card p-2 p-md-3 shadow-sm chart-container" style={{ height: '350px' }}>
                    <div className="d-flex justify-content-end mb-2">
                      <button className="btn btn-outline-primary btn-sm" onClick={handleRefresh}>
                        Refresh Chart
                      </button>
                    </div>
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </div>
              </div>

              <div className="row mt-1 mt-md-5">
                <div className="col-12 col-sm-4 text-center mb-3 mb-sm-0">
                  <div className="border border-muted p-2 p-md-3 position-relative shadow-sm responsive-card" style={{ minHeight: '100px' }}>
                    <div className="position-absolute start-50 translate-middle-x bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', top: '-18px', zIndex: 10 }}>
                      <FaBook className="text-primary" style={{ fontSize: '1.6rem' }} />
                    </div>
                    <h6 className="text-muted mb-1 text-center pt-3" style={{ fontSize: '0.9rem' }}>Total Books Read</h6>
                    <h5 className="text-muted text-center pt-1" style={{ fontSize: '1.1rem' }}>{totalBooksRead}</h5>
                  </div>
                </div>
                <div className="col-12 col-sm-4 text-center mb-3 mb-sm-0">
                  <div className="border border-muted p-2 p-md-3 position-relative shadow-sm responsive-card" style={{ minHeight: '100px' }}>
                    <div className="position-absolute start-50 translate-middle-x bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', top: '-18px', zIndex: 10 }}>
                      <FaFileAlt className="text-success" style={{ fontSize: '1.6rem' }} />
                    </div>
                    <h6 className="text-muted mb-1 text-center pt-3" style={{ fontSize: '0.9rem' }}>Total Pages Read</h6>
                    <h5 className="text-muted text-center pt-1" style={{ fontSize: '1.1rem' }}>{totalPagesRead}</h5>
                  </div>
                </div>
                <div className="col-12 col-sm-4 text-center">
                  <div className="border border-muted p-2 p-md-3 position-relative shadow-sm responsive-card" style={{ minHeight: '100px' }}>
                    <div className="position-absolute start-50 translate-middle-x bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', top: '-18px', zIndex: 10 }}>
                      <FaFire className="text-danger" style={{ fontSize: '1.6rem' }} />
                    </div>
                    <h6 className="text-muted mb-1 text-center pt-3" style={{ fontSize: '0.9rem' }}>Longest Streak</h6>
                    <h5 className="text-muted text-center pt-1" style={{ fontSize: '1.1rem' }}>
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