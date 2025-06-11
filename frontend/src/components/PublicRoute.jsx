import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PublicRoute = ({ children, redirectTo = '/dashboard' }) => {
  const { loading, initialized, isAuthenticated } = useAuth();

  // Mostrar loading solo si realmente está cargando
  if (!initialized || loading) {
    return (
      <div className="route-loading">
        <div className="loading-spinner">
          <p>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si ya está autenticado, redirigir al dashboard
  if (isAuthenticated()) {
    console.log('✅ Usuario ya autenticado, redirigiendo a dashboard');
    return <Navigate to={redirectTo} replace />;
  }

  // Usuario no autenticado, mostrar contenido público (login, register, etc.)
  return children;
};

export default PublicRoute;