import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Cerrar menú móvil cuando cambie la ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Cerrar menú móvil al hacer clic en un enlace
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  // Alternar menú móvil
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo y título */}
        <Link to="/dashboard" className="navbar-brand" onClick={handleLinkClick}>
          <span className="navbar-logo">🗺️</span>
          <h1 className="navbar-title">Business Map</h1>
        </Link>

        {/* Botón hamburguesa para móvil */}
        <button 
          className={`hamburger ${isMobileMenuOpen ? 'hamburger-active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Menú de navegación"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        {/* Menú de navegación */}
        <div className={`navbar-menu ${isMobileMenuOpen ? 'navbar-menu-active' : ''}`}>
          {/* Links de navegación */}
          <div className="navbar-nav">
            <Link
              to="/dashboard"
              className={`nav-link ${isActive('/dashboard') ? 'nav-link-active' : ''}`}
              onClick={handleLinkClick}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </Link>
            
            <Link
              to="/businesses"
              className={`nav-link ${isActive('/businesses') ? 'nav-link-active' : ''}`}
              onClick={handleLinkClick}
            >
              <span className="nav-icon">🏢</span>
              <span className="nav-text">Negocios</span>
            </Link>
            
            {isAdmin && (
              <Link
                to="/admin"
                className={`nav-link nav-link-admin ${isActive('/admin') ? 'nav-link-active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="nav-icon">⚙️</span>
                <span className="nav-text">Admin</span>
              </Link>
            )}
          </div>

          {/* Usuario y acciones */}
          <div className="navbar-user">
            <Link
              to="/profile"
              className="user-link"
              onClick={handleLinkClick}
            >
              <span className="user-icon">👤</span>
              <span className="user-info">
                <span className="username">{user?.username}</span>
                {isAdmin && <span className="user-role">(Admin)</span>}
              </span>
            </Link>
            
            <button
              onClick={() => {
                handleLogout();
                handleLinkClick();
              }}
              className="logout-btn"
            >
              <span className="logout-icon">🚪</span>
              <span className="logout-text">Salir</span>
            </button>
          </div>
        </div>

        {/* Overlay para cerrar menú móvil */}
        {isMobileMenuOpen && (
          <div 
            className="mobile-overlay" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;