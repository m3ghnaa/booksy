import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { PacmanLoader } from 'react-spinners';
import { clearSearchResults } from '../redux/searchSlice';
import { setBooks, setProgressUpdated, setUserStats } from '../redux/bookSlice';
import { logoutUser, syncUserWithUserSlice } from '../redux/authSlice';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../components/Navbar';
import api from '../utils/axiosConfig';
import { FaBook, FaFileAlt, FaFire, FaQuoteLeft, FaUserCircle, FaUserAstronaut, FaUserNinja, FaUserSecret, FaUserTie } from 'react-icons/fa';

// Map of avatar names to icons
const avatarIcons = {
  FaUserCircle: FaUserCircle,
  FaUserAstronaut: FaUserAstronaut,
  FaUserNinja: FaUserNinja,
  FaUserSecret: FaUserSecret,
  FaUserTie: FaUserTie
};

// Avatar options with styles (same as SettingsPage.jsx)
const avatarOptions = [
  { icon: FaUserCircle, name: 'FaUserCircle', style: { color: '#008080', backgroundColor: '#e7f1ff', borderColor: '#008080' } }, 
  { icon: FaUserAstronaut, name: 'FaUserAstronaut', style: { color: '#ff5733', backgroundColor: '#ffe7e3', borderColor: '#ff5733' } },
  { icon: FaUserNinja, name: 'FaUserNinja', style: { color: '#28a745', backgroundColor: '#e6f4ea', borderColor: '#28a745' } },
  { icon: FaUserSecret, name: 'FaUserSecret', style: { color: '#6f42c1', backgroundColor: '#f3e8ff', borderColor: '#6f42c1' } },
  { icon: FaUserTie, name: 'FaUserTie', style: { color: '#dc3545', backgroundColor: '#f8e1e4', borderColor: '#dc3545' } }
];

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

  const { isAuthenticated, authUser, userProfile, books, stats } = useSelector((state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    authUser: state.auth.user,
    userProfile: state.user.profile,
    books: state.books,
    stats: state.books.stats,
  }));

  const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://booksy-17xg.onrender.com';

  const fetchData = async () => {
    setLoading(true);
    try {
      // Always fetch user data on page load to ensure latest data
      const resUser = await api.get('/users/me');
      console.log('User data fetched from /api/users/me:', resUser.data);
      if (resUser.data.success && resUser.data.user) {
        dispatch(syncUserWithUserSlice(resUser.data.user));
        console.log('Dispatched syncUserWithUserSlice with:', resUser.data.user);
      } else {
        throw new Error('Invalid user data response');
      }

      const shouldFetchBooks = !books.lastFetched || (Date.now() - books.lastFetched > 5 * 60 * 1000) || books.progressUpdated;
      if (shouldFetchBooks) {
        const resBooks = await api.get('/books');
        console.log('Books data fetched from /api/books:', resBooks.data);
        const { currentlyReading = [], wantToRead = [], finishedReading = [] } = resBooks.data;
        dispatch(setBooks({ currentlyReading, wantToRead, finishedReading }));
      }

      const shouldFetchStats = !stats.lastFetched || (Date.now() - books.lastFetched > 5 * 60 * 1000) || books.progressUpdated;
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
    dispatch(logoutUser());
    dispatch(setBooks({ currentlyReading: [], wantToRead: [], finishedReading: [] }));
    dispatch(setUserStats({ maxReadingStreak: 0, currentStreak: 0, totalPagesRead: 0, totalBooksRead: 0 }));
    setReadingActivity([]);
    navigate('/login');
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

  const joinDate = authUser?.createdAt
    ? new Date(authUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'May 2025';

  // Dynamically select the avatar icon and its style
  const selectedAvatar = avatarOptions.find(option => option.name === (authUser?.avatar || 'FaUserCircle')) || avatarOptions[0];
  const AvatarIcon = selectedAvatar.icon;
  const avatarStyle = selectedAvatar.style;

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
          .profile-avatar { width: 100px; height: 100px; }
          .profile-name { font-size: 1.8rem; }
          .profile-info { font-size: 1rem; }

          /* Avatar styling (same as SettingsPage.jsx) */
          .avatar-option {
            padding: 10px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            width: 100px;
            height: 100px;
            border: 1px solid;
          }
          .avatar-icon {
            font-size: 3rem; /* Adjusted for Dashboard size */
          }

          /* Custom teal class to override Bootstrap primary */
          .text-teal {
            color: #008080 !important;
          }
          .btn-outline-teal {
            color: #008080;
            border-color: #008080;
          }
          .btn-outline-teal:hover {
            color: #fff;
            background-color: #008080;
            border-color: #008080;
          }

          @media (max-width: 576px) {
            .responsive-card { 
              height: 100px !important; 
              min-height: 100px !important; 
              padding: 15px !important; /* Increased padding for breathing room */
            }
            .responsive-card h6 { font-size: 0.8rem !important; }
            .responsive-card p { font-size: 0.85rem !important; margin-bottom: 0 !important; }
            .responsive-card h5 { font-size: 1rem !important; margin-top: 5px !important; }
            .chart-container { height: 250px !important; }
            .profile-avatar { width: 60px !important; height: 60px !important; }
            .profile-name { font-size: 1.2rem !important; }
            .profile-info { font-size: 0.85rem !important; margin-bottom: 2px !important; }
            .responsive-card .position-absolute { 
              top: -15px !important; 
              width: 30px !important; 
              height: 30px !important; /* Smaller badge size */
            }
            .responsive-card .position-absolute .text-muted,
            .responsive-card .position-absolute .text-teal,
            .responsive-card .position-absolute .text-success,
            .responsive-card .position-absolute .text-danger { 
              font-size: 1rem !important; /* Smaller icon size (24px) */
            }
            .responsive-card .position-absolute span { font-size: 1.2rem !important; }
            .card.p-3 { padding: 10px !important; }
            .avatar-option { width: 60px !important; height: 60px !important; }
            .avatar-icon { font-size: 2rem !important; }
            /* Summary stats section adjustments */
            .summary-stats .col-12 { 
              margin-bottom: 20px !important; /* Increased margin between stacked cards */
            }
            .summary-stats .col-12:last-child { 
              margin-bottom: 0 !important; /* No extra margin for the last card */
            }
          }
          @media (min-width: 576px) and (max-width: 768px) {
            .responsive-card { 
              height: 110px !important; 
              min-height: 110px !important; 
              padding: 18px !important; /* Slightly more padding */
            }
            .responsive-card h6 { font-size: 0.85rem !important; }
            .responsive-card p { font-size: 0.9rem !important; margin-bottom: 2px !important; }
            .responsive-card h5 { font-size: 1.05rem !important; margin-top: 8px !important; }
            .chart-container { height: 300px !important; }
            .profile-avatar { width: 80px !important; height: 80px !important; }
            .profile-name { font-size: 1.5rem !important; }
            .profile-info { font-size: 0.9rem !important; margin-bottom: 3px !important; }
            .responsive-card .position-absolute { 
              top: -18px !important; 
              width: 36px !important; 
              height: 36px !important; /* Slightly smaller badge */
            }
            .responsive-card .position-absolute .text-muted,
            .responsive-card .position-absolute .text-success,
            .responsive-card .position-absolute .text-danger { 
              font-size: 1.2rem !important; /* Icon size 28px */
            }
            .responsive-card .position-absolute span { font-size: 1.5rem !important; }
            .card.p-3 { padding: 15px !important; }
            .avatar-option { width: 80px !important; height: 80px !important; }
            .avatar-icon { font-size: 2.5rem !important; }
            /* Summary stats section adjustments */
            .summary-stats .col-12 { 
              margin-bottom: 15px !important; /* Margin between stacked cards */
            }
            .summary-stats .col-12:last-child { 
              margin-bottom: 0 !important; 
            }
          }
          @media (min-width: 769px) {
            .responsive-card { padding: 20px !important; }
            .responsive-card .position-absolute { top: -20px; width: 40px; height: 40px; }
            .responsive-card .position-absolute .text-muted,
            .responsive-card .position-absolute .text-teal,
            .responsive-card .position-absolute .text-primary, /* Added to ensure FaBook icon size consistency */
            .responsive-card .position-absolute .text-success,
            .responsive-card .position-absolute .text-danger { font-size: 1.4rem; /* Icon size 32px */ }
            .responsive-card .position-absolute span { font-size: 2rem; }
            .card.p-3 { padding: 20px; }
            /* Summary stats section adjustments */
            .summary-stats .col-12 { 
              margin-bottom: 0 !important; /* No extra margin needed for side-by-side layout */
            }
            /* Profile avatar adjustments for large screens */
            .profile-avatar { width: 120px !important; height: 120px !important; }
            .avatar-option { width: 120px !important; height: 120px !important; }
            .avatar-icon { font-size: 3.5rem !important; }
          }
        `}
      </style>
      <Navbar user={authUser} onLogout={handleLogout} />
      <div className="container d-flex flex-column min-vh-100 mt-5 pt-5">
        {loading ? (
          <div className="d-flex flex-column justify-content-center align-items-center min-vh-100">
            <PacmanLoader
              color="#008080" 
              size={40}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
            <p className="mt-3 text-muted text-center">
              Loading your dashboard data... Please wait.
            </p>
          </div>
        ) : (
          <>
            {/* Profile Info Section */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card p-3 shadow-sm d-flex flex-row align-items-center">
                  <div className="me-3">
                    <div
                      className="avatar-option profile-avatar"
                      style={{
                        color: avatarStyle.color,
                        backgroundColor: avatarStyle.backgroundColor,
                        borderColor: avatarStyle.borderColor,
                        border: `1px solid ${avatarStyle.borderColor}`
                      }}
                    >
                      <AvatarIcon className="avatar-icon" />
                    </div>
                  </div>
                  <div className="flex-grow-1">
                    <h4 className="profile-name mb-1">{authUser?.name || 'User'}</h4>
                    <p className="text-muted profile-info mb-1">Member since {joinDate}</p>
                    <p className="text-muted profile-info mb-1">
                      Favorite Genre: {userProfile?.favoriteGenre !== undefined && userProfile?.favoriteGenre !== '' ? userProfile.favoriteGenre : 'Not set'}
                    </p>
                    <p className="text-muted profile-info mb-0">
                      Reading Goal: {userProfile?.readingGoal !== undefined && userProfile.readingGoal > 0 ? `${userProfile.readingGoal} books this year` : 'Not set'}
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
                <div className="border border-muted p-2 pb-3 p-md-3 position-relative shadow-sm responsive-card">
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
                <div className="card p-2 p-md-3 shadow-sm chart-container mb-3 pt-3">
                  <div className="d-flex justify-content-end mb-2">
                    <button className="btn btn-outline-teal btn-sm" onClick={handleRefresh} disabled={loading}>
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
            <div className="row mt-1 mt-sm-3 mt-md-5 mb-3 summary-stats">
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
              <div className="col-12 col-sm-4 text-center mb-3 mb-sm-0">
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