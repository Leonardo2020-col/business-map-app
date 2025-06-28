import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBusinesses } from '../../hooks/useBusinesses';
import { useFilters } from '../../hooks/useFilters';
import { useAuth } from '../../contexts/AuthContext'; // ✅ AGREGAR IMPORT
import ServicesStatus from '../ServicesStatus/ServicesStatus';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import './BusinessTable.css';

// ✅ HOOK HELPER PARA PERMISOS
const usePermissions = () => {
  const { user } = useAuth();

  // ✅ AGREGAR LOG PARA VERIFICAR QUE SE EJECUTA
  React.useEffect(() => {
    console.log('🎯 usePermissions ejecutándose con usuario:', {
      user: user ? {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      } : null
    });
  }, [user]);

  const hasPermission = (permission) => {
    if (!user) {
      console.log('❌ hasPermission: No user for permission:', permission);
      return false;
    }
    if (user.role === 'admin') {
      console.log('✅ hasPermission: Admin has all permissions:', permission);
      return true;
    }
    
    const result = user.permissions?.includes(permission) || false;
    console.log('🔍 hasPermission check:', {
      permission,
      userPermissions: user.permissions,
      result
    });
    
    return result;
  };

  const canEditBusiness = (business) => {
    if (!user) {
      console.log('❌ canEditBusiness: No user');
      return false;
    }
    if (user.role === 'admin') {
      console.log('✅ canEditBusiness: User is admin');
      return true;
    }
    
    // Necesita permiso de editar Y ser propietario
    const hasEditPermission = hasPermission('business:edit');
    const isOwner = String(business.created_by) === String(user.id); // ✅ CONVERTIR A STRING PARA COMPARAR
    
    console.log('🔍 canEditBusiness debug:', {
      business: business.name,
      businessId: business.id,
      businessCreatedBy: business.created_by,
      businessCreatedByType: typeof business.created_by,
      userId: user.id,
      userIdType: typeof user.id,
      userRole: user.role,
      userPermissions: user.permissions,
      hasEditPermission,
      isOwner,
      result: hasEditPermission && isOwner
    });
    
    return hasEditPermission && isOwner;
  };

  const canDeleteBusiness = (business) => {
    if (!user) {
      console.log('❌ canDeleteBusiness: No user');
      return false;
    }
    if (user.role === 'admin') {
      console.log('✅ canDeleteBusiness: User is admin');
      return true;
    }
    
    // Necesita permiso de eliminar Y ser propietario
    const hasDeletePermission = hasPermission('business:delete');
    const isOwner = String(business.created_by) === String(user.id); // ✅ CONVERTIR A STRING PARA COMPARAR
    
    console.log('🔍 canDeleteBusiness debug:', {
      business: business.name,
      businessId: business.id,
      businessCreatedBy: business.created_by,
      businessCreatedByType: typeof business.created_by,
      userId: user.id,
      userIdType: typeof user.id,
      userRole: user.role,
      userPermissions: user.permissions,
      hasDeletePermission,
      isOwner,
      result: hasDeletePermission && isOwner
    });
    
    return hasDeletePermission && isOwner;
  };

  const canCreateBusiness = () => {
    return hasPermission('business:create');
  };

  const canViewBusinesses = () => {
    return hasPermission('business:read');
  };

  return {
    hasPermission,
    canEditBusiness,
    canDeleteBusiness,
    canCreateBusiness,
    canViewBusinesses,
    user
  };
};

