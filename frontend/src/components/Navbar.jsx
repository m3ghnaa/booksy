import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUserCircle, FaBook } from 'react-icons/fa';

const Navbar = ({ user, onLogout, isAuthPage = false }) => {
  const [avatarSrc, setAvatarSrc] = useState(user?.avatar || null);

  useEffect(() => {
    if (user?.avatar) {
      setAvatarSrc(`${user.avatar}?t=${new Date().getTime()}`);
    } else {
      setAvatarSrc(null);
    }
  }, [user?.avatar]);

  if (isAuthPage) {
    return (
      <nav className="navbar navbar-dark px-4 shadow-sm" style={{ backgroundColor: '#2f2626', borderBottom: '1px solid #006d77' }}>
        <Link className="navbar-brand fw-bold" to="/dashboard" style={{ fontFamily: "'Cinzel', serif", color: '#006d77' }}>
          <div className="d-flex align-items-center">
            <FaBook className="me-2" style={{ color: '#006d77' }} size={24} />
            Booksy
          </div>
        </Link>
      </nav>
    );
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light px-4 shadow-sm" style={{ backgroundColor: '#e9ecef', borderBottom: '1px solid #006d77' }}>
      <Link className="navbar-brand fw-bold" to="/dashboard" style={{ fontFamily: "'Cinzel', serif", color: '#006d77' }}>
        <div className="d-flex align-items-center">
          <FaBook className="me-2" style={{ color: '#006d77' }} size={24} />
          Booksy
        </div>
      </Link>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
        <ul className="navbar-nav align-items-center">
          <li className="nav-item">
            <Link
              className="nav-link text-dark"
              to="/search"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Search
            </Link>
          </li>

          {user ? (
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle d-flex align-items-center text-dark"
                href="#"
                id="userDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="User Avatar"
                    className="rounded-circle me-2"
                    width="30"
                    height="30"
                    onError={() => setAvatarSrc(null)}
                  />
                ) : (
                  <FaUserCircle
                    className="rounded-circle me-2 text-muted"
                    size={30}
                    style={{ verticalAlign: 'middle' }}
                  />
                )}
                {user.name}
              </a>
              <ul className="dropdown-menu dropdown-menu-end bg-white rounded shadow-sm" aria-labelledby="userDropdown">
                <li>
                  <Link
                    className="dropdown-item text-dark"
                    to="/shelf"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Shelf
                  </Link>
                </li>
                <li>
                  <Link
                    className="dropdown-item text-dark"
                    to="/settings"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Settings
                  </Link>
                </li>
                <li>
                  <button
                    className="dropdown-item text-danger"
                    onClick={onLogout}
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </li>
          ) : null}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;