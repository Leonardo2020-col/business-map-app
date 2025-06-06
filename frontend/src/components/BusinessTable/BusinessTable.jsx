import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { businessAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import './BusinessTable.css';

const BusinessTable = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [businessTypes, setBusinessTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const navigate = useNavigate();

  // Cargar datos cuando el componente se monta
  useEffect(() => {
    loadBusinesses();
    loadBusinessTypes();
  }, []);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Cargando lista de negocios...');
      const response = await businessAPI.getAll();
      
      console.log('✅ Negocios cargados:', response.data);
      
      // Asegurarse de que data es un array
      const businessesData = response.data?.data || response.data || [];
      
      if (Array.isArray(businessesData)) {
        setBusinesses(businessesData);
      } else {
        console.warn('⚠️ Los datos no son un array:', businessesData);
        setBusinesses([]);
        setError('Los datos recibidos no tienen el formato esperado');
      }
      
    } catch (err) {
      console.error('❌ Error cargando negocios:', err);
      setError(err.response?.data?.message || 'Error al cargar los negocios');
      setBusinesses([]); // Asegurar que businesses sea un array vacío
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
      console.error('❌ Error cargando tipos de negocio:', err);
      setBusinessTypes([]);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este negocio?')) {
      return;
    }

    try {
      await businessAPI.delete(id);
      console.log('✅ Negocio eliminado:', id);
      
      // Actualizar la lista local
      setBusinesses(prev => prev.filter(business => business.id !== id));
      
      // Mostrar mensaje de éxito (puedes usar un toast aquí)
      alert('Negocio eliminado exitosamente');
      
    } catch (err) {
      console.error('❌ Error eliminando negocio:', err);
      alert('Error al eliminar el negocio: ' + (err.response?.data?.message || err.message));
    }
  };

  // Filtrar negocios según búsqueda y tipo
  const filteredBusinesses = businesses.filter(business => {
    if (!business) return false;
    
    const matchesSearch = !searchTerm || 
      (business.name && business.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (business.address && business.address.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || business.business_type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Paginación
  const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBusinesses = filteredBusinesses.slice(startIndex, endIndex);

  // Cambiar página
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Componente Card para móvil
  const BusinessCard = ({ business }) => (
    <div className="business-card">
      <div className="business-card-header">
        <h3 className="business-card-title">{business.name || 'Sin nombre'}</h3>
        <span className="business-card-type">
          {business.business_type || 'No especificado'}
        </span>
      </div>
      
      {business.description && (
        <div className="business-card-description">
          {business.description}
        </div>
      )}
      
      <div className="business-card-details">
        <div className="business-card-detail">
          <span className="detail-icon">📍</span>
          <div className="detail-content">
            <div className="detail-label">Dirección</div>
            <div className="detail-value">{business.address || 'No especificada'}</div>
          </div>
        </div>
        
        {business.phone && (
          <div className="business-card-detail">
            <span className="detail-icon">📞</span>
            <div className="detail-content">
              <div className="detail-label">Teléfono</div>
              <div className="detail-value">
                <a href={`tel:${business.phone}`}>
                  {business.phone}
                </a>
              </div>
            </div>
          </div>
        )}
        
        {business.email && (
          <div className="business-card-detail">
            <span className="detail-icon">✉️</span>
            <div className="detail-content">
              <div className="detail-label">Email</div>
              <div className="detail-value">
                <a href={`mailto:${business.email}`}>
                  {business.email}
                </a>
              </div>
            </div>
          </div>
        )}
        
        <div className="business-card-detail">
          <span className="detail-icon">🗺️</span>
          <div className="detail-content">
            <div className="detail-label">Ubicación</div>
            <div className="detail-value">
              {business.latitude && business.longitude ? (
                <span className="coords-badge">
                  📍 {parseFloat(business.latitude).toFixed(4)}, {parseFloat(business.longitude).toFixed(4)}
                </span>
              ) : (
                <span className="no-coords">Sin coordenadas</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="business-card-actions">
        <button
          onClick={() => navigate(`/businesses/edit/${business.id}`)}
          className="btn btn-edit"
          title="Editar negocio"
        >
          ✏️ Editar
        </button>
        <button
          onClick={() => handleDelete(business.id)}
          className="btn btn-delete"
          title="Eliminar negocio"
        >
          🗑️ Eliminar
        </button>
      </div>
    </div>
  );

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
          <Link 
            to="/businesses/new" 
            className="btn btn-primary"
          >
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
      <div className="business-table-filters">
        <div className="filter-group">
          <label htmlFor="search">🔍 Buscar:</label>
          <input
            id="search"
            type="text"
            placeholder="Buscar por nombre o dirección..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Resetear a la primera página
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
              setCurrentPage(1); // Resetear a la primera página
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

      {/* Manejo de errores */}
      {error && (
        <div className="error-message">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={loadBusinesses} className="btn-retry">
            🔄 Reintentar
          </button>
        </div>
      )}

      {/* Contenido principal */}
      {!error && (
        <>
          {businesses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏢</div>
              <h3>No hay negocios registrados</h3>
              <p>Comienza agregando tu primer negocio al sistema.</p>
              <Link to="/businesses/new" className="btn btn-primary">
                ➕ Crear primer negocio
              </Link>
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No se encontraron resultados</h3>
              <p>Intenta ajustar los filtros de búsqueda.</p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setCurrentPage(1);
                }}
                className="btn btn-secondary"
              >
                🗑️ Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              {/* Tabla para Desktop */}
              <div className="table-container">
                <table className="business-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Tipo</th>
                      <th>Dirección</th>
                      <th>Teléfono</th>
                      <th>Email</th>
                      <th>Ubicación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentBusinesses.map(business => (
                      <tr key={business.id}>
                        <td>
                          <strong>{business.name || 'Sin nombre'}</strong>
                          {business.description && (
                            <div className="business-description">
                              {business.description.substring(0, 100)}
                              {business.description.length > 100 && '...'}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="business-type-badge">
                            {business.business_type || 'No especificado'}
                          </span>
                        </td>
                        <td>{business.address || 'No especificada'}</td>
                        <td>
                          {business.phone ? (
                            <a href={`tel:${business.phone}`} style={{ color: '#007bff' }}>
                              {business.phone}
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          {business.email ? (
                            <a href={`mailto:${business.email}`} style={{ color: '#007bff' }}>
                              {business.email}
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          {business.latitude && business.longitude ? (
                            <span className="coords-badge">
                              📍 {parseFloat(business.latitude).toFixed(4)}, {parseFloat(business.longitude).toFixed(4)}
                            </span>
                          ) : (
                            <span className="no-coords">Sin coordenadas</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => navigate(`/businesses/edit/${business.id}`)}
                              className="btn btn-edit"
                              title="Editar negocio"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(business.id)}
                              className="btn btn-delete"
                              title="Eliminar negocio"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards para Móvil */}
              <div className="business-cards">
                {currentBusinesses.map(business => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>

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
            </>
          )}
        </>
      )}
    </div>
  );
};

export default BusinessTable;