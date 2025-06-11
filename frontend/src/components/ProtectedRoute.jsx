import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, initialized, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  // Mostrar loading solo si realmente está cargando
  if (!initialized || loading) {
    return (
      <div className="route-loading">
        <div className="loading-spinner">
          <p>Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated()) {
    console.log('🚪 Usuario no autenticado, redirigiendo a login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si requiere admin y no es admin, redirigir a dashboard
  if (requireAdmin && !isAdmin()) {
    console.log('⛔ Acceso admin requerido, redirigiendo a dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Usuario autenticado y con permisos, mostrar contenido
  return children;
};

export default ProtectedRoute;