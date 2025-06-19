import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { businessAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import './BusinessTable.css';

// ============================================================================
// FUNCIONES UTILITARIAS PARA FECHAS
// ============================================================================
const isExpired = (dateString) => {
  if (!dateString) return false;
  const expiryDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiryDate < today;
};

const isExpiringSoon = (dateString) => {
  if (!dateString) return false;
  const expiryDate = new Date(dateString);
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
  return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-PE');
};

// ============================================================================
// COMPONENTE PARA MOSTRAR SERVICIOS
// ============================================================================
const ServicesStatus = ({ business, compact = false }) => {
  const services = [
    { key: 'defensa_civil_expiry', name: 'Defensa Civil', icon: '🚨' },
    { key: 'extintores_expiry', name: 'Extintores', icon: '🧯' },
    { key: 'fumigacion_expiry', name: 'Fumigación', icon: '🦟' },
    { key: 'pozo_tierra_expiry', name: 'Pozo a Tierra', icon: '⚡' },
    { key: 'publicidad_expiry', name: 'Publicidad', icon: '📢' }
  ];

  const getServiceStatus = (dateString) => {
    if (!dateString) return 'no-date';
    if (isExpired(dateString)) return 'expired';
    if (isExpiringSoon(dateString)) return 'expiring-soon';
    return 'valid';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'expired': return '🔴';
      case 'expiring-soon': return '🟡';
      case 'valid': return '🟢';
      default: return '⚪';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'expired': return 'Vencido';
      case 'expiring-soon': return 'Vence pronto';
      case 'valid': return 'Vigente';
      default: return 'Sin fecha';
    }
  };

  if (compact) {
    // Vista compacta - solo mostrar servicios con problemas
    const problematicServices = services.filter(service => {
      const status = getServiceStatus(business[service.key]);
      return status === 'expired' || status === 'expiring-soon';
    });

    if (problematicServices.length === 0) {
      return <span className="services-status-ok">✅ Todo al día</span>;
    }

    return (
      <div className="services-status-compact">
        {problematicServices.map(service => {
          const status = getServiceStatus(business[service.key]);
          return (
            <span 
              key={service.key} 
              className={`service-badge ${status}`}
              title={`${service.name}: ${formatDate(business[service.key])} - ${getStatusText(status)}`}
            >
              {service.icon} {getStatusIcon(status)}
            </span>
          );
        })}
      </div>
    );
  }

  // Vista completa
  return (
    <div className="services-status">
      {services.map(service => {
        const status = getServiceStatus(business[service.key]);
        const dateValue = business[service.key];
        
        return (
          <div key={service.key} className={`service-item ${status}`}>
            <span className="service-icon">{service.icon}</span>
            <div className="service-info">
              <span className="service-name">{service.name}</span>
              {dateValue && (
                <span className="service-date">
                  {formatDate(dateValue)}
                </span>
              )}
              <span className={`service-status ${status}`}>
                {getStatusIcon(status)} {getStatusText(status)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// COMPONENTE BASE DE TABLA - Con servicios
// ============================================================================
const BusinessTableBase = ({ 
  businesses = [], 
  loading = false, 
  error = null, 
  onDelete = null,
  showActions = true,
  maxRows = null,
  compact = false,
  showServices = true
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
              {showServices && <th>Servicios</th>}
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
                    {/* Dirección principal */}
                    {business.address && (
                      <div className="address-item">
                        <span className="address-label">📍 Dirección:</span>
                        <span className="address-value">{business.address}</span>
                      </div>
                    )}
                    
                    {/* Distrito */}
                    {business.distrito && (
                      <div className="address-item">
                        <span className="address-label">🏛️ Distrito:</span>
                        <span className="address-value">{business.distrito}</span>
                      </div>
                    )}
                    
                    {/* Sector */}
                    {business.sector && (
                      <div className="address-item">
                        <span className="address-label">📍 Sector:</span>
                        <span className="address-value">{business.sector}</span>
                      </div>
                    )}
                    
                    {/* Anexo */}
                    {business.anexo && (
                      <div className="address-item">
                        <span className="address-label">🏘️ Anexo:</span>
                        <span className="address-value">{business.anexo}</span>
                      </div>
                    )}
                    
                    {/* Si no hay ninguna dirección */}
                    {!business.address && !business.distrito && !business.sector && !business.anexo && (
                      <span className="no-address">No especificada</span>
                    )}
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
                
                {/* NUEVA COLUMNA - Servicios */}
                {showServices && (
                  <td className="services-cell">
                    <ServicesStatus business={business} compact={compact} />
                  </td>
                )}
                
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
            showServices={showServices}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE CARD PARA MÓVIL - Con servicios
// ============================================================================
const BusinessCard = ({ business, onDelete, showActions = true, compact = false, showServices = true }) => {
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
            <div className="detail-value">
              {/* Dirección principal */}
              {business.address && (
                <div className="address-item">
                  <span className="address-label">📍 Dirección:</span>
                  <span className="address-value">{business.address}</span>
                </div>
              )}
              
              {/* Distrito */}
              {business.distrito && (
                <div className="address-item">
                  <span className="address-label">🏛️ Distrito:</span>
                  <span className="address-value">{business.distrito}</span>
                </div>
              )}
              
              {/* Sector */}
              {business.sector && (
                <div className="address-item">
                  <span className="address-label">📍 Sector:</span>
                  <span className="address-value">{business.sector}</span>
                </div>
              )}
              
              {/* Anexo */}
              {business.anexo && (
                <div className="address-item">
                  <span className="address-label">🏘️ Anexo:</span>
                  <span className="address-value">{business.anexo}</span>
                </div>
              )}
              
              {/* Si no hay ninguna dirección */}
              {!business.address && !business.distrito && !business.sector && !business.anexo && (
                <span className="no-address">No especificada</span>
              )}
            </div>
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

        {/* NUEVA SECCIÓN - Servicios en móvil */}
        {showServices && (
          <div className="business-card-detail">
            <span className="detail-icon">📋</span>
            <div className="detail-content">
              <div className="detail-label">Estado de Servicios</div>
              <div className="detail-value">
                <ServicesStatus business={business} compact={true} />
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
        showServices={true}
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
  const [filterDistrito, setFilterDistrito] = useState('all');
  const [filterSector, setFilterSector] = useState('all');
  const [filterAnexo, setFilterAnexo] = useState('all');
  const [filterService, setFilterService] = useState('all'); // NUEVO FILTRO
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

  // FUNCIÓN PARA VERIFICAR ESTADO DE SERVICIOS
  const hasServiceIssues = (business) => {
    const services = ['defensa_civil_expiry', 'extintores_expiry', 'fumigacion_expiry', 'pozo_tierra_expiry', 'publicidad_expiry'];
    return services.some(service => {
      const dateValue = business[service];
      return dateValue && (isExpired(dateValue) || isExpiringSoon(dateValue));
    });
  };

  // Filtrar negocios
  const filteredBusinesses = businesses.filter(business => {
    if (!business) return false;
    
    const matchesSearch = !searchTerm || 
      (business.name && business.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (business.address && business.address.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || 
      (business.business_type && business.business_type.toLowerCase().includes(filterType.toLowerCase()));
    
    const matchesDistrito = filterDistrito === 'all' || 
      (business.distrito && business.distrito.toLowerCase().includes(filterDistrito.toLowerCase()));
    
    const matchesSector = filterSector === 'all' || 
      (business.sector && business.sector.toLowerCase().includes(filterSector.toLowerCase()));
    
    const matchesAnexo = filterAnexo === 'all' || 
      (business.anexo && business.anexo.toLowerCase().includes(filterAnexo.toLowerCase()));
    
    // NUEVO FILTRO POR SERVICIOS
    const matchesService = filterService === 'all' || 
      (filterService === 'issues' && hasServiceIssues(business)) ||
      (filterService === 'ok' && !hasServiceIssues(business));
    
    return matchesSearch && matchesType && matchesDistrito && matchesSector && matchesAnexo && matchesService;
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
        <div className="filter-group filter-search">
          <label htmlFor="search">🔍 Buscar:</label>
          <input
            id="search"
            type="text"
            placeholder="Buscar por nombre..."
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
          <input
            id="type-filter"
            type="text"
            placeholder="Filtrar por tipo..."
            value={filterType === 'all' ? '' : filterType}
            onChange={(e) => {
              setFilterType(e.target.value || 'all');
              setCurrentPage(1);
            }}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="distrito-filter">🏛️ Distrito:</label>
          <input
            id="distrito-filter"
            type="text"
            placeholder="Filtrar por distrito..."
            value={filterDistrito === 'all' ? '' : filterDistrito}
            onChange={(e) => {
              setFilterDistrito(e.target.value || 'all');
              setCurrentPage(1);
            }}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="sector-filter">📍 Sector:</label>
          <input
            id="sector-filter"
            type="text"
            placeholder="Filtrar por sector..."
            value={filterSector === 'all' ? '' : filterSector}
            onChange={(e) => {
              setFilterSector(e.target.value || 'all');
              setCurrentPage(1);
            }}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="anexo-filter">🏘️ Anexo:</label>
          <input
            id="anexo-filter"
            type="text"
            placeholder="Filtrar por anexo..."
            value={filterAnexo === 'all' ? '' : filterAnexo}
            onChange={(e) => {
              setFilterAnexo(e.target.value || 'all');
              setCurrentPage(1);
            }}
            className="filter-input"
          />
        </div>

        {/* NUEVO FILTRO POR SERVICIOS */}
        <div className="filter-group">
          <label htmlFor="service-filter">📋 Servicios:</label>
          <select
            id="service-filter"
            value={filterService}
            onChange={(e) => {
              setFilterService(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-input"
          >
            <option value="all">Todos</option>
            <option value="issues">Con problemas</option>
            <option value="ok">Todo al día</option>
          </select>
        </div>

        {/* Botón para limpiar filtros */}
        <div className="filter-group filter-clear">
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('all');
              setFilterDistrito('all');
              setFilterSector('all');
              setFilterAnexo('all');
              setFilterService('all');
              setCurrentPage(1);
            }}
            className="btn btn-secondary"
            title="Limpiar todos los filtros"
          >
            🧹 Limpiar filtros
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="business-table-stats">
        <p>
          📊 Mostrando {currentBusinesses.length} de {filteredBusinesses.length} negocios
          {(searchTerm || filterType !== 'all' || filterDistrito !== 'all' || filterSector !== 'all' || filterAnexo !== 'all' || filterService !== 'all') && 
            ` (filtrado de ${businesses.length} total)`
          }
        </p>
        
        {/* Mostrar filtros activos */}
        <div className="active-filters">
          {searchTerm && (
            <span className="active-filter">
              🔍 Búsqueda: "{searchTerm}"
            </span>
          )}
          {filterType !== 'all' && (
            <span className="active-filter">
              🏢 Tipo: {filterType}
            </span>
          )}
          {filterDistrito !== 'all' && (
            <span className="active-filter">
              🏛️ Distrito: {filterDistrito}
            </span>
          )}
          {filterSector !== 'all' && (
            <span className="active-filter">
              📍 Sector: {filterSector}
            </span>
          )}
          {filterAnexo !== 'all' && (
            <span className="active-filter">
              🏘️ Anexo: {filterAnexo}
            </span>
          )}
          {filterService !== 'all' && (
            <span className="active-filter">
              📋 Servicios: {filterService === 'issues' ? 'Con problemas' : 'Todo al día'}
            </span>
          )}
        </div>
      </div>

      {/* Tabla */}
      <BusinessTableBase
        businesses={currentBusinesses}
        loading={false}
        error={error}
        onDelete={handleDelete}
        showActions={true}
        compact={false}
        showServices={true}
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