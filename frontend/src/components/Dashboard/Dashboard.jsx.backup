// src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom'; // ✅ AGREGAR ESTA IMPORTACIÓN
import GoogleMap from '../Map/GoogleMap';
import BusinessForm from '../BusinessForm/BusinessForm';
import BusinessTable from '../BusinessTable/BusinessTable';
import { businessAPI } from '../../services/api';
import './Dashborad.css';

const Dashboard = () => {
  // Hooks de autenticación
  const { user, logout, isAdmin } = useAuth();
  
  // Estados principales
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('map');
  const [showForm, setShowForm] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [error, setError] = useState('');
  
  // Estados de estadísticas
  const [stats, setStats] = useState({
    total: 0,
    byType: {},
    withCoordinates: 0
  });

  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchBusinesses();
  }, []);

  /**
   * Función para obtener todos los negocios desde la API
   */
  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Cargando negocios...');
      const response = await businessAPI.getAll();
      
      // Manejar diferentes formatos de respuesta
      const businessData = response.data.data || response.data;
      console.log('Negocios cargados:', businessData.length);
      
      setBusinesses(businessData);
      
      // Calcular estadísticas localmente
      calculateStats(businessData);
      
    } catch (error) {
      console.error('Error al cargar negocios:', error);
      
      let errorMessage = 'Error al cargar los negocios.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === 'Network Error') {
        errorMessage = 'Error de conexión. Verifica que el servidor esté funcionando.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Tiempo de espera agotado. Intenta de nuevo.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calcular estadísticas de los negocios
   */
  const calculateStats = (businessData) => {
    const totalBusinesses = businessData.length;
    
    // Agrupar por tipo de negocio
    const byType = businessData.reduce((acc, business) => {
      const type = business.business_type || 'Sin tipo';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    // Contar negocios con coordenadas
    const withCoordinates = businessData.filter(business => 
      business.latitude && 
      business.longitude && 
      !isNaN(business.latitude) && 
      !isNaN(business.longitude)
    ).length;
    
    setStats({
      total: totalBusinesses,
      byType,
      withCoordinates
    });
  };

  /**
   * Manejar click en marcador del mapa
   */
  const handleBusinessClick = (business) => {
    console.log('Negocio seleccionado:', business.name);
    setSelectedBusiness(business);
    
    // Si estamos en móvil, cambiar a la vista del mapa si no estamos ahí
    if (window.innerWidth <= 768 && activeTab !== 'map') {
      setActiveTab('map');
    }
  };

  /**
   * Abrir formulario para agregar nuevo negocio
   */
  const handleAddBusiness = () => {
    console.log('Abriendo formulario para nuevo negocio');
    setEditingBusiness(null);
    setShowForm(true);
  };

  /**
   * Abrir formulario para editar negocio existente
   */
  const handleEditBusiness = (business) => {
    console.log('Editando negocio:', business.name);
    
    if (!isAdmin && business.created_by !== user?.id) {
      alert('No tienes permisos para editar este negocio.');
      return;
    }
    
    setEditingBusiness(business);
    setShowForm(true);
  };

  /**
   * Manejar éxito en formulario (crear/editar)
   */
  const handleFormSuccess = () => {
    console.log('Formulario completado exitosamente');
    setShowForm(false);
    setEditingBusiness(null);
    
    // Recargar datos para reflejar cambios
    fetchBusinesses();
    
    // Mostrar mensaje de éxito
    const action = editingBusiness ? 'actualizado' : 'creado';
    setTimeout(() => {
      alert(`Negocio ${action} exitosamente.`);
    }, 100);
  };

  /**
   * Cancelar formulario
   */
  const handleFormCancel = () => {
    console.log('Formulario cancelado');
    setShowForm(false);
    setEditingBusiness(null);
  };

  /**
   * Manejar logout del usuario
   */
  const handleLogout = () => {
    const confirmLogout = window.confirm('¿Estás seguro de cerrar sesión?');
    if (confirmLogout) {
      console.log('Usuario cerrando sesión');
      logout();
    }
  };

  /**
   * Cambiar tab activo
   */
  const handleTabChange = (tab) => {
    console.log('Cambiando a tab:', tab);
    setActiveTab(tab);
    
    // Limpiar selección al cambiar de tab
    if (tab !== 'map') {
      setSelectedBusiness(null);
    }
  };

  /**
   * Limpiar mensaje de error
   */
  const clearError = () => {
    setError('');
  };

  /**
   * Obtener saludo según la hora
   */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Mostrar pantalla de carga
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <span className="loading"></span>
          <h3>Cargando Business Map...</h3>
          <p>Obteniendo información de negocios</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header Principal */}
      

      {/* Alerta de error */}
      {error && (
        <div className="dashboard-alert">
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span className="alert-message">{error}</span>
            <button 
              onClick={clearError}
              className="alert-close"
              title="Cerrar alerta"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <main className="dashboard-main">
        {/* Vista de Mapa */}
        {activeTab === 'map' && (
          <div className="map-layout">
            {/* Contenedor del mapa */}
            <div className="map-container">
              <GoogleMap 
                businesses={businesses} 
                onBusinessClick={handleBusinessClick}
              />
              
              {/* Contador flotante de negocios */}
              
            </div>

            {/* Sidebar con información */}
            <aside className="map-sidebar">
              <div className="sidebar-content">
                
                {/* Sección de estadísticas */}
                <section className="stats-section">
                  <h3 className="section-title">
                    <span>📊</span>
                    Estadísticas
                  </h3>
                  
                

                  {/* Distribución por tipo */}
                  {Object.keys(stats.byType).length > 0 && (
                    <div className="business-types">
                      <h4 className="subsection-title">Distribución por Tipo:</h4>
                      <div className="type-list">
                        {Object.entries(stats.byType)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 6)
                          .map(([type, count]) => (
                            <div key={type} className="type-item">
                              <span className="type-name">{type}</span>
                              <div className="type-info">
                                <span className="type-count">{count}</span>
                                <div className="type-bar">
                                  <div 
                                    className="type-fill" 
                                    style={{ 
                                      width: `${(count / Math.max(...Object.values(stats.byType))) * 100}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* Negocio seleccionado */}
                {selectedBusiness && (
                  <section className="selected-business">
                    <h4 className="section-title">
                      <span>🎯</span>
                      Seleccionado
                    </h4>
                    
                    <div className="business-card">
                      <div className="business-header">
                        <h5 className="business-name">{selectedBusiness.name}</h5>
                        <span className="badge badge-primary business-type">
                          {selectedBusiness.business_type}
                        </span>
                      </div>
                      
                      <div className="business-details">
                        <div className="detail-item">
                          <span className="detail-icon">📍</span>
                          <span className="detail-text">{selectedBusiness.address}</span>
                        </div>
                        
                        {selectedBusiness.phone && (
                          <div className="detail-item">
                            <span className="detail-icon">📞</span>
                            <a 
                              href={`tel:${selectedBusiness.phone}`} 
                              className="detail-link"
                            >
                              {selectedBusiness.phone}
                            </a>
                          </div>
                        )}
                        
                        {selectedBusiness.email && (
                          <div className="detail-item">
                            <span className="detail-icon">✉️</span>
                            <a 
                              href={`mailto:${selectedBusiness.email}`} 
                              className="detail-link"
                            >
                              {selectedBusiness.email}
                            </a>
                          </div>
                        )}
                        
                        {selectedBusiness.description && (
                          <div className="detail-item description">
                            <span className="detail-icon">📝</span>
                            <span className="detail-text">{selectedBusiness.description}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Botón de editar para admin */}
                      {isAdmin && (
                        <div className="business-actions">
                          <button
                            onClick={() => handleEditBusiness(selectedBusiness)}
                            className="btn btn-primary btn-sm edit-btn"
                            title="Editar este negocio"
                          >
                            <span>✏️</span>
                            <span>Editar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Negocios recientes */}
                <section className="recent-businesses">
                  <h4 className="section-title">
                    <span>🕒</span>
                    Recientes
                  </h4>
                  
                  <div className="recent-list">
                    {businesses
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                      .slice(0, 5)
                      .map((business) => (
                        <div
                          key={business.id}
                          className={`recent-item ${selectedBusiness?.id === business.id ? 'active' : ''}`}
                          onClick={() => handleBusinessClick(business)}
                          title={`Ver ${business.name} en el mapa`}
                        >
                          <div className="recent-content">
                            <div className="recent-name">{business.name}</div>
                            <div className="recent-details">
                              <span className="recent-type">{business.business_type}</span>
                              <span className="recent-date">
                                {new Date(business.created_at).toLocaleDateString('es-PE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                          
                          {business.latitude && business.longitude && (
                            <span className="recent-location">📍</span>
                          )}
                        </div>
                      ))}
                  </div>
                  
                  {businesses.length === 0 && (
                    <div className="empty-recent">
                      <span className="empty-icon">📭</span>
                      <span className="empty-text">No hay negocios aún</span>
                    </div>
                  )}
                </section>
              </div>
            </aside>
          </div>
        )}

        {/* ✅ NUEVA VISTA DE ADMINISTRACIÓN */}
        {activeTab === 'admin' && isAdmin && (
          <div className="admin-layout">
            <div className="admin-container">
              <div className="admin-header">
                <h2 className="admin-title">
                  <span className="title-icon">⚙️</span>
                  Panel de Administración
                </h2>
                <p className="admin-subtitle">
                  Herramientas y configuraciones administrativas del sistema
                </p>
              </div>

              {/* Sección de Herramientas */}
              <section className="admin-section">
                <h3 className="section-title">
                  <span className="title-icon">🛠️</span>
                  Herramientas de Gestión
                </h3>
                
                <div className="admin-cards">
                  {/* Card de Gestión de Contraseñas */}
                  <Link to="/admin/password-reset" className="admin-card">
                    <div className="admin-card-icon">🔐</div>
                    <div className="admin-card-content">
                      <h4>Gestión de Contraseñas</h4>
                      <p>Resetear contraseñas de usuarios del sistema</p>
                    </div>
                    <div className="admin-card-arrow">→</div>
                  </Link>

                  {/* Card de Gestión de Usuarios */}
                  <div className="admin-card disabled">
                    <div className="admin-card-icon">👥</div>
                    <div className="admin-card-content">
                      <h4>Gestión de Usuarios</h4>
                      <p>Administrar usuarios y permisos</p>
                      <span className="coming-soon">Próximamente</span>
                    </div>
                    <div className="admin-card-arrow">→</div>
                  </div>

                  {/* Card de Logs del Sistema */}
                  <div className="admin-card disabled">
                    <div className="admin-card-icon">📊</div>
                    <div className="admin-card-content">
                      <h4>Logs del Sistema</h4>
                      <p>Ver actividad y auditoría del sistema</p>
                      <span className="coming-soon">Próximamente</span>
                    </div>
                    <div className="admin-card-arrow">→</div>
                  </div>

                  {/* Card de Backup */}
                  <div className="admin-card disabled">
                    <div className="admin-card-icon">💾</div>
                    <div className="admin-card-content">
                      <h4>Backup y Restauración</h4>
                      <p>Gestionar copias de seguridad</p>
                      <span className="coming-soon">Próximamente</span>
                    </div>
                    <div className="admin-card-arrow">→</div>
                  </div>
                </div>
              </section>

              {/* Sección de Estadísticas del Sistema */}
              <section className="admin-section">
                <h3 className="section-title">
                  <span className="title-icon">📈</span>
                  Estadísticas del Sistema
                </h3>
                
                <div className="system-stats">
                  <div className="stat-box">
                    <div className="stat-icon">👤</div>
                    <div className="stat-content">
                      <div className="stat-value">1</div>
                      <div className="stat-label">Usuario Admin</div>
                    </div>
                  </div>
                  
                  
                  
                  <div className="stat-box">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                      <div className="stat-value">
                        {new Date().toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="stat-label">Fecha Actual</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Información del Sistema */}
              <section className="admin-section">
                <h3 className="section-title">
                  <span className="title-icon">ℹ️</span>
                  Información del Sistema
                </h3>
                
                <div className="system-info">
                  <div className="info-item">
                    <span className="info-label">Versión del Sistema:</span>
                    <span className="info-value">1.0.0</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Usuario Actual:</span>
                    <span className="info-value">{user?.username} (Admin)</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Última Actualización:</span>
                    <span className="info-value">
                      {new Date().toLocaleString('es-PE')}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Vista de Tabla */}
        {activeTab === 'table' && (
          <div className="table-layout">
            <div className="table-header">
              <div className="table-header-content">
                <div className="table-title-section">
                  <h2 className="table-title">
                    <span>📋</span>
                    Lista de Negocios
                  </h2>
                  <p className="table-description">
                    Gestiona todos los negocios registrados en el sistema
                  </p>
                </div>
                
                <div className="table-meta">
                  <span className="table-count">
                    <strong>{businesses.length}</strong> negocios registrados
                  </span>
                  <div className="table-actions">
                    <button
                      onClick={fetchBusinesses}
                      className="btn btn-secondary btn-sm refresh-btn"
                      disabled={loading}
                      title="Actualizar lista"
                    >
                      <span>🔄</span>
                      <span className="btn-text">Actualizar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="table-container">
              <BusinessTable
                businesses={businesses}
                onEdit={handleEditBusiness}
                onRefresh={fetchBusinesses}
              />
            </div>
          </div>
        )}
      </main>

      {/* Modal del formulario */}
      {showForm && (
        <BusinessForm
          business={editingBusiness}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
};

export default Dashboard;