import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({ 
    username: '', 
    password: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validaciones básicas
    if (!credentials.username.trim()) {
      setError('El nombre de usuario es requerido');
      setLoading(false);
      return;
    }

    if (!credentials.password) {
      setError('La contraseña es requerida');
      setLoading(false);
      return;
    }

    const result = await login(credentials);
    
    if (!result.success) {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      setError('');
    }
  };

  const handleDemoLogin = (username, password) => {
    setCredentials({ username, password });
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-card slide-in-up">
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon">🗺️</div>
            <h1 className="login-title">Business Map</h1>
          </div>
          <p className="login-subtitle">
            Sistema de gestión de negocios con mapa interactivo
          </p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username" className="form-label required">
              Usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className={`form-input ${error ? 'error' : ''}`}
              placeholder="Ingresa tu nombre de usuario"
              value={credentials.username}
              onChange={handleChange}
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label required">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className={`form-input ${error ? 'error' : ''}`}
              placeholder="Ingresa tu contraseña"
              value={credentials.password}
              onChange={handleChange}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="alert alert-error">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg btn-full login-button"
          >
            {loading ? (
              <>
                <span className="loading"></span>
                Iniciando sesión...
              </>
            ) : (
              <>
                <span>🔐</span>
                Iniciar Sesión
              </>
            )}
          </button>
        </form>


        <footer className="login-footer">
          <p>© 2024 Business Map. Desarrollado con React y PostgreSQL.</p>
        </footer>
      </div>
    </div>
  );
};

export default Login;