// ============================================================================
// COMPONENTE PARA FILTROS (SIN CAMBIOS)
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
// COMPONENTE PARA ESTADÍSTICAS DE FILTROS (SIN CAMBIOS)
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
// COMPONENTE CARD PARA MÓVIL - ✅ CON PERMISOS
// ============================================================================
const BusinessCard = ({ 
  business, 
  onDelete, 
  showActions = true, 
  compact = false, 
  showServices = true 
}) => {
  const navigate = useNavigate();
  const permissions = usePermissions(); // ✅ USAR PERMISOS

  // ✅ VERIFICAR PERMISOS PARA CADA ACCIÓN
  const canEdit = permissions.canEditBusiness(business);
  const canDelete = permissions.canDeleteBusiness(business);
  const canView = permissions.canViewBusinesses();

  // ✅ GENERAR TOOLTIPS INFORMATIVOS
  const getEditTooltip = () => {
    if (canEdit) return "Editar negocio";
    if (!permissions.hasPermission('business:edit')) return "Sin permiso de edición";
    if (String(business.created_by) !== String(permissions.user?.id)) return "Solo puedes editar negocios que creaste";
    return "No puedes editar este negocio";
  };

  const getDeleteTooltip = () => {
    if (canDelete) return "Eliminar negocio";
    if (!permissions.hasPermission('business:delete')) return "Sin permiso de eliminación";
    if (String(business.created_by) !== String(permissions.user?.id)) return "Solo puedes eliminar negocios que creaste";
    return "No puedes eliminar este negocio";
  };

  console.log('🔍 BusinessCard permisos DETALLADO:', {
    businessName: business.name,
    businessId: business.id,
    businessCreatedBy: business.created_by,
    currentUser: permissions.user?.username,
    currentUserId: permissions.user?.id,
    currentUserRole: permissions.user?.role,
    currentUserPermissions: permissions.user?.permissions,
    canEdit,
    canDelete,
    canView,
    isOwner: business.created_by === permissions.user?.id
  });

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
      
      {/* ✅ MOSTRAR ACCIONES SIEMPRE, PERO HABILITADAS/DESHABILITADAS SEGÚN PERMISOS */}
      {showActions && (
        <div className="business-card-actions">
          <button
            onClick={canEdit ? () => navigate(`/businesses/edit/${business.id}`) : undefined}
            className={`btn btn-edit ${!canEdit ? 'disabled' : ''}`}
            disabled={!canEdit}
            title={getEditTooltip()}
          >
            ✏️ Editar
          </button>
          
          <button
            onClick={canDelete ? () => onDelete(business) : undefined}
            className={`btn btn-delete ${!canDelete ? 'disabled' : ''}`}
            disabled={!canDelete}
            title={getDeleteTooltip()}
          >
            🗑️ Eliminar
          </button>
          
          <button
            onClick={canView ? () => navigate(`/businesses/${business.id}`) : undefined}
            className={`btn btn-sm ${!canView ? 'disabled' : ''}`}
            disabled={!canView}
            style={{ 
              background: canView ? '#17a2b8' : '#6c757d', 
              color: 'white' 
            }}
            title={canView ? "Ver detalles" : "Sin permiso de lectura"}
          >
            👁️ Ver
          </button>
        </div>
      )}

      {/* ✅ DEBUG INFO EN DESARROLLO */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          fontSize: '10px',
          color: '#666',
          marginTop: '8px',
          padding: '4px',
          background: '#f8f9fa',
          borderRadius: '4px',
          border: '1px solid #e9ecef'
        }}>
          <strong>Debug Permisos:</strong><br/>
          Usuario: {permissions.user?.username} ({permissions.user?.role})<br/>
          Permisos: {permissions.user?.permissions?.join(', ') || 'Ninguno'}<br/>
          Propietario: {String(business.created_by) === String(permissions.user?.id) ? 'Sí' : 'No'}<br/>
          Puede editar: {canEdit ? 'Sí' : 'No'}<br/>
          Puede eliminar: {canDelete ? 'Sí' : 'No'}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTES HELPER PARA INFORMACIÓN (SIN CAMBIOS)
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
// COMPONENTE BASE DE TABLA - ✅ CON PERMISOS
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
  const permissions = usePermissions(); // ✅ USAR PERMISOS

  // ✅ VERIFICAR SI PUEDE VER NEGOCIOS
  if (!permissions.canViewBusinesses()) {
    return (
      <div className="table-empty">
        <div className="empty-icon">🚫</div>
        <h3>Acceso Denegado</h3>
        <p>No tienes permisos para ver la lista de negocios.</p>
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '15px',
          margin: '20px 0',
          textAlign: 'left'
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
            <strong>Permisos necesarios:</strong> business:read<br/>
            <strong>Tus permisos:</strong> {permissions.user?.permissions?.join(', ') || 'Ninguno'}
          </p>
        </div>
      </div>
    );
  }

  const handleDelete = async (business) => {
    if (!onDelete) return;
    
    // ✅ VERIFICAR PERMISOS ANTES DE ELIMINAR
    if (!permissions.canDeleteBusiness(business)) {
      alert('No tienes permisos para eliminar este negocio');
      return;
    }
    
    if (!window.confirm(`¿Estás seguro de que quieres eliminar "${business.name}"?`)) {
      return;
    }
    
    try {
      await onDelete(business.id);
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
        {permissions.canCreateBusiness() && (
          <Link to="/businesses/new" className="btn btn-primary" style={{ marginTop: '15px' }}>
            ➕ Crear primer negocio
          </Link>
        )}
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
                permissions={permissions} // ✅ PASAR PERMISOS
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
// COMPONENTE FILA DE TABLA - ✅ CON PERMISOS
// ============================================================================
const BusinessTableRow = ({ 
  business, 
  onEdit, 
  onDelete, 
  showActions, 
  showServices, 
  compact,
  permissions // ✅ RECIBIR PERMISOS
}) => {
  // ✅ VERIFICAR PERMISOS PARA ACCIONES
  const canEdit = permissions.canEditBusiness(business);
  const canDelete = permissions.canDeleteBusiness(business);
  const canView = permissions.canViewBusinesses();

  // ✅ GENERAR TOOLTIPS INFORMATIVOS
  const getEditTooltip = () => {
    if (canEdit) return "Editar negocio";
    if (!permissions.hasPermission('business:edit')) return "Sin permiso de edición";
    if (business.created_by !== permissions.user?.id) return "Solo puedes editar negocios que creaste";
    return "No puedes editar este negocio";
  };

  const getDeleteTooltip = () => {
    if (canDelete) return "Eliminar negocio";
    if (!permissions.hasPermission('business:delete')) return "Sin permiso de eliminación";
    if (business.created_by !== permissions.user?.id) return "Solo puedes eliminar negocios que creaste";
    return "No puedes eliminar este negocio";
  };

  return (
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
      
      {/* ✅ ACCIONES SIEMPRE VISIBLES, HABILITADAS/DESHABILITADAS SEGÚN PERMISOS */}
      {showActions && (
        <td className="actions-cell">
          <div className="action-buttons">
            <button
              onClick={canEdit ? onEdit : undefined}
              className={`btn btn-sm btn-edit ${!canEdit ? 'disabled' : ''}`}
              disabled={!canEdit}
              title={getEditTooltip()}
            >
              ✏️
            </button>
            
            <button
              onClick={canDelete ? onDelete : undefined}
              className={`btn btn-sm btn-delete ${!canDelete ? 'disabled' : ''}`}
              disabled={!canDelete}
              title={getDeleteTooltip()}
            >
              🗑️
            </button>
            
            <button
              onClick={canView ? () => window.open(`/businesses/${business.id}`, '_blank') : undefined}
              className={`btn btn-sm ${!canView ? 'disabled' : ''}`}
              disabled={!canView}
              style={{ 
                background: canView ? '#17a2b8' : '#6c757d', 
                color: 'white' 
              }}
              title={canView ? "Ver detalles" : "Sin permiso de lectura"}
            >
              👁️
            </button>
          </div>
          
          {/* ✅ DEBUG EN DESARROLLO - MEJORADO */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{
              fontSize: '9px',
              color: '#666',
              marginTop: '2px',
              textAlign: 'center'
            }}>
              E:{canEdit ? '✅' : '❌'} D:{canDelete ? '✅' : '❌'} 
              O:{String(business.created_by) === String(permissions.user?.id) ? '✅' : '❌'}
              <br />
              <small style={{ fontSize: '8px' }}>
                {!canEdit && permissions.hasPermission('business:edit') && 'No propietario'}
                {!canEdit && !permissions.hasPermission('business:edit') && 'Sin permiso editar'}
              </small>
            </div>
          )}
        </td>
      )}
    </tr>
  );
};

