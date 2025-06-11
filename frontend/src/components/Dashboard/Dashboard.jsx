import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { businessAPI } from '../../services/api';
// ✅ CORREGIR la importación - quitar "components/"
import { RecentBusinessesSection } from '../BusinessTable/BusinessTable';
import Navbar from '../Navbar';
import './Dashborad.css';

const Dashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  // ✅ ELIMINAR estos estados ya que RecentBusinessesSection maneja sus propios datos
  // const [businesses, setBusinesses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('🚀 Dashboard: Iniciando carga de datos...');
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('📊 Cargando datos del dashboard...');

      // ✅ SOLO cargar estadísticas, no negocios (RecentBusinessesSection se encarga)
      const statsResponse = await businessAPI.getStats();

      if (statsResponse.success) {
        setStats(statsResponse.data);
        console.log('📊 Estadísticas cargadas:', statsResponse.data);
      }

    } catch (error) {
      console.error('❌ Error cargando dashboard:', error);
      setError('Error cargando datos del dashboard');
    } finally {
      setLoading(false);
      console.log('✅ Dashboard: Carga completada');
    }
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro que quieres cerrar sesión?')) {
      logout();
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Navbar />
        <div className="dashboard-content">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Navbar />
      
      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <div className="welcome-section">
            <h1>¡Bienvenido, {user?.full_name || user?.username}!</h1>
            <p>Panel de control de Business Map</p>
            <div className="user-info">
              <span className="user-role">
                {user?.role === 'admin' ? '👑 Administrador' : '👤 Usuario'}
              </span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
          
          <div className="quick-actions">
            <Link to="/business/new" className="btn btn-primary">
              <span className="icon">➕</span>
              Agregar Negocio
            </Link>
            
            {isAdmin() && (
              <Link to="/admin/users" className="btn btn-secondary">
                <span className="icon">👥</span>
                Gestionar Usuarios
              </Link>
            )}
            
            <button onClick={handleLogout} className="btn btn-outline">
              <span className="icon">🚪</span>
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <div className="error-content">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
              <button onClick={loadDashboardData} className="btn btn-outline">
                🔄 Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🏢</div>
              <div className="stat-content">
                <h3>{stats.total || 0}</h3>
                <p>Total Negocios</p>
              </div>
              <div className="stat-trend">
                {stats.recent > 0 && (
                  <span className="trend-positive">+{stats.recent} esta semana</span>
                )}
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📍</div>
              <div className="stat-content">
                <h3>{stats.withCoordinates || 0}</h3>
                <p>Con Ubicación</p>
              </div>
              <div className="stat-trend">
                <span className="trend-neutral">
                  {stats.withoutCoordinates || 0} sin ubicar
                </span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>{stats.byType?.length || 0}</h3>
                <p>Tipos de Negocio</p>
              </div>
              <div className="stat-trend">
                <span className="trend-neutral">Categorías activas</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🆕</div>
              <div className="stat-content">
                <h3>{stats.recent || 0}</h3>
                <p>Recientes (7 días)</p>
              </div>
              <div className="stat-trend">
                {stats.recent > 0 ? (
                  <span className="trend-positive">↗️ Creciendo</span>
                ) : (
                  <span className="trend-neutral">Sin cambios</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ✅ SECCIÓN DE NEGOCIOS RECIENTES CORREGIDA */}
        <RecentBusinessesSection />

        {/* Business Types Overview */}
        {stats?.byType && stats.byType.length > 0 && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Distribución por Tipo</h2>
            </div>
            <div className="types-grid">
              {stats.byType.slice(0, 8).map((type, index) => (
                <div key={index} className="type-card">
                  <div className="type-icon">
                    {getTypeIcon(type.business_type)}
                  </div>
                  <h4>{type.business_type}</h4>
                  <p>{type.count} negocio{type.count !== 1 ? 's' : ''}</p>
                </div>
              ))}
              
              {stats.byType.length > 8 && (
                <div className="type-card more-types">
                  <div className="type-icon">➕</div>
                  <h4>Más tipos</h4>
                  <p>{stats.byType.length - 8} adicionales</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Accesos Rápidos</h2>
          </div>
          <div className="quick-links-grid">
            <Link to="/business/new" className="quick-link-card">
              <span className="icon">➕</span>
              <h3>Nuevo Negocio</h3>
              <p>Agregar un negocio al directorio</p>
            </Link>
            
            <Link to="/businesses" className="quick-link-card">
              <span className="icon">🔍</span>
              <h3>Buscar Negocios</h3>
              <p>Explorar el directorio completo</p>
            </Link>
            
            <Link to="/profile" className="quick-link-card">
              <span className="icon">👤</span>
              <h3>Mi Perfil</h3>
              <p>Actualizar información personal</p>
            </Link>
            
            {isAdmin() && (
              <Link to="/admin/users" className="quick-link-card">
                <span className="icon">⚙️</span>
                <h3>Administración</h3>
                <p>Gestionar usuarios y configuración</p>
              </Link>
            )}
            
            <button 
              onClick={() => {
                // Redirigir a la página del mapa
                window.location.href = '/map';
              }}
              className="quick-link-card clickable"
            >
              <span className="icon">🗺️</span>
              <h3>Ver Mapa</h3>
              <p>Explorar negocios en mapa interactivo</p>
            </Link>
            
            <Link to="/api/health" className="quick-link-card" target="_blank">
              <span className="icon">💊</span>
              <h3>Estado del Sistema</h3>
              <p>Verificar salud de la API</p>
            </Link>
          </div>
        </div>

        {/* Footer Info */}
        <div className="dashboard-footer">
          <div className="footer-content">
            <div className="system-info">
              <h4>🏗️ Business Map v2.1.0</h4>
              <p>Sistema de gestión de directorio de negocios</p>
            </div>
            
            <div className="user-session">
              <h4>👤 Sesión Actual</h4>
              <p><strong>Usuario:</strong> {user?.username}</p>
              <p><strong>Rol:</strong> {user?.role}</p>
              <p><strong>Último acceso:</strong> {
                user?.last_login 
                  ? new Date(user.last_login).toLocaleString()
                  : 'Primera vez'
              }</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function para iconos de tipos de negocio
const getTypeIcon = (type) => {
  const icons = {
    'restaurante': '🍽️',
    'tienda': '🛍️',
    'farmacia': '💊',
    'banco': '🏦',
    'hospital': '🏥',
    'escuela': '🏫',
    'hotel': '🏨',
    'gasolinera': '⛽',
    'supermercado': '🛒',
    'cafe': '☕',
    'gym': '💪',
    'peluqueria': '💇',
    'taller': '🔧',
    'libreria': '📚',
    'panaderia': '🥖'
  };
  
  const lowerType = type.toLowerCase();
  for (const [key, icon] of Object.entries(icons)) {
    if (lowerType.includes(key)) {
      return icon;
    }
  }
  return '🏢'; // Default icon
};

export default Dashboard;