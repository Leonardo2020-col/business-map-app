import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBusinesses } from '../../hooks/useBusinesses';
import { useFilters } from '../../hooks/useFilters';
import ServicesStatus from '../ServicesStatus/ServicesStatus';
import LoadingSpinner from '../LoadingSpinner';
import './BusinessTable.css';

// ============================================================================
// COMPONENTE PARA FILTROS
// ============================================================================
const BusinessTableFilters = ({ 
  filters, 
  setFilter, 
  clearAllFilters, 
  hasActiveFilters,
  filterStats 
}) => (
  <div className="business-table-filters">
    <div className="filter-group filter-search">
      <label htmlFor="search">🔍 Buscar:</label>
      <input
        id="search"
        type="text"
        placeholder="Buscar por nombre..."
        value={filters.search}
        onChange={(e) => setFilter('search', e.target.value)}
        className="search-input"
      />
    </div>

    <div className="filter-group">
      <label htmlFor="type-filter">🏢 Tipo:</label>
      <input
        id="type-filter"
        type="text"
        placeholder="Filtrar por tipo..."
        value={filters.type === 'all' ? '' : filters.type}
        onChange={(e) => setFilter('type', e.target.value || 'all')}
        className="filter-input"
      />
    </div>

    <div className="filter-group">
      <label htmlFor="distrito-filter">🏛️ Distrito:</label>
      <input
        id="distrito-filter"
        type="text"
        placeholder="Filtrar por distrito..."
        value={filters.distrito === 'all' ? '' : filters.distrito}
        onChange={(e) => setFilter('distrito', e.target.value || 'all')}
        className="filter-input"
      />
    </div>

    <div className="filter-group">
      <label htmlFor="sector-filter">📍 Sector:</label>
      <input
        id="sector-filter"
        type="text"
        placeholder="Filtrar por sector..."
        value={filters.sector === 'all' ? '' : filters.sector}
        onChange={(e) => setFilter('sector', e.target.value || 'all')}
        className="filter-input"
      />
    </div>

    <div className="filter-group">
      <label htmlFor="anexo-filter">🏘️ Anexo:</label>
      <input
        id="anexo-filter"
        type="text"
        placeholder="Filtrar por anexo..."
        value={filters.anexo === 'all' ? '' : filters.anexo}
        onChange={(e) => setFilter('anexo', e.target.value || 'all')}
        className="filter-input"
      />
    </div>

    <div className="filter-group">
      <label htmlFor="service-filter">📋 Servicios:</label>
      <select
        id="service-filter"
        value={filters.service}
        onChange={(e) => setFilter('service', e.target.value)}
        className="filter-input"
      >
        <option value="all">Todos</option>
        <option value="issues">Con problemas</option>
        <option value="ok">Todo al día</option>
      </select>
    </div>

    <div className="filter-group filter-clear">
      <button
        onClick={clearAllFilters}
        className="btn btn-secondary"
        title="Limpiar todos los filtros"
        disabled={!hasActiveFilters}
      >
        🧹 Limpiar filtros
      </button>
    </div>
  </div>
);

// ============================================================================
// COMPONENTE PARA ESTADÍSTICAS DE FILTROS
// ============================================================================
const FilterStats = ({ filterStats, activeFilters }) => (
  <div className="business-table-stats">
    <p>
      📊 Mostrando {filterStats.filtered} de {filterStats.total} negocios
      {filterStats.hidden > 0 && ` (${filterStats.hidden} ocultos por filtros)`}
    </p>
    
    {activeFilters.length > 0 && (
      <div className="active-filters">
        {activeFilters.map((filter, index) => (
          <span key={index} className="active-filter">
            {filter.label}
          </span>
        ))}
      </div>
    )}
  </div>
);

