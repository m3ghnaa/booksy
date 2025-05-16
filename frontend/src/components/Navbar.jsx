import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUserCircle, FaBook, FaUserAstronaut, FaUserNinja, FaUserSecret, FaUserTie } from 'react-icons/fa';

// Avatar options with styles (same as SettingsPage.jsx and Dashboard.jsx)
const avatarOptions = [
  { icon: FaUserCircle, name: 'FaUserCircle', style: { color: '#008080', backgroundColor: '#e7f1ff', borderColor: '#008080' } },
  { icon: FaUserAstronaut, name: 'FaUserAstronaut', style: { color: '#ff5733', backgroundColor: '#ffe7e3', borderColor: '#ff5733' } },
  { icon: FaUserNinja, name: 'FaUserNinja', style: { color: '#28a745', backgroundColor: '#e6f4ea', borderColor: '#28a745' } },
  { icon: FaUserSecret, name: 'FaUserSecret', style: { color: '#6f42c1', backgroundColor: '#f3e8ff', borderColor: '#6f42c1' } },
  { icon: FaUserTie, name: 'FaUserTie', style: { color: '#dc3545', backgroundColor: '#f8e1e4', borderColor: '#dc3545' } }
];

const Navbar = ({ user, onLogout, isAuthPage = false }) => {
  const [avatarSrc, setAvatarSrc] = useState(user?.avatar || null);

  // State to hold the selected avatar component and style
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  useEffect(() => {
    // Handle avatar URL for uploaded images
    if (user?.avatar && user.avatar.startsWith('http')) {
      const serverUrl = process.env.REACT_APP_SERVER_URL || 'https://booksy-17xg.onrender.com';
      if (user.avatar.includes('localhost')) {
        const avatarPath = user.avatar.split('/uploads/')[1];
        setAvatarSrc(`${serverUrl}/uploads/${avatarPath}?t=${new Date().getTime()}`);
      } else if (user.avatar.startsWith('http')) {
        setAvatarSrc(`${user.avatar.replace('http:', 'https:')}?t=${new Date().getTime()}`);
      } else {
        setAvatarSrc(`${serverUrl}${user.avatar.startsWith('/') ? '' : '/'}${user.avatar}?t=${new Date().getTime()}`);
      }
    } else {
      setAvatarSrc(null);
    }

    // Set the selected avatar icon and style
    const avatarOption = avatarOptions.find(option => option.name === (user?.avatar || 'FaUserCircle')) || avatarOptions[0];
    setSelectedAvatar(avatarOption);
  }, [user?.avatar]);

  const AvatarIcon = selectedAvatar ? selectedAvatar.icon : FaUserCircle;
  const avatarStyle = selectedAvatar ? selectedAvatar.style : { color: '#008080' };

  if (isAuthPage) {
    return (
      <nav className="navbar px-4 shadow" style={{ backgroundColor: '#f8f9fa', minHeight: '80px' }}>
        <Link className="navbar-brand fw-bold" to="/dashboard" style={{ fontFamily: "'Cinzel', serif", color: '#008080' }}>
          <div className="d-flex align-items-center">
            <FaBook className="me-2 brand-icon" size={24} />
            Booksy
          </div>
        </Link>
      </nav>
    );
  }

  return (
    <>
      <style>
        {`
          /* Increase navbar height and style */
          .navbar {
            min-height: 70px !important;
            background-color: #f8f9fa !important; /* Light background */
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important; /* Enhanced shadow */
          }

          /* Teal text color for all nav links and brand */
          .navbar-brand,
          .nav-link,
          .dropdown-item {
            color: #008080 !important; /* Teal text */
          }
          .navbar-brand {
            font-family: "'Cinzel', serif" !important;
            font-size: 1.5rem !important; /* Larger font size for brand name */
            letter-spacing: 2px !important; /* Add letter spacing */
            text-transform: uppercase !important; /* Capitalize the brand name */
          }
          .nav-link,
          .dropdown-item {
            font-family: "'Montserrat', sans-serif" !important;
          }

          /* Hover effects for nav links and dropdown items */
          .nav-link:hover,
          .dropdown-item:hover {
            color: #006666 !important; /* Darker teal on hover */
            background-color: #e9ecef !important; /* Light gray background on hover */
          }

          /* Style the brand icon */
          .brand-icon {
            color: #008080 !important; /* Teal icon */
            filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.3)); /* Shadow for elevation */
            transition: transform 0.3s ease, filter 0.3s ease !important;
          }
          .brand-icon:hover {
            transform: scale(1.2) !important; /* Slight scale on hover */
            filter: drop-shadow(4px 4px 4px rgba(0, 0, 0, 0.5)) !important; /* Stronger shadow on hover */
          }

          /* Style the avatar */
          .avatar-option {
            padding: 5px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            width: 40px;
            height: 40px;
            border: 1px solid;
          }
          .avatar-icon {
            font-size: 1.8rem;
          }

          /* Dropdown menu styling */
          .dropdown-menu {
            background-color: #f8f9fa !important; /* Light background */
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important; /* Enhanced shadow */
          }

          /* Collapsed menu styling for smaller screens */
          @media (max-width: 991.98px) {
            .navbar-collapse {
              background-color: #f8f9fa !important; /* Light background for collapsed menu */
              padding: 10px !important;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important; /* Enhanced shadow */
            }
            .navbar-nav {
              flex-direction: column !important; /* Stack items vertically */
              align-items: start !important;
            }
            .nav-item {
              width: 100% !important;
              margin: 5px 0 !important;
            }
            .nav-link {
              padding: 8px 15px !important;
              width: 100% !important;
            }
            /* Hide the dropdown toggle on smaller screens */
            .dropdown-toggle {
              display: none !important;
            }
          }

          /* Ensure navbar toggler icon is visible */
          .navbar-toggler-icon {
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba(0, 128, 128, 1)' stroke-width='2' stroke-linecap='round' stroke-miterlimit='10' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e") !important;
          }
        `}
      </style>
      <nav className="fixed-top rounded-bottom navbar navbar-expand-lg px-4 shadow">
        <Link className="navbar-brand fw-bold" to="/dashboard">
          <div className="d-flex align-items-center">
            <FaBook className="me-2 brand-icon" size={24} />
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
                className="nav-link px-3"
                to="/search"
              >
                Search
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link px-3"
                to="/shelf"
              >
                Shelf
              </Link>
            </li>

            {user ? (
              <>
                {/* Dropdown for larger screens */}
                <li className="nav-item dropdown d-none d-lg-block">
                  <a
                    className="nav-link dropdown-toggle d-flex align-items-center"
                    href="#"
                    id="userDropdown"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt="User Avatar"
                        className="rounded-circle me-2"
                        height="30"
                        onError={() => setAvatarSrc(null)}
                      />
                    ) : (
                      <div
                        className="avatar-option me-2"
                        style={{
                          color: avatarStyle.color,
                          backgroundColor: avatarStyle.backgroundColor,
                          borderColor: avatarStyle.borderColor,
                          border: `1px solid ${avatarStyle.borderColor}`
                        }}
                      >
                        <AvatarIcon className="avatar-icon" />
                      </div>
                    )}
                    {user.name}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end rounded shadow" aria-labelledby="userDropdown">
                    <li>
                      <Link
                        className="dropdown-item"
                        to="/settings"
                      >
                        Settings
                      </Link>
                    </li>
                    <li>
                      <button
                        className="dropdown-item text-danger"
                        onClick={onLogout}
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                </li>

                {/* Links for smaller screens (no dropdown, no profile name/avatar) */}
                <li className="nav-item d-lg-none">
                  <Link
                    className="nav-link"
                    to="/settings"
                  >
                    Settings
                  </Link>
                </li>
                <li className="nav-item d-lg-none">
                  <button
                    className="nav-link text-danger"
                    onClick={onLogout}
                    style={{ background: 'none', border: 'none', padding: 0 }}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : null}
          </ul>
        </div>
      </nav>
    </>
  );
};

export default Navbar;