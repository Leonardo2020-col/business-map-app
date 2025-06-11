import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const adminDropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  
  // Verificar si estamos en una ruta de admin
  const isAdminPath = () => {
    return location.pathname.startsWith('/admin') || location.pathname === '/forgot-password';
  };

  // Cerrar menú móvil cuando cambie la ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAdminMenuOpen(false);
  }, [location.pathname]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target)) {
        setIsAdminMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cerrar menú móvil al hacer clic en un enlace
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
    setIsAdminMenuOpen(false);
  };

  // Alternar menú móvil
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Alternar menú admin
  const toggleAdminMenu = () => {
    setIsAdminMenuOpen(!isAdminMenuOpen);
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

            <Link
              to="/map"
              className={`nav-link ${isActive('/map') ? 'nav-link-active' : ''}`}
              onClick={handleLinkClick}
            >
              <span className="nav-icon">🗺️</span>
              <span className="nav-text">Mapa</span>
            </Link>
            
            {/* Menú Admin con dropdown */}
            {isAdmin() && (
              <div className="admin-dropdown" ref={adminDropdownRef}>
                <button
                  className={`nav-link nav-link-admin admin-toggle ${isAdminPath() ? 'nav-link-active' : ''}`}
                  onClick={toggleAdminMenu}
                  aria-expanded={isAdminMenuOpen}
                >
                  <span className="nav-icon">⚙️</span>
                  <span className="nav-text">Admin</span>
                  <span className={`dropdown-arrow ${isAdminMenuOpen ? 'dropdown-arrow-open' : ''}`}>▼</span>
                </button>

                {/* Dropdown del menú admin */}
                {isAdminMenuOpen && (
                  <div className="admin-dropdown-menu">
                    <Link
                      to="/admin/users"
                      className="admin-dropdown-item"
                      onClick={handleLinkClick}
                    >
                      <span className="dropdown-icon">👥</span>
                      <span className="dropdown-text">Gestionar Usuarios</span>
                    </Link>
                    
                    <Link
                      to="/forgot-password"
                      className="admin-dropdown-item"
                      onClick={handleLinkClick}
                    >
                      <span className="dropdown-icon">🔐</span>
                      <span className="dropdown-text">Gestión de Contraseñas</span>
                    </Link>

                    <div className="dropdown-divider"></div>

                    <Link
                      to="/business/new"
                      className="admin-dropdown-item"
                      onClick={handleLinkClick}
                    >
                      <span className="dropdown-icon">➕</span>
                      <span className="dropdown-text">Agregar Negocio</span>
                    </Link>

                    <a
                      href="/api/health"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-dropdown-item"
                      onClick={handleLinkClick}
                    >
                      <span className="dropdown-icon">💊</span>
                      <span className="dropdown-text">Estado del Sistema</span>
                    </a>
                  </div>
                )}
              </div>
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
                {isAdmin() && <span className="user-role">(Admin)</span>}
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