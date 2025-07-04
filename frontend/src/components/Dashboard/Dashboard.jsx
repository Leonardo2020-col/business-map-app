import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { businessAPI } from '../../services/api';
import { RecentBusinessesSection } from '../BusinessTable/BusinessTable';
import Navbar from '../Navbar/Navbar';
import './Dashboard.css'; // ✅ CORREGIDO: era 'Dashborad.css'

const Dashboard = () => {
  const { user, logout, isAdmin } = useAuth();
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

  // ✅ HELPER FUNCTION MOVIDA FUERA DEL COMPONENTE
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
    return '🏢';
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
            <h1>¡Bienvenido{user?.username ? `, ${user.username}` : ''}!</h1>
            <p>Panel de control de Business Map</p>
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
                  <span className="trend-positive">+{stats.recent} recientes</span>
                )}
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
                <p>Recientes</p>
              </div>
              <div className="stat-trend">
                {stats.recent > 0 ? (
                  <span className="trend-positive">↗️ Creciendo</span>
                ) : (
                  <span className="trend-neutral">Sin cambios</span>
                )}
              </div>
            </div>

            {/* ✅ NUEVA CARD PARA SERVICIOS */}
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <h3>{stats.servicesStatus?.withIssues || 0}</h3>
                <p>Con Servicios Vencidos</p>
              </div>
              <div className="stat-trend">
                {stats.servicesStatus?.withIssues > 0 ? (
                  <span className="trend-negative">⚠️ Requieren atención</span>
                ) : (
                  <span className="trend-positive">✅ Todo al día</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Businesses Section */}
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
                    {getTypeIcon(type.type)}
                  </div>
                  <h4>{type.type}</h4>
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

        {/* Admin Panel - Solo para administradores */}
        {isAdmin() && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Panel de Administración</h2>
              <span className="admin-badge">🔐 Solo Administrador</span>
            </div>
            <div className="admin-links-grid">
              <Link to="/users" className="admin-link-card">
                <span className="icon">👥</span>
                <h3>Gestión de Usuarios</h3>
                <p>Crear, editar y administrar cuentas de usuario</p>
                <div className="card-status active">Activo</div>
              </Link>
              
              <Link to="/admin/reports" className="admin-link-card">
                <span className="icon">📊</span>
                <h3>Reportes del Sistema</h3>
                <p>Análisis detallados y estadísticas del sistema</p>
                <div className="card-status active">Activo</div>
              </Link>
            </div>
          </div>
        )}

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

export default Dashboard;