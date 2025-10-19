import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const Navbar: React.FC = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <button 
          className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <div className="navbar-left">
            <Link 
              to="/" 
              className={`navbar-item home-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>

            {user?.isAdmin && (
              <>
                <div className="navbar-divider"></div>
                <Link 
                  to="/admin" 
                  className={`navbar-item admin-link ${isActive('/admin') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              </>
            )}
          </div>

          {user ? (
            <div className="navbar-user">
              <div className="user-info">
                <div className="user-icon"></div>
                <div className="user-details">
                  <span className="user-email">{user.displayName}</span>
                  {user.isAdmin && <span className="admin-badge">ADMIN</span>}
                </div>
              </div>
              <button onClick={handleLogout} className="navbar-button logout-button">
                Sign Out
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="navbar-button login-button"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;