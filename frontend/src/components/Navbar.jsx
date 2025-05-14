import React, { useEffect, useState } from 'react';
     import { Link } from 'react-router-dom';
     import { FaUserCircle, FaBook } from 'react-icons/fa';

     const Navbar = ({ user, onLogout, isAuthPage = false }) => {
       const [avatarSrc, setAvatarSrc] = useState(user?.avatar || null);

       useEffect(() => {
         if (user?.avatar) {
           // Use the production backend URL in production, fallback to localhost in development
           const serverUrl = process.env.REACT_APP_SERVER_URL || 'https://booksy-backend.onrender.com';
           // If the avatar URL contains localhost, reconstruct it using the server URL
           if (user.avatar.includes('localhost')) {
             const avatarPath = user.avatar.split('/uploads/')[1]; // Extract the file path
             setAvatarSrc(`${serverUrl}/uploads/${avatarPath}?t=${new Date().getTime()}`);
           } else if (user.avatar.startsWith('http')) {
             setAvatarSrc(`${user.avatar.replace('http:', 'https:')}?t=${new Date().getTime()}`);
           } else {
             setAvatarSrc(`${serverUrl}${user.avatar.startsWith('/') ? '' : '/'}${user.avatar}?t=${new Date().getTime()}`);
           }
         } else {
           setAvatarSrc(null);
         }
       }, [user?.avatar]);

       if (isAuthPage) {
         return (
           <nav className="navbar navbar-dark px-4 shadow-sm" style={{ backgroundColor: '#000000', borderBottom: '1px solid #ffffff' }}>
             <Link className="navbar-brand fw-bold" to="/dashboard" style={{ fontFamily: "'Cinzel', serif", color: '#ffffff' }}>
               <div className="d-flex align-items-center">
                 <FaBook className="me-2" style={{ color: '#ffffff' }} size={24} />
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
               .dropdown-item:hover {
                 color: #000000 !important;
               }
             `}
           </style>
           <nav className="fixed-top rounded-bottom navbar navbar-expand-lg navbar-dark px-4 shadow-sm" style={{ backgroundColor: '#000000', borderBottom: '1px solid #ffffff'}}>
             <Link className="navbar-brand fw-bold" to="/dashboard" style={{ fontFamily: "'Cinzel', serif", color: '#ffffff' }}>
               <div className="d-flex align-items-center">
                 <FaBook className="me-2" style={{ color: '#ffffff' }} size={24} />
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

             <div className="collapse navbar-collapse justify-content-end" id="navbarNav" style={{ backgroundColor: '#000000' }}>
               <ul className="navbar-nav align-items-center">
                 <li className="nav-item">
                   <Link
                     className="nav-link text-white px-3"
                     to="/search"
                     style={{ fontFamily: "'Montserrat', sans-serif" }}
                   >
                     Search
                   </Link>
                 </li>

                 {user ? (
                   <li className="nav-item dropdown">
                     <a
                       className="nav-link dropdown-toggle d-flex align-items-center text-white"
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
                     <ul className="dropdown-menu dropdown-menu-end rounded shadow-sm" style={{ backgroundColor: '#000000' }} aria-labelledby="userDropdown">
                       <li>
                         <Link
                           className="dropdown-item text-white"
                           to="/shelf"
                           style={{ fontFamily: "'Montserrat', sans-serif" }}
                         >
                           Shelf
                         </Link>
                       </li>
                       <li>
                         <Link
                           className="dropdown-item text-white"
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
         </>
       );
     };

     export default Navbar;