// ============================================================================
// COMPONENTE PARA EL DASHBOARD (SIN FILTROS) - ✅ CON PERMISOS
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
  const permissions = usePermissions(); // ✅ USAR PERMISOS

  const handleViewAll = () => {
    navigate('/businesses');
  };

  // ✅ VERIFICAR PERMISOS PARA VER NEGOCIOS
  if (!permissions.canViewBusinesses()) {
    return (
      <div className="recent-businesses-section">
        <div className="section-header">
          <h2>Negocios Recientes</h2>
        </div>
        
        <div className="table-empty">
          <div className="empty-icon">🚫</div>
          <h3>Sin permisos para ver negocios</h3>
          <p>Necesitas el permiso "business:read" para ver la lista de negocios.</p>
        </div>
      </div>
    );
  }

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
// COMPONENTE PRINCIPAL CON FILTROS (PÁGINA DEDICADA) - ✅ CON PERMISOS
// ============================================================================
const BusinessTable = () => {
  const permissions = usePermissions(); // ✅ USAR PERMISOS
  
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
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

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

  // ✅ VERIFICAR PERMISOS PARA VER NEGOCIOS
  if (!permissions.canViewBusinesses()) {
    return (
      <div className="business-table-container">
        <div className="business-table-header">
          <h1>📋 Lista de Negocios</h1>
        </div>
        
        <div className="table-empty">
          <div className="empty-icon">🚫</div>
          <h3>Acceso Denegado</h3>
          <p>No tienes permisos para ver la lista de negocios.</p>
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            padding: '15px',
            margin: '20px 0',
            textAlign: 'left'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
              <strong>Permisos necesarios:</strong> business:read<br/>
              <strong>Tus permisos:</strong> {permissions.user?.permissions?.join(', ') || 'Ninguno'}<br/>
              <strong>Contacta al administrador</strong> para obtener permisos de lectura de negocios.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          {/* ✅ BOTÓN CREAR SOLO SI TIENE PERMISOS */}
          {permissions.canCreateBusiness() && (
            <Link to="/businesses/new" className="btn btn-primary">
              ➕ Nuevo Negocio
            </Link>
          )}
          
          <button 
            onClick={loadBusinesses}
            className="btn btn-secondary"
            disabled={loading}
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* ✅ MOSTRAR INFO DE PERMISOS EN DESARROLLO */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          background: '#e3f2fd',
          border: '1px solid #90caf9',
          borderRadius: '8px',
          padding: '10px',
          margin: '0 0 20px 0',
          fontSize: '13px'
        }}>
          <strong>Debug Permisos:</strong> Usuario: {permissions.user?.username} | 
          Permisos: {permissions.user?.permissions?.join(', ') || 'Ninguno'} | 
          Crear: {permissions.canCreateBusiness() ? '✅' : '❌'}
        </div>
      )}

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

      {/* Tabla principal */}
      <BusinessTableBase
        businesses={paginatedBusinesses}
        loading={loading}
        error={error}
        onDelete={deleteBusiness}
        showActions={true}
        compact={false}
        showServices={true}
      />

      {/* ✅ PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="business-table-pagination">
          <div className="pagination-info">
            <span>
              Página {currentPage} de {totalPages} 
              ({filteredBusinesses.length} resultados)
            </span>
          </div>
          
          <div className="pagination-controls">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-sm btn-secondary"
            >
              ← Anterior
            </button>
            
            {/* Números de página */}
            <div className="pagination-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-sm btn-secondary"
            >
              Siguiente →
            </button>
          </div>
          
          {/* Selector de elementos por página */}
          <div className="pagination-size">
            <label htmlFor="items-per-page">Mostrar:</label>
            <select
              id="items-per-page"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="pagination-select"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}

      {/* ✅ ACCIONES ADICIONALES */}
      <div className="business-table-footer">
        {filteredBusinesses.length > 0 && (
          <div className="table-summary">
            <p>
              📊 Total: {filteredBusinesses.length} negocios
              {filterStats.hidden > 0 && ` (${filterStats.hidden} filtrados)`}
            </p>
          </div>
        )}
        
        {/* ✅ BOTONES DE ACCIÓN MASIVA (solo para admins) */}
        {permissions.user?.role === 'admin' && filteredBusinesses.length > 0 && (
          <div className="bulk-actions">
            <button
              onClick={() => {
                const csvContent = generateCSV(filteredBusinesses);
                downloadCSV(csvContent, 'negocios.csv');
              }}
              className="btn btn-outline"
              title="Exportar datos filtrados a CSV"
            >
              📊 Exportar CSV
            </button>
            
            <button
              onClick={() => window.print()}
              className="btn btn-outline"
              title="Imprimir lista"
            >
              🖨️ Imprimir
            </button>
          </div>
        )}
      </div>

      {/* ✅ MOSTRAR MENSAJE DE AYUDA SI NO HAY RESULTADOS DESPUÉS DE FILTRAR */}
      {filteredBusinesses.length === 0 && businesses.length > 0 && (
        <div className="table-empty">
          <div className="empty-icon">🔍</div>
          <h3>No se encontraron resultados</h3>
          <p>No hay negocios que coincidan con los filtros aplicados.</p>
          <button
            onClick={clearAllFilters}
            className="btn btn-primary"
            style={{ marginTop: '15px' }}
          >
            🧹 Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// FUNCIONES HELPER PARA EXPORTACIÓN (solo para admins)
// ============================================================================
const generateCSV = (businesses) => {
  const headers = [
    'Nombre',
    'Tipo',
    'Descripción',
    'Dirección',
    'Distrito',
    'Sector',
    'Anexo',
    'Teléfono',
    'Email',
    'Fecha Creación'
  ];
  
  const rows = businesses.map(business => [
    business.name || '',
    business.business_type || '',
    business.description || '',
    business.address || '',
    business.distrito || '',
    business.sector || '',
    business.anexo || '',
    business.phone || '',
    business.email || '',
    business.created_at ? new Date(business.created_at).toLocaleDateString() : ''
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
    
  return csvContent;
};

const downloadCSV = (content, filename) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }//
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================
export default BusinessTable;