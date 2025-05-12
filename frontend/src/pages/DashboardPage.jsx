import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { clearSearchResults } from '../redux/searchSlice';
import { setBooks, setProgressUpdated } from '../redux/bookSlice';
import { logout } from '../redux/authSlice';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../components/Navbar';
import api from '../utils/axiosConfig';
import { FaBook, FaFileAlt, FaFire, FaQuoteLeft } from 'react-icons/fa';

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

  // Deterministic random index based on date
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

  const { isAuthenticated, user, books } = useSelector((state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    user: state.auth.user,
    books: state.books,
  }));

  const fetchBooksAndStats = async () => {
    setLoading(true);
    try {
      const resBooks = await api.get('/books');
      const { currentlyReading = [], wantToRead = [], finishedReading = [] } = resBooks.data;
      dispatch(setBooks({ currentlyReading, wantToRead, finishedReading }));

      const resStats = await api.get('/users/stats');
      const { maxReadingStreak = 0, currentStreak = 0, totalPagesRead = 0, completedBooks = 0 } = resStats.data;

      const resActivity = await api.get('/users/reading-activity');
      const { readingActivity = [] } = resActivity.data;

      setMaxReadingStreak(maxReadingStreak);
      setCurrentStreak(currentStreak);
      setTotalPagesRead(totalPagesRead);
      setTotalBooksRead(completedBooks);
      setReadingActivity(readingActivity);
    } catch (error) {
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
    // Update quote daily
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

  // Chart data and options
  const chartData = {
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
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Daily Reading Activity (Last 30 Days)',
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
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
    },
  };

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="container d-flex flex-column min-vh-100">
        <div className="row align-items-center">
          {loading ? (
            <div className="col-12 text-center">
              <div className="d-flex justify-content-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="row mt-5">
                <div className="col-12 col-md-6 text-center">
                  <div className="border border-muted p-3 position-relative shadow-sm" style={{ height: '120px' }}>
                    <div className="position-absolute start-50 translate-middle-x bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', top: '-20px', zIndex: 10 }}>
                      <span style={{ fontSize: '2rem' }}>🔥</span>
                    </div>
                    <h6 className="text-muted mb-1 text-center" style={{ fontSize: '0.9rem' }}>Current Streak</h6>
                    <h5 className="text-muted text-center pt-3" style={{ fontSize: '1.1rem' }}>
                      {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                    </h5>
                  </div>
                </div>
                <div className="col-12 col-md-6 text-center">
                  <div className="border border-muted p-3 position-relative shadow-sm" style={{ height: '120px' }}>
                    <div className="position-absolute start-50 translate-middle-x bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', top: '-18px', zIndex: 10 }}>
                      <FaQuoteLeft className="text-muted" style={{ fontSize: '1.6rem' }} />
                    </div>
                    <p className="text-muted mb-1 text-center" style={{ fontSize: '1rem', fontStyle: 'italic' }}>
                      "{dailyQuote.text}"
                    </p>
                    <p className="text-muted text-center" style={{ fontSize: '0.9rem' }}>
                      — {dailyQuote.author}, <em>{dailyQuote.book}</em>
                    </p>
                  </div>
                </div>
              </div>
              <div className="row mt-5 mb-4">
                <div className="col-12">
                  <div className="card p-3 shadow-sm" style={{ height: '300px' }}>
                    <div className="d-flex justify-content-end mb-2">
                      <button className="btn btn-outline-primary btn-sm" onClick={handleRefresh}>
                        Refresh Chart
                      </button>
                    </div>
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </div>
              </div>
              <div className="row mt-5">
                <div className="col-12 col-md-4 text-center">
                  <div className="border border-muted p-3 position-relative shadow-sm" style={{ minHeight: '100px' }}>
                    <div className="position-absolute start-50 translate-middle-x bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', top: '-18px', zIndex: 10 }}>
                      <FaBook className="text-primary" style={{ fontSize: '1.6rem' }} />
                    </div>
                    <h6 className="text-muted mb-1 text-center" style={{ fontSize: '0.9rem' }}>Total Books Read</h6>
                    <h5 className="text-muted text-center pt-2" style={{ fontSize: '1.1rem' }}>{totalBooksRead}</h5>
                  </div>
                </div>
                <div className="col-12 col-md-4 text-center">
                  <div className="border border-muted p-3 position-relative shadow-sm" style={{ minHeight: '100px' }}>
                    <div className="position-absolute start-50 translate-middle-x bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', top: '-18px', zIndex: 10 }}>
                      <FaFileAlt className="text-success" style={{ fontSize: '1.6rem' }} />
                    </div>
                    <h6 className="text-muted mb-1 text-center" style={{ fontSize: '0.9rem' }}>Total Pages Read</h6>
                    <h5 className="text-muted text-center pt-2" style={{ fontSize: '1.1rem' }}>{totalPagesRead}</h5>
                  </div>
                </div>
                <div className="col-12 col-md-4 text-center">
                  <div className="border border-muted p-3 position-relative shadow-sm" style={{ minHeight: '100px' }}>
                    <div className="position-absolute start-50 translate-middle-x bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', top: '-18px', zIndex: 10 }}>
                      <FaFire className="text-danger" style={{ fontSize: '1.6rem' }} />
                    </div>
                    <h6 className="text-muted mb-1 text-center" style={{ fontSize: '0.9rem' }}>Longest Streak</h6>
                    <h5 className="text-muted text-center pt-2" style={{ fontSize: '1.1rem' }}>
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