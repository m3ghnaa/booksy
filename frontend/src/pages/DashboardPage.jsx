import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { clearSearchResults } from '../redux/searchSlice';
import { setBooks, setProgressUpdated, setUserStats } from '../redux/bookSlice';
import { logout, updateUser } from '../redux/authSlice';
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

// Get a daily quote based on the current date
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
  const [readingActivity, setReadingActivity] = useState([]);
  const [dailyQuote, setDailyQuote] = useState(getDailyQuote());

  const { isAuthenticated, user, books, stats } = useSelector((state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    user: state.auth.user,
    books: state.books,
    stats: state.books.stats,
  }));

  const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://booksy-17xg.onrender.com';

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch user data
      const shouldFetchUser = !user || books.progressUpdated;
      if (shouldFetchUser) {
        const resUser = await api.get('/users/me');
        console.log('User data fetched from /api/users/me:', resUser.data);
        if (resUser.data.success && resUser.data.user) {
          dispatch(updateUser(resUser.data.user));
        } else {
          throw new Error('Invalid user data response');
        }
      }

      const shouldFetchBooks = !books.lastFetched || (Date.now() - books.lastFetched > 5 * 60 * 1000) || books.progressUpdated;
      if (shouldFetchBooks) {
        const resBooks = await api.get('/books');
        console.log('Books data fetched from /api/books:', resBooks.data);
        const { currentlyReading = [], wantToRead = [], finishedReading = [] } = resBooks.data;
        dispatch(setBooks({ currentlyReading, wantToRead, finishedReading }));
      }

      const shouldFetchStats = !stats.lastFetched || (Date.now() - stats.lastFetched > 5 * 60 * 1000) || books.progressUpdated;
      if (shouldFetchStats) {
        const resStats = await api.get('/users/stats');
        console.log('Stats data fetched from /api/users/stats:', resStats.data);
        const { maxReadingStreak = 0, currentStreak = 0, totalPagesRead = 0, completedBooks = 0 } = resStats.data;
        dispatch(setUserStats({ maxReadingStreak, currentStreak, totalPagesRead, totalBooksRead: completedBooks }));
      }

      const shouldFetchActivity = !readingActivity.length || books.progressUpdated;
      if (shouldFetchActivity) {
        const resActivity = await api.get('/users/reading-activity');
        console.log('Reading activity data fetched from /api/users/reading-activity:', resActivity.data);
        const activity = Array.isArray(resActivity.data?.readingActivity) ? resActivity.data.readingActivity : [];
        setReadingActivity(activity);
      }
    } catch (error) {
      console.error('Error fetching data in Dashboard:', error.message);
      toast.error('Failed to load your data');
      setReadingActivity([]);
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
    fetchData();
  }, [isAuthenticated, books.progressUpdated, dispatch, navigate]);

  useEffect(() => {
    const today = new Date().toDateString();
    if (localStorage.getItem('quoteDate') !== today) {
      setDailyQuote(getDailyQuote());
    }
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(setBooks({ currentlyReading: [], wantToRead: [], finishedReading: [] }));
    dispatch(setUserStats({ maxReadingStreak: 0, currentStreak: 0, totalPagesRead: 0, totalBooksRead: 0 }));
    setReadingActivity([]);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/login');
    toast.info('You have logged out.');
  };

  const handleRefresh = () => {
    dispatch(setProgressUpdated(true));
    toast.info('Refreshing data...');
  };

  const chartData = useMemo(() => {
    const validActivity = (readingActivity || [])
      .filter(entry => entry?.date && typeof entry.pagesRead === 'number')
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      labels: validActivity.map(entry => new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Pages Read',
          data: validActivity.map(entry => entry.pagesRead || 0),
          fill: false,
          backgroundColor: 'rgba(0, 184, 148, 0.6)',
          borderColor: 'rgb(0, 184, 148)',
          tension: 0.1,
        },
      ],
    };
  }, [readingActivity]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { bottom: 10 } },
    plugins: {
      legend: { position: 'top', labels: { font: { size: window.innerWidth < 576 ? 10 : 12 } } },
      title: { display: true, text: 'Daily Reading Activity (Last 30 Days)', font: { size: window.innerWidth < 576 ? 14 : 16 } },
      tooltip: { callbacks: { label: context => `Pages Read: ${context.raw}` } },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Pages Read', font: { size: window.innerWidth < 576 ? 10 : 12 } },
        ticks: { font: { size: window.innerWidth < 576 ? 8 : 10 }, precision: 0 },
      },
      x: {
        ticks: { font: { size: window.innerWidth < 576 ? 8 : 10 }, autoSkip: true, maxTicksLimit: window.innerWidth < 576 ? 7 : 15 },
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
          .responsive-card {
            height: 120px;
            min-height: 100px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
          }
          .responsive-card h6 { font-size: 0.9rem; }
          .responsive-card p { font-size: 1rem; }
          .responsive-card h5 { font-size: 1.1rem; }
          .chart-container { height: 350px; width: 100%; position: relative; }
          .profile-avatar { width: 100px; height: 100px; object-fit: cover; }
          .profile-name { font-size: 1.8rem; }
          .profile-info { font-size: 1rem; }

          @media (max-width: 576px) {
            .responsive-card { height: 100px !important; min-height: 100px !important; padding: 10px !important; }
            .responsive-card h6 { font-size: 0.8rem !important; }
            .responsive-card p { font-size: 0.85rem !important; margin-bottom: 0 !important; }
            .responsive-card h5 { font-size: 1rem !important; margin-top: 5px !important; }
            .chart-container { height: 250px !important; }
            .profile-avatar { width: 60px !important; height: 60px !important; }
            .profile-name { font-size: 1.2rem !important; }
            .profile-info { font-size: 0.85rem !important; margin-bottom: 2px !important; }
            .responsive-card .position-absolute { top: -15px !important; width: 30px !important; height: 30px !important; }
            .responsive-card .position-absolute .text-muted,
            .responsive-card .position-absolute .text-primary,
            .responsive-card .position-absolute .text-success,
            .responsive-card .position-absolute .text-danger { font-size: 1.2rem !important; }
            .responsive-card .position-absolute span { font-size: 1.5rem !important; }
            .card.p-3 { padding: 10px !important; }
          }
          @media (min-width: 576px) and (max-width: 768px) {
            .responsive-card { height: 110px !important; min-height: 110px !important; padding: 15px !important; }
            .responsive-card h6 { font-size: 0.85rem !important; }
            .responsive-card p { font-size: 0.9rem !important; margin-bottom: 2px !important; }
            .responsive-card h5 { font-size: 1.05rem !important; margin-top: 8px !important; }
            .chart-container { height: 300px !important; }
            .profile-avatar { width: 80px !important; height: 80px !important; }
            .profile-name { font-size: 1.5rem !important; }
            .profile-info { font-size: 0.9rem !important; margin-bottom: 3px !important; }
            .responsive-card .position-absolute { top: -18px !important; width: 36px !important; height: 36px !important; }
            .responsive-card .position-absolute .text-muted,
            .responsive-card .position-absolute .text-primary,
            .responsive-card .position-absolute .text-success,
            .responsive-card .position-absolute .text-danger { font-size: 1.4rem !important; }
            .responsive-card .position-absolute span { font-size: 1.8rem !important; }
            .card.p-3 { padding: 15px !important; }
          }
          @media (min-width: 769px) {
            .responsive-card { padding: 20px !important; }
            .responsive-card .position-absolute { top: -20px; width: 40px; height: 40px; }
            .responsive-card .position-absolute .text-muted,
            .responsive-card .position-absolute .text-primary,
            .responsive-card .position-absolute .text-success,
            .responsive-card .position-absolute .text-danger { font-size: 1.6rem; }
            .responsive-card .position-absolute span { font-size: 2rem; }
            .card.p-3 { padding: 20px; }
          }
        `}
      </style>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="container d-flex flex-column min-vh-100 mt-5 pt-5">
        {loading ? (
          <div className="col-12 text-center my-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Profile Info Section */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card p-3 shadow-sm d-flex flex-row align-items-center">
                  <div className="me-3">
                    <FaUserCircle className="text-muted profile-avatar" />
                  </div>
                  <div className="flex-grow-1">
                    <h4 className="profile-name mb-1">{user?.name || 'User'}</h4>
                    <p className="text-muted profile-info mb-1">Member since {joinDate}</p>
                    <p className="text-muted profile-info mb-1">
                      Favorite Genre: {user?.favoriteGenre !== undefined && user?.favoriteGenre !== '' ? user.favoriteGenre : 'Not set'}
                    </p>
                    <p className="text-muted profile-info mb-0">
                      Reading Goal: {user?.readingGoal !== undefined && user.readingGoal > 0 ? `${user.readingGoal} books this year` : 'Not set'}
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
                  <h5 className="text-muted text-center pt-1">{stats.currentStreak || 0} {stats.currentStreak === 1 ? 'day' : 'days'}</h5>
                </div>
              </div>
              <div className="col-12 col-sm-6 text-center">
                <div className="border border-muted p-2 p-md-3 position-relative shadow-sm responsive-card">
                  <div className="position-absolute start-50 translate-middle-x bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ zIndex: 10 }}>
                    <FaQuoteLeft className="text-muted" />
                  </div>
                  <p className="text-muted mb-1 text-center pt-3" style={{ fontStyle: 'italic' }}>"{dailyQuote.text}"</p>
                  <p className="text-muted text-center">— {dailyQuote.author}, <em>{dailyQuote.book}</em></p>
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
                  {chartData.labels.length > 0 ? (
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
                  <h5 className="text-muted text-center pt-1">{stats.totalBooksRead || 0}</h5>
                </div>
              </div>
              <div className="col-12 col-sm-4 text-center mb-3 mb-sm-0">
                <div className="border border-muted p-2 p-md-3 position-relative shadow-sm responsive-card">
                  <div className="position-absolute start-50 translate-middle-x bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ zIndex: 10 }}>
                    <FaFileAlt className="text-success" />
                  </div>
                  <h6 className="text-muted mb-1 text-center pt-3">Total Pages Read</h6>
                  <h5 className="text-muted text-center pt-1">{stats.totalPagesRead || 0}</h5>
                </div>
              </div>
              <div className="col-12 col-sm-4 text-center">
                <div className="border border-muted p-2 p-md-3 position-relative shadow-sm responsive-card">
                  <div className="position-absolute start-50 translate-middle-x bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ zIndex: 10 }}>
                    <FaFire className="text-danger" />
                  </div>
                  <h6 className="text-muted mb-1 text-center pt-3">Longest Streak</h6>
                  <h5 className="text-muted text-center pt-1">{stats.maxReadingStreak || 0} {stats.maxReadingStreak === 1 ? 'day' : 'days'}</h5>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Dashboard;