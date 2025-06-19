import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../Navbar/Navbar';
import './SystemReports.css';

const SystemReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Estados para datos
  const [overviewData, setOverviewData] = useState(null);
  const [businessesData, setBusinessesData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [geographicData, setGeographicData] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  
  // Estados para filtros
  const [dateRange, setDateRange] = useState('30'); // días
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Configuración de API
  const getApiUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    } else {
      return import.meta.env.VITE_API_URL || '/api';
    }
  };

  useEffect(() => {
    loadReportsData();
  }, [dateRange, selectedDistrict, selectedCategory]);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📊 Cargando datos de reportes...');
      
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Cargar datos en paralelo
      const [overview, businesses, users, geographic, categories] = await Promise.all([
        fetchOverviewData(apiUrl, headers),
        fetchBusinessesData(apiUrl, headers),
        fetchUsersData(apiUrl, headers),
        fetchGeographicData(apiUrl, headers),
        fetchCategoriesData(apiUrl, headers)
      ]);

      setOverviewData(overview);
      setBusinessesData(businesses);
      setUsersData(users);
      setGeographicData(geographic);
      setCategoriesData(categories);

      console.log('✅ Datos de reportes cargados exitosamente');

    } catch (error) {
      console.error('❌ Error cargando reportes:', error);
      setError('Error al cargar los datos de reportes');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para cargar datos específicos
  const fetchOverviewData = async (apiUrl, headers) => {
    try {
      const response = await fetch(`${apiUrl}/businesses/stats/summary`, { headers });
      if (response.ok) {
        const data = await response.json();
        return data.data || {};
      }
    } catch (error) {
      console.warn('No se pudieron cargar estadísticas generales');
    }
    return {
      totalBusinesses: 0,
      businessesWithIssues: 0,
      businessesOk: 0
    };
  };

  const fetchBusinessesData = async (apiUrl, headers) => {
    try {
      const response = await fetch(`${apiUrl}/businesses?limit=1000`, { headers });
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
    } catch (error) {
      console.warn('No se pudieron cargar datos de negocios');
    }
    return [];
  };

  const fetchUsersData = async (apiUrl, headers) => {
    try {
      const response = await fetch(`${apiUrl}/admin/users`, { headers });
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
    } catch (error) {
      console.warn('No se pudieron cargar datos de usuarios');
    }
    return [];
  };

  const fetchGeographicData = async (apiUrl, headers) => {
    // Procesar datos geográficos de negocios
    const businesses = await fetchBusinessesData(apiUrl, headers);
    const districts = {};
    
    businesses.forEach(business => {
      const district = business.district || 'Sin distrito';
      if (!districts[district]) {
        districts[district] = {
          district,
          totalBusinesses: 0,
          withCoordinates: 0,
          withoutCoordinates: 0
        };
      }
      districts[district].totalBusinesses++;
      if (business.latitude && business.longitude) {
        districts[district].withCoordinates++;
      } else {
        districts[district].withoutCoordinates++;
      }
    });

    return Object.values(districts).sort((a, b) => b.totalBusinesses - a.totalBusinesses);
  };

  const fetchCategoriesData = async (apiUrl, headers) => {
    // Procesar datos de categorías de negocios
    const businesses = await fetchBusinessesData(apiUrl, headers);
    const categories = {};
    
    businesses.forEach(business => {
      const category = business.business_type || 'Sin categoría';
      if (!categories[category]) {
        categories[category] = {
          category,
          count: 0,
          percentage: 0
        };
      }
      categories[category].count++;
    });

    const total = businesses.length;
    const result = Object.values(categories).map(cat => ({
      ...cat,
      percentage: total > 0 ? ((cat.count / total) * 100).toFixed(1) : 0
    }));

    return result.sort((a, b) => b.count - a.count);
  };

  // Función para descargar Excel
  const downloadExcel = async (dataType) => {
    try {
      console.log(`📥 Descargando reporte: ${dataType}`);
      
      let data = [];
      let filename = '';
      
      switch(dataType) {
        case 'businesses':
          data = businessesData.map(business => ({
            'ID': business.id,
            'Nombre': business.business_name || business.name,
            'Tipo': business.business_type,
            'Dirección': business.address,
            'Distrito': business.district,
            'Sector': business.sector,
            'Teléfono': business.phone,
            'Email': business.email,
            'Latitud': business.latitude,
            'Longitud': business.longitude,
            'Creado por': business.creator?.username || 'N/A',
            'Fecha creación': business.created_at ? new Date(business.created_at).toLocaleDateString() : 'N/A'
          }));
          filename = 'reporte_negocios';
          break;
          
        case 'users':
          data = usersData.map(user => ({
            'ID': user.id,
            'Usuario': user.username,
            'Nombre completo': user.full_name || 'N/A',
            'Email': user.email || 'N/A',
            'Rol': user.role,
            'Estado': user.is_active ? 'Activo' : 'Inactivo',
            'Último acceso': user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Nunca',
            'Fecha registro': new Date(user.created_at).toLocaleDateString()
          }));
          filename = 'reporte_usuarios';
          break;
          
        case 'geographic':
          data = geographicData.map(district => ({
            'Distrito': district.district,
            'Total negocios': district.totalBusinesses,
            'Con coordenadas': district.withCoordinates,
            'Sin coordenadas': district.withoutCoordinates,
            'Porcentaje con ubicación': district.totalBusinesses > 0 ? 
              ((district.withCoordinates / district.totalBusinesses) * 100).toFixed(1) + '%' : '0%'
          }));
          filename = 'reporte_geografico';
          break;
          
        case 'categories':
          data = categoriesData.map(category => ({
            'Categoría': category.category,
            'Cantidad': category.count,
            'Porcentaje': category.percentage + '%'
          }));
          filename = 'reporte_categorias';
          break;
          
        default:
          throw new Error('Tipo de reporte no válido');
      }
      
      // Crear archivo Excel usando la API nativa del navegador
      const worksheet = createWorksheet(data);
      const workbook = createWorkbook(worksheet);
      downloadWorkbook(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
    } catch (error) {
      console.error('❌ Error descargando Excel:', error);
      alert('Error al generar el archivo Excel');
    }
  };

  // Funciones auxiliares para crear Excel (usando CSV como fallback)
  const createWorksheet = (data) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escapar comillas y manejar comas
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };

  const createWorkbook = (worksheet) => {
    return new Blob(['\ufeff' + worksheet], { 
      type: 'text/csv;charset=utf-8;' 
    });
  };

  const downloadWorkbook = (blob, filename) => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename.replace('.xlsx', '.csv'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="reports-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando reportes del sistema...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="reports-container">
        {/* Header */}
        <div className="reports-header">
          <div className="header-content">
            <h1>📊 Reportes del Sistema</h1>
            <p>Análisis detallado y estadísticas de Business Map</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={loadReportsData}
              className="btn btn-secondary"
              disabled={loading}
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={loadReportsData} className="btn btn-outline">
              🔄 Reintentar
            </button>
          </div>
        )}

        {/* Filtros */}
        <div className="reports-filters">
          <div className="filter-group">
            <label>📅 Período:</label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 3 meses</option>
              <option value="365">Último año</option>
              <option value="all">Todo el tiempo</option>
            </select>
          </div>
        </div>

        {/* Tabs de navegación */}
        <div className="reports-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📈 Resumen General
          </button>
          <button 
            className={`tab ${activeTab === 'businesses' ? 'active' : ''}`}
            onClick={() => setActiveTab('businesses')}
          >
            🏢 Negocios
          </button>
          <button 
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Usuarios
          </button>
          <button 
            className={`tab ${activeTab === 'geographic' ? 'active' : ''}`}
            onClick={() => setActiveTab('geographic')}
          >
            🗺️ Geográfico
          </button>
          <button 
            className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            🏷️ Categorías
          </button>
        </div>

        {/* Contenido de tabs */}
        <div className="tab-content">
          {/* Tab: Resumen General */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">🏢</div>
                  <div className="stat-content">
                    <h3>{overviewData?.totalBusinesses || 0}</h3>
                    <p>Total Negocios</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h3>{usersData.length}</h3>
                    <p>Total Usuarios</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📍</div>
                  <div className="stat-content">
                    <h3>{businessesData.filter(b => b.latitude && b.longitude).length}</h3>
                    <p>Con Ubicación</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🏷️</div>
                  <div className="stat-content">
                    <h3>{categoriesData.length}</h3>
                    <p>Categorías</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Negocios */}
          {activeTab === 'businesses' && (
            <div className="businesses-tab">
              <div className="tab-header">
                <h2>📊 Reporte de Negocios</h2>
                <button 
                  onClick={() => downloadExcel('businesses')}
                  className="btn btn-primary"
                >
                  📥 Descargar Excel
                </button>
              </div>
              
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Tipo</th>
                      <th>Distrito</th>
                      <th>Coordenadas</th>
                      <th>Creado por</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businessesData.slice(0, 50).map(business => (
                      <tr key={business.id}>
                        <td>{business.business_name || business.name}</td>
                        <td>{business.business_type || 'N/A'}</td>
                        <td>{business.district || 'N/A'}</td>
                        <td>
                          {business.latitude && business.longitude ? '✅' : '❌'}
                        </td>
                        <td>{business.creator?.username || 'N/A'}</td>
                        <td>{business.created_at ? new Date(business.created_at).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {businessesData.length > 50 && (
                  <p className="table-note">
                    Mostrando 50 de {businessesData.length} registros. 
                    Descarga el Excel para ver todos los datos.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tab: Usuarios */}
          {activeTab === 'users' && (
            <div className="users-tab">
              <div className="tab-header">
                <h2>👥 Reporte de Usuarios</h2>
                <button 
                  onClick={() => downloadExcel('users')}
                  className="btn btn-primary"
                >
                  📥 Descargar Excel
                </button>
              </div>
              
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Último acceso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersData.map(user => (
                      <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>{user.full_name || 'N/A'}</td>
                        <td>{user.email || 'N/A'}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                            {user.is_active ? '✅ Activo' : '❌ Inactivo'}
                          </span>
                        </td>
                        <td>{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Nunca'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Geográfico */}
          {activeTab === 'geographic' && (
            <div className="geographic-tab">
              <div className="tab-header">
                <h2>🗺️ Distribución Geográfica</h2>
                <button 
                  onClick={() => downloadExcel('geographic')}
                  className="btn btn-primary"
                >
                  📥 Descargar Excel
                </button>
              </div>
              
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Distrito</th>
                      <th>Total Negocios</th>
                      <th>Con Coordenadas</th>
                      <th>Sin Coordenadas</th>
                      <th>% Con Ubicación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geographicData.map((district, index) => (
                      <tr key={index}>
                        <td>{district.district}</td>
                        <td>{district.totalBusinesses}</td>
                        <td className="positive">{district.withCoordinates}</td>
                        <td className="negative">{district.withoutCoordinates}</td>
                        <td>
                          {district.totalBusinesses > 0 
                            ? `${((district.withCoordinates / district.totalBusinesses) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Categorías */}
          {activeTab === 'categories' && (
            <div className="categories-tab">
              <div className="tab-header">
                <h2>🏷️ Distribución por Categorías</h2>
                <button 
                  onClick={() => downloadExcel('categories')}
                  className="btn btn-primary"
                >
                  📥 Descargar Excel
                </button>
              </div>
              
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th>Cantidad</th>
                      <th>Porcentaje</th>
                      <th>Gráfico</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoriesData.map((category, index) => (
                      <tr key={index}>
                        <td>{category.category}</td>
                        <td>{category.count}</td>
                        <td>{category.percentage}%</td>
                        <td>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${Math.min(category.percentage, 100)}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SystemReports;