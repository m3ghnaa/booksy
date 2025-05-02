import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light px-4">
      <Link className="navbar-brand fw-bold text-primary" to="/dashboard">
        Booksy
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
            <Link className="nav-link" to="/search">
              Search
            </Link>
          </li>

          {user ? (
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle d-flex align-items-center"
                href="#"
                id="userDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <img
                  src={user.avatar || "https://via.placeholder.com/30"}
                  alt="avatar"
                  className="rounded-circle me-2"
                  width="30"
                  height="30"
                />
                {user.name}
              </a>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                <li>
                  <Link className="dropdown-item" to="/shelf">
                    Shelf
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/settings">
                    Settings
                  </Link>
                </li>
                <li>
                  <button className="dropdown-item text-danger" onClick={onLogout}>
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