// ============================================================================
// COMPONENTE CARD PARA MÓVIL
// ============================================================================
const BusinessCard = ({ 
  business, 
  onDelete, 
  showActions = true, 
  compact = false, 
  showServices = true 
}) => {
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
        <AddressInfo business={business} />
        <ContactInfo business={business} />
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
// COMPONENTES HELPER PARA INFORMACIÓN
// ============================================================================
const AddressInfo = ({ business }) => (
  <div className="business-card-detail">
    <span className="detail-icon">📍</span>
    <div className="detail-content">
      <div className="detail-label">Dirección</div>
      <div className="detail-value">
        {business.address && (
          <div className="address-item">
            <span className="address-label">📍 Dirección:</span>
            <span className="address-value">{business.address}</span>
          </div>
        )}
        
        {business.distrito && (
          <div className="address-item">
            <span className="address-label">🏛️ Distrito:</span>
            <span className="address-value">{business.distrito}</span>
          </div>
        )}
        
        {business.sector && (
          <div className="address-item">
            <span className="address-label">📍 Sector:</span>
            <span className="address-value">{business.sector}</span>
          </div>
        )}
        
        {business.anexo && (
          <div className="address-item">
            <span className="address-label">🏘️ Anexo:</span>
            <span className="address-value">{business.anexo}</span>
          </div>
        )}
        
        {!business.address && !business.distrito && !business.sector && !business.anexo && (
          <span className="no-address">No especificada</span>
        )}
      </div>
    </div>
  </div>
);

const ContactInfo = ({ business }) => {
  if (!business.phone && !business.email) return null;

  return (
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
  );
};

// ============================================================================
// COMPONENTE BASE DE TABLA
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
    
    try {
      await onDelete(business.id);
      // El hook se encarga de actualizar la lista
    } catch (error) {
      alert('Error al eliminar el negocio: ' + error.message);
    }
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
              <BusinessTableRow
                key={business.id}
                business={business}
                onEdit={() => navigate(`/businesses/edit/${business.id}`)}
                onDelete={() => handleDelete(business)}
                showActions={showActions}
                showServices={showServices}
                compact={compact}
              />
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
// COMPONENTE FILA DE TABLA
// ============================================================================
const BusinessTableRow = ({ 
  business, 
  onEdit, 
  onDelete, 
  showActions, 
  showServices, 
  compact 
}) => (
  <tr className="business-row">
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
        {business.address && (
          <div className="address-item">
            <span className="address-label">📍 Dirección:</span>
            <span className="address-value">{business.address}</span>
          </div>
        )}
        
        {business.distrito && (
          <div className="address-item">
            <span className="address-label">🏛️ Distrito:</span>
            <span className="address-value">{business.distrito}</span>
          </div>
        )}
        
        {business.sector && (
          <div className="address-item">
            <span className="address-label">📍 Sector:</span>
            <span className="address-value">{business.sector}</span>
          </div>
        )}
        
        {business.anexo && (
          <div className="address-item">
            <span className="address-label">🏘️ Anexo:</span>
            <span className="address-value">{business.anexo}</span>
          </div>
        )}
        
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
    
    {/* Servicios */}
    {showServices && (
      <td className="services-cell">
        <ServicesStatus business={business} compact={compact} />
      </td>
    )}
    
    {/* Acciones */}
    {showActions && (
      <td className="actions-cell">
        <div className="action-buttons">
          <button
            onClick={onEdit}
            className="btn btn-sm btn-edit"
            title="Editar negocio"
          >
            ✏️
          </button>
          
          <button
            onClick={onDelete}
            className="btn btn-sm btn-delete"
            title="Eliminar negocio"
          >
            🗑️
          </button>
        </div>
      </td>
    )}
  </tr>
);

// ============================================================================
// COMPONENTE PARA EL DASHBOARD (SIN FILTROS)
// ============================================================================
export const RecentBusinessesSection = () => {
  const { 
    businesses, 
    loading, 
    error, 
    deleteBusiness 
  } = useBusinesses({
    initialFilters: { limit: 10 },
    loadOnMount: true
  });

  const navigate = useNavigate();

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
        onDelete={deleteBusiness}
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
// COMPONENTE PRINCIPAL CON FILTROS (PÁGINA DEDICADA)
// ============================================================================
const BusinessTable = () => {
  const { 
    businesses, 
    loading, 
    error, 
    deleteBusiness,
    loadBusinesses 
  } = useBusinesses();

  const {
    filters,
    filteredData: filteredBusinesses,
    filterStats,
    activeFilters,
    hasActiveFilters,
    setFilter,
    clearAllFilters
  } = useFilters(businesses);

  // Paginación local para datos filtrados
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(10);

  const paginatedBusinesses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredBusinesses.slice(startIndex, endIndex);
  }, [filteredBusinesses, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Reset página cuando cambien los filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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

      {/* Filtros */}
      <BusinessTableFilters
        filters={filters}
        setFilter={setFilter}
        clearAllFilters={clearAllFilters}
        hasActiveFilters={hasActiveFilters}
        filterStats={filterStats}
      />

      {/* Estadísticas */}
      <FilterStats 
        filterStats={filterStats}
        activeFilters={activeFilters}
      />

      {/* Tabla */}
      <BusinessTableBase
        businesses={paginatedBusinesses}
        loading={false}
        error={error}
        onDelete={deleteBusiness}
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