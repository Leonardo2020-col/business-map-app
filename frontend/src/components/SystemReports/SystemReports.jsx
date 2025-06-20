import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../Navbar/Navbar';
import * as XLSX from 'xlsx';
import './SystemReports.css';

// ✅ ICONOS MEJORADOS Y CONSISTENTES
const ICONS = {
  reports: '📊',
  overview: '📈',
  businesses: '🏢',
  users: '👥',
  geographic: '🗺️',
  categories: '🏷️',
  refresh: '🔄',
  download: '📥',
  warning: '⚠️',
  success: '✅',
  error: '❌',
  location: '📍',
  admin: '👑',
  user: '👤',
  active: '✅',
  inactive: '❌'
};

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
  const [dateRange, setDateRange] = useState('30');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // ✅ FUNCIÓN MEMOIZADA PARA API URL
  const apiUrl = useMemo(() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    } else {
      return import.meta.env.VITE_API_URL || '/api';
    }
  }, []);

  // ✅ HEADERS MEMOIZADOS
  const apiHeaders = useMemo(() => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }), []);

  useEffect(() => {
    loadReportsData();
  }, [dateRange, selectedDistrict, selectedCategory]);

  const loadReportsData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📊 Cargando datos de reportes...');

      // Cargar datos en paralelo
      const [overview, businesses, users, geographic, categories] = await Promise.all([
        fetchOverviewData(),
        fetchBusinessesData(),
        fetchUsersData(),
        fetchGeographicData(),
        fetchCategoriesData()
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
  }, [apiUrl, apiHeaders, dateRange, selectedDistrict, selectedCategory]);

  // ✅ FUNCIONES DE FETCH OPTIMIZADAS
  const fetchOverviewData = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/businesses/stats/summary`, { 
        headers: apiHeaders 
      });
      if (response.ok) {
        const data = await response.json();
        return data.data || {};
      }
    } catch (error) {
      console.warn('No se pudieron cargar estadísticas generales');
    }
    return {
      total: 0,
      servicesStatus: { withIssues: 0, ok: 0 }
    };
  }, [apiUrl, apiHeaders]);

  const fetchBusinessesData = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/businesses?limit=1000`, { 
        headers: apiHeaders 
      });
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data : (Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.warn('No se pudieron cargar datos de negocios');
    }
    return [];
  }, [apiUrl, apiHeaders]);

  const fetchUsersData = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/admin/users`, { 
        headers: apiHeaders 
      });
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
    } catch (error) {
      console.warn('No se pudieron cargar datos de usuarios');
    }
    return [];
  }, [apiUrl, apiHeaders]);

  const fetchGeographicData = useCallback(async () => {
    const businesses = await fetchBusinessesData();
    const districts = {};
    
    businesses.forEach(business => {
      // ✅ USAR CAMPO CORRECTO 'distrito'
      const district = business.distrito || 'Sin distrito';
      
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
  }, [fetchBusinessesData]);

  const fetchCategoriesData = useCallback(async () => {
    const businesses = await fetchBusinessesData();
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
  }, [fetchBusinessesData]);

  // ✅ FUNCIÓN DE DESCARGA EXCEL MEJORADA CON SHEETJS
  const downloadExcel = useCallback(async (dataType) => {
    try {
      console.log(`📥 Descargando reporte Excel: ${dataType}`);
      
      // Crear un nuevo workbook
      const workbook = XLSX.utils.book_new();
      
      let filename = '';
      const currentDate = new Date().toISOString().split('T')[0];
      
      switch(dataType) {
        case 'businesses':
          await createBusinessesSheet(workbook);
          filename = `Reporte_Negocios_${currentDate}.xlsx`;
          break;
          
        case 'users':
          await createUsersSheet(workbook);
          filename = `Reporte_Usuarios_${currentDate}.xlsx`;
          break;
          
        case 'geographic':
          await createGeographicSheet(workbook);
          filename = `Reporte_Geografico_${currentDate}.xlsx`;
          break;
          
        case 'categories':
          await createCategoriesSheet(workbook);
          filename = `Reporte_Categorias_${currentDate}.xlsx`;
          break;

        case 'complete':
          await createCompleteReport(workbook);
          filename = `Reporte_Completo_BusinessMap_${currentDate}.xlsx`;
          break;
          
        default:
          throw new Error('Tipo de reporte no válido');
      }
      
      // Generar y descargar el archivo
      XLSX.writeFile(workbook, filename);
      console.log(`✅ Archivo descargado: ${filename}`);
      
    } catch (error) {
      console.error('❌ Error descargando Excel:', error);
      alert('Error al generar el archivo Excel');
    }
  }, [businessesData, usersData, geographicData, categoriesData]);

  // ✅ CREAR HOJA DE NEGOCIOS
  const createBusinessesSheet = useCallback((workbook) => {
    const data = businessesData.map(business => ({
      'ID': business.id || '',
      'Nombre del Negocio': business.name || business.business_name || '',
      'Tipo de Negocio': business.business_type || '',
      'Dirección': business.address || '',
      'Distrito': business.distrito || '',
      'Sector': business.sector || '',
      'Anexo': business.anexo || '',
      'Teléfono': business.phone || '',
      'Email': business.email || '',
      'Latitud': business.latitude || '',
      'Longitud': business.longitude || '',
      'Tiene Ubicación': business.latitude && business.longitude ? 'SÍ' : 'NO',
      'Creado por': business.creator?.username || 'N/A',
      'Fecha de Creación': business.created_at ? 
        new Date(business.created_at).toLocaleDateString('es-PE') : 'N/A',
      'Estado': business.is_active ? 'Activo' : 'Inactivo'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Configurar ancho de columnas
    const columnWidths = [
      { wch: 8 },   // ID
      { wch: 25 },  // Nombre
      { wch: 20 },  // Tipo
      { wch: 30 },  // Dirección
      { wch: 15 },  // Distrito
      { wch: 15 },  // Sector
      { wch: 10 },  // Anexo
      { wch: 15 },  // Teléfono
      { wch: 25 },  // Email
      { wch: 12 },  // Latitud
      { wch: 12 },  // Longitud
      { wch: 12 },  // Tiene Ubicación
      { wch: 15 },  // Creado por
      { wch: 15 },  // Fecha
      { wch: 10 }   // Estado
    ];
    worksheet['!cols'] = columnWidths;

    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Negocios');
  }, [businessesData]);

  // ✅ CREAR HOJA DE USUARIOS
  const createUsersSheet = useCallback((workbook) => {
    const data = usersData.map(user => ({
      'ID': user.id || '',
      'Nombre de Usuario': user.username || '',
      'Nombre Completo': user.full_name || 'N/A',
      'Email': user.email || 'N/A',
      'Rol': user.role === 'admin' ? 'Administrador' : 'Usuario',
      'Estado': user.is_active ? 'Activo' : 'Inactivo',
      'Último Acceso': user.last_login ? 
        new Date(user.last_login).toLocaleDateString('es-PE') : 'Nunca',
      'Fecha de Registro': user.created_at ? 
        new Date(user.created_at).toLocaleDateString('es-PE') : 'N/A',
      'Negocios Creados': businessesData.filter(b => b.creator?.id === user.id).length
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Configurar ancho de columnas
    worksheet['!cols'] = [
      { wch: 8 },   // ID
      { wch: 20 },  // Username
      { wch: 25 },  // Nombre completo
      { wch: 30 },  // Email
      { wch: 15 },  // Rol
      { wch: 10 },  // Estado
      { wch: 15 },  // Último acceso
      { wch: 15 },  // Fecha registro
      { wch: 12 }   // Negocios creados
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');
  }, [usersData, businessesData]);

  // ✅ CREAR HOJA GEOGRÁFICA
  const createGeographicSheet = useCallback((workbook) => {
    const data = geographicData.map(district => ({
      'Distrito': district.district || '',
      'Total de Negocios': district.totalBusinesses || 0,
      'Con Coordenadas': district.withCoordinates || 0,
      'Sin Coordenadas': district.withoutCoordinates || 0,
      'Porcentaje con Ubicación': district.totalBusinesses > 0 ? 
        `${((district.withCoordinates / district.totalBusinesses) * 100).toFixed(1)}%` : '0%'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Configurar ancho de columnas
    worksheet['!cols'] = [
      { wch: 20 },  // Distrito
      { wch: 15 },  // Total
      { wch: 15 },  // Con coordenadas
      { wch: 15 },  // Sin coordenadas
      { wch: 18 }   // Porcentaje
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Distribución Geográfica');
  }, [geographicData]);

  // ✅ CREAR HOJA DE CATEGORÍAS
  const createCategoriesSheet = useCallback((workbook) => {
    const data = categoriesData.map(category => ({
      'Categoría': category.category || '',
      'Cantidad de Negocios': category.count || 0,
      'Porcentaje del Total': `${category.percentage}%`
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Configurar ancho de columnas
    worksheet['!cols'] = [
      { wch: 25 },  // Categoría
      { wch: 18 },  // Cantidad
      { wch: 18 }   // Porcentaje
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Categorías de Negocio');
  }, [categoriesData]);

  // ✅ CREAR REPORTE COMPLETO (TODAS LAS HOJAS)
  const createCompleteReport = useCallback(async (workbook) => {
    // Crear hoja de resumen
    const summaryData = [
      { 'Métrica': 'Total de Negocios', 'Valor': businessesData.length },
      { 'Métrica': 'Total de Usuarios', 'Valor': usersData.length },
      { 'Métrica': 'Negocios con Ubicación', 'Valor': businessesData.filter(b => b.latitude && b.longitude).length },
      { 'Métrica': 'Negocios sin Ubicación', 'Valor': businessesData.filter(b => !b.latitude || !b.longitude).length },
      { 'Métrica': 'Categorías Diferentes', 'Valor': categoriesData.length },
      { 'Métrica': 'Distritos con Negocios', 'Valor': geographicData.length },
      { 'Métrica': 'Usuarios Administradores', 'Valor': usersData.filter(u => u.role === 'admin').length },
      { 'Métrica': 'Usuarios Activos', 'Valor': usersData.filter(u => u.is_active).length }
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen General');

    // Agregar todas las demás hojas
    createBusinessesSheet(workbook);
    createUsersSheet(workbook);
    createGeographicSheet(workbook);
    createCategoriesSheet(workbook);
  }, [businessesData, usersData, geographicData, categoriesData]);

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
            <h1>{ICONS.reports} Reportes del Sistema</h1>
            <p>Análisis detallado y estadísticas de Business Map</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => downloadExcel('complete')}
              className="btn btn-primary"
              style={{ marginRight: '10px' }}
            >
              {ICONS.download} Descargar Reporte Completo
            </button>
            <button 
              onClick={loadReportsData}
              className="btn btn-secondary"
              disabled={loading}
            >
              {ICONS.refresh} Actualizar
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">{ICONS.warning}</span>
            <span>{error}</span>
            <button onClick={loadReportsData} className="btn btn-outline">
              {ICONS.refresh} Reintentar
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
            {ICONS.overview} Resumen General
          </button>
          <button 
            className={`tab ${activeTab === 'businesses' ? 'active' : ''}`}
            onClick={() => setActiveTab('businesses')}
          >
            {ICONS.businesses} Negocios
          </button>
          <button 
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            {ICONS.users} Usuarios
          </button>
          <button 
            className={`tab ${activeTab === 'geographic' ? 'active' : ''}`}
            onClick={() => setActiveTab('geographic')}
          >
            {ICONS.geographic} Geográfico
          </button>
          <button 
            className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            {ICONS.categories} Categorías
          </button>
        </div>

        {/* Contenido de tabs */}
        <div className="tab-content">
          {/* Tab: Resumen General */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">{ICONS.businesses}</div>
                  <div className="stat-content">
                    <h3>{overviewData?.total || businessesData.length}</h3>
                    <p>Total Negocios</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{ICONS.users}</div>
                  <div className="stat-content">
                    <h3>{usersData.length}</h3>
                    <p>Total Usuarios</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{ICONS.location}</div>
                  <div className="stat-content">
                    <h3>{businessesData.filter(b => b.latitude && b.longitude).length}</h3>
                    <p>Con Ubicación</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{ICONS.categories}</div>
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
                <h2>{ICONS.businesses} Reporte de Negocios</h2>
                <button 
                  onClick={() => downloadExcel('businesses')}
                  className="btn btn-primary"
                >
                  {ICONS.download} Descargar Excel
                </button>
              </div>
              
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Tipo</th>
                      <th>Distrito</th>
                      <th>Sector</th>
                      <th>Coordenadas</th>
                      <th>Creado por</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businessesData.slice(0, 50).map(business => (
                      <tr key={business.id}>
                        <td>{business.name || business.business_name}</td>
                        <td>{business.business_type || 'N/A'}</td>
                        <td>{business.distrito || 'N/A'}</td>
                        <td>{business.sector || 'N/A'}</td>
                        <td>
                          {business.latitude && business.longitude 
                            ? <span className="positive">{ICONS.success}</span>
                            : <span className="negative">{ICONS.error}</span>
                          }
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
                <h2>{ICONS.users} Reporte de Usuarios</h2>
                <button 
                  onClick={() => downloadExcel('users')}
                  className="btn btn-primary"
                >
                  {ICONS.download} Descargar Excel
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
                            {user.role === 'admin' ? `${ICONS.admin} Admin` : `${ICONS.user} Usuario`}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                            {user.is_active ? `${ICONS.active} Activo` : `${ICONS.inactive} Inactivo`}
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
                <h2>{ICONS.geographic} Distribución Geográfica</h2>
                <button 
                  onClick={() => downloadExcel('geographic')}
                  className="btn btn-primary"
                >
                  {ICONS.download} Descargar Excel
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
                <h2>{ICONS.categories} Distribución por Categorías</h2>
                <button 
                  onClick={() => downloadExcel('categories')}
                  className="btn btn-primary"
                >
                  {ICONS.download} Descargar Excel
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