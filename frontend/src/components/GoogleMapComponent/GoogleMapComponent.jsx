import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { businessAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './GoogleMapComponent.css';

const libraries = ['places'];
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Configuración del mapa
const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '400px'
};

const defaultCenter = {
  lat: -12.0464, // Lima, Perú
  lng: -77.0428
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'on' }]
    }
  ]
};

const GoogleMapComponent = () => {
  const { user, isAdmin } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [error, setError] = useState('');
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState(defaultCenter);

  // ✅ FUNCIÓN CORREGIDA PARA USAR .env PRIMERO
const loadBusinessesDirectly = async () => {
  try {
    console.log('🔄 Cargando negocios directamente...');
    
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔐 Token incluido en headers');
    }
    
    // ✅ PRIORIDAD: 1. .env, 2. Detección automática
    let apiUrl;
    
    if (import.meta.env.VITE_API_URL) {
      // Si hay URL configurada en .env, usarla
      apiUrl = import.meta.env.VITE_API_URL;
      console.log('📝 Usando URL desde .env:', apiUrl);
    } else {
      // Fallback: detección automática
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        apiUrl = 'http://localhost:5000/api';
        console.log('🏠 Fallback: Entorno local detectado');
      } else {
        apiUrl = '/api';
        console.log('🌍 Fallback: Entorno de producción detectado');
      }
    }
    
    const fullUrl = `${apiUrl}/businesses`;
    console.log('🌐 URL final para petición:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
      credentials: 'include'
    });
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Datos recibidos:', data);
    
    return data;
    
  } catch (error) {
    console.error('❌ Error en fetch directo:', error);
    throw error;
  }
};

  // ✅ FUNCIÓN MEJORADA PARA PROCESAR NEGOCIOS
  const processBusinessData = (businessResponse) => {
    let allBusinesses = [];
    
    if (businessResponse) {
      // Manejar diferentes estructuras de respuesta
      if (businessResponse.success && Array.isArray(businessResponse.data)) {
        allBusinesses = businessResponse.data;
        console.log('✅ Estructura: {success: true, data: [...]}');
      } else if (Array.isArray(businessResponse.data)) {
        allBusinesses = businessResponse.data;
        console.log('✅ Estructura: {data: [...]}');
      } else if (Array.isArray(businessResponse)) {
        allBusinesses = businessResponse;
        console.log('✅ Estructura: [...]');
      } else {
        console.error('❌ Estructura de respuesta no reconocida:', businessResponse);
        throw new Error('Estructura de respuesta inválida');
      }
    }

    console.log(`📋 Total negocios recibidos: ${allBusinesses.length}`);
    
    // ✅ FILTRADO MEJORADO CON NOMBRES CORRECTOS
    const businessesWithCoords = allBusinesses.filter(business => {
      // Manejar diferentes nombres de campos
      const businessName = business.business_name || business.name || `Negocio ${business.id}`;
      
      const hasCoords = business.latitude && business.longitude;
      if (!hasCoords) {
        console.log(`⚠️ Negocio sin coordenadas: ${businessName}`);
        return false;
      }
      
      const lat = parseFloat(business.latitude);
      const lng = parseFloat(business.longitude);
      const validCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      
      if (!validCoords) {
        console.log(`⚠️ Coordenadas inválidas: ${businessName} (${business.latitude}, ${business.longitude})`);
        return false;
      }
      
      // Verificar rangos válidos para Perú (aproximadamente)
      if (lat < -18.5 || lat > -0.5 || lng < -81.5 || lng > -68.5) {
        console.log(`⚠️ Coordenadas fuera de Perú: ${businessName} (${lat}, ${lng})`);
        return false;
      }
      
      console.log(`✅ Negocio válido: ${businessName} (${lat}, ${lng})`);
      return true;
    });
    
    return businessesWithCoords;
  };

  // ✅ FUNCIÓN MEJORADA PARA CARGAR DATOS DEL MAPA
  const loadMapData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🗺️ Iniciando carga de datos del mapa...');

      // Método 1: Usar fetch directo (más confiable)
      let businessResponse = null;
      let method = '';
      
      try {
        businessResponse = await loadBusinessesDirectly();
        method = 'fetch directo';
      } catch (fetchError) {
        console.log('⚠️ Fetch directo falló, intentando con businessAPI...');
        
        // Método 2: Fallback a businessAPI
        try {
          const apiResponse = await businessAPI.getAll({ limit: 500 });
          businessResponse = apiResponse.data || apiResponse; // axios puede wrappear en .data
          method = 'businessAPI';
          console.log('✅ businessAPI funcionó:', businessResponse);
        } catch (apiError) {
          console.error('❌ businessAPI también falló:', apiError);
          throw fetchError; // Lanzar el error original
        }
      }

      console.log(`📊 Datos cargados usando: ${method}`);

      // ✅ PROCESAR DATOS
      const processedBusinesses = processBusinessData(businessResponse);
      setBusinesses(processedBusinesses);
      console.log(`📍 ${processedBusinesses.length} negocios con coordenadas válidas`);
      
      // Centrar mapa en el primer negocio si existe
      if (processedBusinesses.length > 0) {
        const firstBusiness = processedBusinesses[0];
        const newCenter = {
          lat: parseFloat(firstBusiness.latitude),
          lng: parseFloat(firstBusiness.longitude)
        };
        setCenter(newCenter);
        console.log(`🎯 Centrando mapa en: ${firstBusiness.business_name || firstBusiness.name}`, newCenter);
      } else {
        console.log('⚠️ No hay negocios con coordenadas válidas, usando centro por defecto');
      }

      // ✅ CARGAR TIPOS DE NEGOCIO MEJORADO
      try {
        // Método 1: API
        const typesResponse = await businessAPI.getTypes();
        if (typesResponse?.data?.success && Array.isArray(typesResponse.data.data)) {
          const apiTypes = typesResponse.data.data.map(type => 
            typeof type === 'string' ? type : type.value || type.label || type.name
          ).filter(Boolean);
          setBusinessTypes(apiTypes);
          console.log(`🏷️ ${apiTypes.length} tipos cargados desde API`);
        } else {
          throw new Error('Tipos desde API no válidos');
        }
      } catch (typesError) {
        console.warn('⚠️ No se pudieron cargar tipos desde API:', typesError.message);
        // Método 2: Extraer desde negocios
        const uniqueTypes = [...new Set(
          processedBusinesses
            .map(b => b.business_type)
            .filter(Boolean)
        )].sort();
        setBusinessTypes(uniqueTypes);
        console.log(`🏷️ ${uniqueTypes.length} tipos extraídos de negocios:`, uniqueTypes);
      }

    } catch (error) {
      console.error('❌ Error cargando datos del mapa:', error);
      const errorMessage = error.message || 'Error desconocido';
      setError(`Error cargando datos: ${errorMessage}`);
      
      // Intentar mostrar algunos datos de debug
      console.log('🔍 Debug info:', {
        hostname: window.location.hostname,
        pathname: window.location.pathname,
        isDev: import.meta.env.DEV,
        isProd: import.meta.env.PROD,
        apiUrl: import.meta.env.VITE_API_URL
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar negocios cuando cambia el tipo seleccionado
  useEffect(() => {
    if (selectedType === 'all') {
      setFilteredBusinesses(businesses);
      console.log(`🔍 Mostrando todos los negocios: ${businesses.length}`);
    } else {
      const filtered = businesses.filter(
        business => business.business_type === selectedType
      );
      setFilteredBusinesses(filtered);
      console.log(`🔍 Filtrando por '${selectedType}': ${filtered.length} negocios`);
    }
  }, [businesses, selectedType]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadMapData();
  }, []);

  const onMapLoad = useCallback((mapInstance) => {
    console.log('✅ Google Maps cargado exitosamente');
    setMap(mapInstance);
    setMapLoading(false);
  }, []);

  const onMapError = useCallback((error) => {
    console.error('❌ Error cargando Google Maps:', error);
    setError('Error cargando Google Maps: ' + error.message);
    setMapLoading(false);
  }, []);

  const onMarkerClick = (business) => {
    const businessName = business.business_name || business.name;
    console.log('🖱️ Click en marcador:', businessName);
    setSelectedBusiness(business);
    const position = {
      lat: parseFloat(business.latitude),
      lng: parseFloat(business.longitude)
    };
    setCenter(position);
    if (map) {
      map.panTo(position);
      map.setZoom(16);
    }
  };

  // ✅ FUNCIÓN MEJORADA PARA ICONOS
  const getMarkerIcon = (businessType) => {
    const icons = {
      'restaurant': '🍽️',
      'tienda': '🛍️',
      'store': '🏪',
      'pharmacy': '💊',
      'farmacia': '💊',
      'bank': '🏦',
      'banco': '🏦',
      'hospital': '🏥',
      'clinic': '🏥',
      'hotel': '🏨',
      'gas_station': '⛽',
      'grifo': '⛽',
      'market': '🛒',
      'mercado': '🛒',
      'cafe': '☕',
      'gym': '💪',
      'salon': '💇',
      'workshop': '🔧',
      'taller': '🔧',
      'bakery': '🥖',
      'panaderia': '🥖',
      'office': '🏢',
      'oficina': '🏢'
    };
    
    const lowerType = (businessType || '').toLowerCase();
    let icon = '📍'; // Default icon
    
    // Buscar coincidencias más flexibles
    for (const [key, emoji] of Object.entries(icons)) {
      if (lowerType.includes(key) || key.includes(lowerType)) {
        icon = emoji;
        break;
      }
    }
    
    return {
      url: `data:image/svg+xml;charset=UTF-8,%3csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='20' cy='20' r='18' fill='white' stroke='%23667eea' stroke-width='2'/%3e%3ctext y='50%25' font-size='20' text-anchor='middle' dominant-baseline='middle' x='50%25'%3e${icon}%3c/text%3e%3c/svg%3e`,
      scaledSize: { width: 40, height: 40 }
    };
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCenter(userLocation);
          if (map) {
            map.panTo(userLocation);
            map.setZoom(14);
          }
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          alert('No se pudo obtener tu ubicación');
        }
      );
    } else {
      alert('Geolocalización no soportada en este navegador');
    }
  };

  // Si no hay API key, mostrar mensaje
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="map-container">
        <div className="map-error">
          <h2>🗺️ Google Maps no configurado</h2>
          <p>Se requiere una API Key de Google Maps para mostrar el mapa.</p>
          <p>Configura VITE_GOOGLE_MAPS_API_KEY en tus variables de entorno.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="map-container">
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <h2>🗺️ Cargando mapa...</h2>
          <p>Cargando negocios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-container">
        <div className="map-error">
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button onClick={loadMapData} className="btn btn-primary">
            🔄 Reintentar
          </button>
          
          {/* Mostrar lista de negocios si los hay */}
          {businesses.length > 0 && (
            <div style={{ marginTop: '20px', maxHeight: '300px', overflowY: 'auto' }}>
              <h3>📋 Negocios cargados ({businesses.length})</h3>
              {businesses.slice(0, 5).map(business => (
                <div key={business.id} style={{
                  padding: '10px',
                  margin: '5px 0',
                  background: '#f0f0f0',
                  borderRadius: '5px',
                  textAlign: 'left'
                }}>
                  <strong>{business.business_name || business.name}</strong><br/>
                  <small>{business.business_type} - {business.address}</small><br/>
                  <small>Coords: {business.latitude}, {business.longitude}</small>
                </div>
              ))}
              {businesses.length > 5 && <p>... y {businesses.length - 5} más</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <LoadScript
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        libraries={libraries}
        onLoad={() => console.log('LoadScript ready')}
        onError={onMapError}
        loadingElement={<div>Cargando Google Maps...</div>}
      >
        <div className="map-layout-clean">
          {/* Controles integrados - PARTE INFERIOR */}
          <div className="floating-controls">
            {/* Filtro de tipo */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="type-filter"
            >
              <option value="all">Todos ({businesses.length})</option>
              {businessTypes.map((type) => {
                const count = businesses.filter(b => b.business_type === type).length;
                return (
                  <option key={type} value={type}>
                    {type} ({count})
                  </option>
                );
              })}
            </select>
            
            {/* Estadísticas integradas */}
            <div className="map-stats">
              Mostrando {filteredBusinesses.length} de {businesses.length} negocios
            </div>
            
            {/* Botones de control */}
            <div className="controls-group">
              <button
                onClick={getCurrentLocation}
                className="control-btn"
                title="Mi ubicación"
              >
                📍
              </button>
              
              <button
                onClick={() => {
                  setCenter(defaultCenter);
                  if (map) {
                    map.panTo(defaultCenter);
                    map.setZoom(11);
                  }
                }}
                className="control-btn"
                title="Vista general"
              >
                🌍
              </button>
              
              <button
                onClick={loadMapData}
                className="control-btn"
                title="Recargar datos"
              >
                🔄
              </button>
            </div>
          </div>

          {/* El mapa */}
          <div className="map-wrapper-clean">
            {mapLoading && (
              <div className="map-loading-overlay">
                <div className="loading-spinner"></div>
                <p>Cargando Google Maps...</p>
              </div>
            )}
            
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={12}
              options={mapOptions}
              onLoad={onMapLoad}
              onError={onMapError}
            >
              {/* Marcadores de negocios */}
              {filteredBusinesses.map((business) => {
                const lat = parseFloat(business.latitude);
                const lng = parseFloat(business.longitude);
                
                if (isNaN(lat) || isNaN(lng)) {
                  console.warn(`Coordenadas inválidas para ${business.business_name || business.name}:`, business.latitude, business.longitude);
                  return null;
                }
                
                return (
                  <Marker
                    key={business.id}
                    position={{ lat, lng }}
                    icon={getMarkerIcon(business.business_type)}
                    onClick={() => onMarkerClick(business)}
                    title={`${business.business_name || business.name} - ${business.business_type}`}
                  />
                );
              })}

              {/* Ventana de información */}
              {selectedBusiness && (
                <InfoWindow
                  position={{
                    lat: parseFloat(selectedBusiness.latitude),
                    lng: parseFloat(selectedBusiness.longitude)
                  }}
                  onCloseClick={() => setSelectedBusiness(null)}
                >
                  <div className="info-window">
                    <h4>{selectedBusiness.business_name || selectedBusiness.name}</h4>
                    <p><strong>Tipo:</strong> {selectedBusiness.business_type}</p>
                    <p><strong>Dirección:</strong> {selectedBusiness.address}</p>
                    
                    {selectedBusiness.phone && (
                      <p><strong>Teléfono:</strong> 
                        <a href={`tel:${selectedBusiness.phone}`}>
                          {selectedBusiness.phone}
                        </a>
                      </p>
                    )}
                    
                    {selectedBusiness.email && (
                      <p><strong>Email:</strong> 
                        <a href={`mailto:${selectedBusiness.email}`}>
                          {selectedBusiness.email}
                        </a>
                      </p>
                    )}
                    
                    {selectedBusiness.website && (
                      <p><strong>Sitio web:</strong> 
                        <a href={selectedBusiness.website} target="_blank" rel="noopener noreferrer">
                          Visitar
                        </a>
                      </p>
                    )}
                    
                    <div className="info-actions">
                      {(isAdmin() || selectedBusiness.created_by === user?.id) && (
                        <a 
                          href={`/business/edit/${selectedBusiness.id}`}
                          className="btn btn-sm btn-primary"
                        >
                          ✏️ Editar
                        </a>
                      )}
                      
                      <button
                        onClick={() => {
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedBusiness.latitude},${selectedBusiness.longitude}`;
                          window.open(url, '_blank');
                        }}
                        className="btn btn-sm btn-outline"
                      >
                        🧭 Cómo llegar
                      </button>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </div>
        </div>
      </LoadScript>
    </div>
  );
};

export default GoogleMapComponent;