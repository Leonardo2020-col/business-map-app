import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import GoogleMap from './GoogleMap'; // ✅ Usar el componente original
import { businessAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './BusinessMap.css';

const BusinessMap = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStats, setShowStats] = useState(true);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('all');

  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // ✅ Control del body para fullscreen
  useEffect(() => {
    console.log('🚀 BusinessMap: Activando modo fullscreen');
    document.body.classList.add('map-page');
    document.body.style.overflow = 'hidden';
    
    return () => {
      console.log('🧹 BusinessMap: Desactivando modo fullscreen');
      document.body.classList.remove('map-page');
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    loadBusinesses();
    loadBusinessTypes();
  }, []);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      console.log('📋 Cargando negocios...');
      const response = await businessAPI.getAll();
      const businessesData = response.data?.data || response.data || [];
      console.log('✅ Negocios cargados:', businessesData.length);
      setBusinesses(Array.isArray(businessesData) ? businessesData : []);
    } catch (err) {
      console.error('❌ Error cargando negocios:', err);
      setError('Error al cargar los negocios');
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessTypes = async () => {
    try {
      const response = await businessAPI.getTypes();
      const types = response.data?.data || response.data || [];
      setBusinessTypes(Array.isArray(types) ? types : []);
    } catch (err) {
      console.error('❌ Error cargando tipos:', err);
    }
  };

  // Filtrar negocios por tipo
  const filteredBusinesses = businesses.filter(business => {
    if (selectedType === 'all') return true;
    return business.business_type === selectedType;
  });

  const businessesWithCoords = filteredBusinesses.filter(business => 
    business.latitude && 
    business.longitude && 
    !isNaN(parseFloat(business.latitude)) && 
    !isNaN(parseFloat(business.longitude))
  );

  const stats = {
    total: filteredBusinesses.length,
    withCoords: businessesWithCoords.length,
    byType: businessTypes.reduce((acc, type) => {
      acc[type] = filteredBusinesses.filter(b => b.business_type === type).length;
      return acc;
    }, {})
  };

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: 'white',
        textAlign: 'center',
        padding: '20px',
        zIndex: 9999
      }}>
        <h1 style={{ fontSize: '5rem', marginBottom: '30px' }}>⚠️</h1>
        <h2>Error cargando datos</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px',
            padding: '12px 25px',
            background: 'rgba(255,255,255,0.2)',
            border: '2px solid white',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔄 Reintentar
        </button>
      </div>
    );
  }

  return (
    <div 
      className="fullscreen-map-container" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        overflow: 'hidden'
      }}
    >
      {/* ✅ Panel de controles flotante */}
      <div className={`map-controls ${isControlsCollapsed ? 'collapsed' : ''}`}>
        <div className="controls-header">
          {!isControlsCollapsed && <h2>🗺️ Mapa de Negocios</h2>}
          <button 
            className="toggle-stats-btn"
            onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
            title={isControlsCollapsed ? 'Expandir panel' : 'Colapsar panel'}
          >
            {isControlsCollapsed ? '📊' : '📉'}
          </button>
        </div>

        {!isControlsCollapsed && (
          <>
            {/* Info de negocios */}
            <div style={{ 
              background: '#e7f3ff', 
              padding: '8px 12px', 
              borderRadius: '5px', 
              marginBottom: '15px',
              fontSize: '13px',
              color: '#0c5aa6'
            }}>
              📊 Mostrando {businessesWithCoords.length} de {stats.total} negocios
            </div>

            {/* Estadísticas */}
            {showStats && (
              <div className="map-stats">
                <div className="stat-item">
                  <span className="stat-number">{stats.total}</span>
                  <span className="stat-label">Total</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{stats.withCoords}</span>
                  <span className="stat-label">Ubicados</span>
                </div>
              </div>
            )}

            <div className="stats-toggle">
              <button 
                className="toggle-stats-btn secondary"
                onClick={() => setShowStats(!showStats)}
              >
                {showStats ? '📈 Ocultar Stats' : '📊 Mostrar Stats'}
              </button>
            </div>

            {/* Filtro por tipo */}
            <div className="type-filter">
              <label>🏢 Filtrar por tipo:</label>
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">Todos ({stats.total})</option>
                {businessTypes.map(type => (
                  <option key={type} value={type}>
                    {type} ({stats.byType[type] || 0})
                  </option>
                ))}
              </select>
            </div>

            {/* Distribución por tipo */}
            {showStats && businessTypes.length > 0 && (
              <div className="type-distribution">
                <h4>📊 Distribución por Tipo:</h4>
                {businessTypes.map(type => {
                  const count = stats.byType[type] || 0;
                  const percentage = stats.total > 0 ? (count / stats.total * 100).toFixed(1) : 0;
                  return (
                    <div key={type} className="type-stat">
                      <span className="type-name">{type}</span>
                      <div className="type-bar">
                        <div 
                          className="type-fill" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="type-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="map-instructions">
              <p>💡 <strong>Tip:</strong> Haz clic en los marcadores para ver detalles del negocio</p>
            </div>

            <div className="map-actions">
              <button onClick={() => navigate('/businesses/new')} className="action-btn primary">
                ➕ Nuevo Negocio
              </button>
              <button onClick={() => navigate('/businesses')} className="action-btn secondary">
                📋 Ver Lista
              </button>
              <button onClick={() => navigate('/dashboard')} className="action-btn secondary">
                🏠 Dashboard
              </button>
              <button onClick={loadBusinesses} className="action-btn secondary" disabled={loading}>
                🔄 {loading ? 'Cargando...' : 'Actualizar'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">🔄</div>
          <p>Cargando negocios...</p>
        </div>
      )}

      {/* ✅ Usar el componente GoogleMap original */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1
      }}>
        <GoogleMap businesses={filteredBusinesses} />
      </div>
    </div>
  );
};

export default BusinessMap;