import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { businessAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import './BusinessTable.css';

// ============================================================================
// COMPONENTE BASE DE TABLA - Simplificado
// ============================================================================
const BusinessTableBase = ({ 
  businesses = [], 
  loading = false, 
  error = null, 
  onDelete = null,
  showActions = true,
  maxRows = null,
  compact = false 
}) => {
  const navigate = useNavigate();

  const handleDelete = async (business) => {
    if (!onDelete) return;
    
    if (!window.confirm(`¿Estás seguro de que quieres eliminar "${business.name}"?`)) {
      return;
    }
    
    onDelete(business.id);
  };

  // Limitar filas si se especifica maxRows
  const displayBusinesses = maxRows ? businesses.slice(0, maxRows) : businesses;

  if (loading) {
    return (
      <div className="table-loading">
        <LoadingSpinner />
        <p>Cargando negocios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="table-error">
        <span>⚠️ {error}</span>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="table-empty">
        <div className="empty-icon">🏢</div>
        <h3>No hay negocios registrados</h3>
        <p>Los negocios aparecerán aquí una vez que sean creados.</p>
      </div>
    );
  }

  return (
    <div className={`business-table-wrapper ${compact ? 'compact' : ''}`}>
      {/* Tabla para Desktop */}
      <div className="table-container">
        <table className="business-table">
          <thead>
            <tr>
              <th>Negocio</th>
              <th>Tipo</th>
              <th>Dirección</th>
              <th>Contacto</th>
              {showActions && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {displayBusinesses.map(business => (
              <tr key={business.id} className="business-row">
                {/* Negocio */}
                <td className="business-name-cell">
                  <div className="business-info">
                    <div className="business-name">{business.name || 'Sin nombre'}</div>
                    {business.description && !compact && (
                      <div className="business-description">
                        {business.description.length > 60 
                          ? `${business.description.substring(0, 60)}...`
                          : business.description
                        }
                      </div>
                    )}
                  </div>
                </td>
                
                {/* Tipo */}
                <td className="business-type-cell">
                  <span className="business-type-badge">
                    {business.business_type || 'No especificado'}
                  </span>
                </td>
                
                {/* Dirección */}
                <td className="address-cell">
                  <div className="address-info">
                    <div className="main-address">
                      {business.address || 'No especificada'}
                    </div>
                    
                    {/* Información adicional de ubicación */}
                    <div className="address-details">
                      {business.distrito && (
                        <span className="address-tag distrito">{business.distrito}</span>
                      )}
                      {business.sector && (
                        <span className="address-tag sector">{business.sector}</span>
                      )}
                      {business.anexo && (
                        <span className="address-tag anexo">{business.anexo}</span>
                      )}
                    </div>
                  </div>
                </td>
                
                {/* Contacto */}
                <td className="contact-cell">
                  <div className="contact-info">
                    {business.phone && (
                      <div className="contact-item">
                        <span className="contact-icon">📞</span>
                        <a href={`tel:${business.phone}`} className="contact-link">
                          {business.phone}
                        </a>
                      </div>
                    )}
                    {business.email && (
                      <div className="contact-item">
                        <span className="contact-icon">✉️</span>
                        <a href={`mailto:${business.email}`} className="contact-link">
                          {business.email.length > 25 
                            ? `${business.email.substring(0, 25)}...`
                            : business.email
                          }
                        </a>
                      </div>
                    )}
                    {!business.phone && !business.email && (
                      <span className="no-contact">Sin contacto</span>
                    )}
                  </div>
                </td>
                
                {/* Acciones - Solo Editar y Eliminar */}
                {showActions && (
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        onClick={() => navigate(`/businesses/edit/${business.id}`)}
                        className="btn btn-sm btn-edit"
                        title="Editar negocio"
                      >
                        ✏️
                      </button>
                      
                      <button
                        onClick={() => handleDelete(business)}
                        className="btn btn-sm btn-delete"
                        title="Eliminar negocio"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards para móvil */}
      <div className="business-cards">
        {displayBusinesses.map(business => (
          <BusinessCard 
            key={business.id} 
            business={business} 
            onDelete={handleDelete}
            showActions={showActions}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE CARD PARA MÓVIL - Simplificado
// ============================================================================
const BusinessCard = ({ business, onDelete, showActions = true, compact = false }) => {
  const navigate = useNavigate();

  return (
    <div className={`business-card ${compact ? 'compact' : ''}`}>
      <div className="business-card-header">
        <h3 className="business-card-title">{business.name || 'Sin nombre'}</h3>
        <span className="business-card-type">
          {business.business_type || 'No especificado'}
        </span>
      </div>
      
      {business.description && !compact && (
        <div className="business-card-description">
          {business.description.length > 100 
            ? `${business.description.substring(0, 100)}...`
            : business.description
          }
        </div>
      )}
      
      <div className="business-card-details">
        {/* Dirección */}
        <div className="business-card-detail">
          <span className="detail-icon">📍</span>
          <div className="detail-content">
            <div className="detail-label">Dirección</div>
            <div className="detail-value">{business.address || 'No especificada'}</div>
            
            {/* Ubicación adicional */}
            {(business.distrito || business.sector || business.anexo) && (
              <div className="address-details">
                {business.distrito && (
                  <span className="address-tag distrito">{business.distrito}</span>
                )}
                {business.sector && (
                  <span className="address-tag sector">{business.sector}</span>
                )}
                {business.anexo && (
                  <span className="address-tag anexo">{business.anexo}</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Contacto */}
        {(business.phone || business.email) && (
          <div className="business-card-detail">
            <span className="detail-icon">📞</span>
            <div className="detail-content">
              <div className="detail-label">Contacto</div>
              <div className="detail-value">
                {business.phone && (
                  <a href={`tel:${business.phone}`}>{business.phone}</a>
                )}
                {business.phone && business.email && <br />}
                {business.email && (
                  <a href={`mailto:${business.email}`}>{business.email}</a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Acciones - Solo Editar y Eliminar */}
      {showActions && (
        <div className="business-card-actions">
          <button
            onClick={() => navigate(`/businesses/edit/${business.id}`)}
            className="btn btn-edit"
            title="Editar negocio"
          >
            ✏️ Editar
          </button>
          
          <button
            onClick={() => onDelete(business)}
            className="btn btn-delete"
            title="Eliminar negocio"
          >
            🗑️ Eliminar
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE PARA EL DASHBOARD (SIN FILTROS)
// ============================================================================
export const RecentBusinessesSection = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadRecentBusinesses();
  }, []);

  const loadRecentBusinesses = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await businessAPI.getAll({
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'DESC'
      });
      
      let businessesData = [];
      if (response.data && response.data.success) {
        businessesData = response.data.data || [];
      } else if (response.data && Array.isArray(response.data)) {
        businessesData = response.data;
      }
      
      setBusinesses(businessesData);
    } catch (error) {
      console.error('Error cargando negocios recientes:', error);
      setError('Error cargando negocios recientes');
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (businessId) => {
    try {
      await businessAPI.delete(businessId);
      setBusinesses(prev => prev.filter(business => business.id !== businessId));
      alert('Negocio eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando negocio:', error);
      alert('Error al eliminar el negocio');
    }
  };

  const handleViewAll = () => {
    navigate('/businesses');
  };

  return (
    <div className="recent-businesses-section">
      <div className="section-header">
        <h2>Negocios Recientes</h2>
        <button 
          className="view-all-btn"
          onClick={handleViewAll}
        >
          Ver todos →
        </button>
      </div>
      
      <BusinessTableBase
        businesses={businesses}
        loading={loading}
        error={error}
        onDelete={handleDelete}
        maxRows={5}
        compact={true}
        showActions={true}
      />
      
      {businesses.length > 5 && (
        <div className="show-more">
          <button 
            className="btn btn-outline"
            onClick={handleViewAll}
          >
            Ver todos los {businesses.length} negocios →
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE COMPLETO CON FILTROS (PÁGINA DEDICADA)
// ============================================================================
const BusinessTable = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [businessTypes, setBusinessTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadBusinesses();
    loadBusinessTypes();
  }, []);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await businessAPI.getAll();
      const businessesData = response.data?.data || response.data || [];
      
      if (Array.isArray(businessesData)) {
        setBusinesses(businessesData);
      } else {
        setBusinesses([]);
        setError('Los datos recibidos no tienen el formato esperado');
      }
    } catch (err) {
      console.error('Error cargando negocios:', err);
      setError(err.response?.data?.message || 'Error al cargar los negocios');
      setBusinesses([]);
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
      console.error('Error cargando tipos de negocio:', err);
      setBusinessTypes([]);
    }
  };

  const handleDelete = async (businessId) => {
    try {
      await businessAPI.delete(businessId);
      setBusinesses(prev => prev.filter(business => business.id !== businessId));
      alert('Negocio eliminado exitosamente');
    } catch (err) {
      console.error('Error eliminando negocio:', err);
      alert('Error al eliminar el negocio: ' + (err.response?.data?.message || err.message));
    }
  };

  // Filtrar negocios
  const filteredBusinesses = businesses.filter(business => {
    if (!business) return false;
    
    const matchesSearch = !searchTerm || 
      (business.name && business.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (business.address && business.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (business.distrito && business.distrito.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (business.sector && business.sector.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (business.anexo && business.anexo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || business.business_type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Paginación
  const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBusinesses = filteredBusinesses.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>📋 Lista de Negocios</h1>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="business-table-container">
      <div className="business-table-header">
        <h1>📋 Lista de Negocios</h1>
        
        <div className="business-table-actions">
          <Link to="/businesses/new" className="btn btn-primary">
            ➕ Nuevo Negocio
          </Link>
          
          <button 
            onClick={loadBusinesses}
            className="btn btn-secondary"
            disabled={loading}
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="business-table-filters">
        <div className="filter-group">
          <label htmlFor="search">🔍 Buscar:</label>
          <input
            id="search"
            type="text"
            placeholder="Buscar por nombre, dirección, distrito, sector o anexo..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="type-filter">🏢 Tipo:</label>
          <select
            id="type-filter"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
            className="type-filter"
          >
            <option value="all">Todos los tipos</option>
            {businessTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="business-table-stats">
        <p>
          📊 Mostrando {currentBusinesses.length} de {filteredBusinesses.length} negocios
          {searchTerm && ` (filtrado de ${businesses.length} total)`}
        </p>
      </div>

      {/* Tabla */}
      <BusinessTableBase
        businesses={currentBusinesses}
        loading={false}
        error={error}
        onDelete={handleDelete}
        showActions={true}
        compact={false}
      />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn btn-pagination"
          >
            ← Anterior
          </button>
          
          <span className="pagination-info">
            Página {currentPage} de {totalPages}
          </span>
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn btn-pagination"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};

export default BusinessTable;