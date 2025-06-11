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
  height: '100%'
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
  const [debugInfo, setDebugInfo] = useState(null);

  // Función directa para cargar negocios sin usar axios interceptors
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
      
      // URL basada en tu configuración de producción
      const apiUrl = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';
      const fullUrl = `${apiUrl}/businesses`;
      
      console.log('🌐 Haciendo petición a:', fullUrl);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers));
      
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

  // Función mejorada para cargar datos del mapa
  const loadMapData = async () => {
    try {
      setLoading(true);
      setError('');
      setDebugInfo(null);

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
          businessResponse = apiResponse.data; // axios wraps en .data
          method = 'businessAPI';
          console.log('✅ businessAPI funcionó:', businessResponse);
        } catch (apiError) {
          console.error('❌ businessAPI también falló:', apiError);
          throw fetchError; // Lanzar el error original
        }
      }

      console.log(`📊 Datos cargados usando: ${method}`);
      console.log('📊 Respuesta completa:', businessResponse);

      // Procesar la respuesta
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
      
      // Filtrar negocios con coordenadas válidas
      const businessesWithCoords = allBusinesses.filter(business => {
        const hasCoords = business.latitude && business.longitude;
        if (!hasCoords) {
          console.log(`⚠️ Negocio sin coordenadas: ${business.name || business.id}`);
          return false;
        }
        
        const lat = parseFloat(business.latitude);
        const lng = parseFloat(business.longitude);
        const validCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
        
        if (!validCoords) {
          console.log(`⚠️ Coordenadas inválidas: ${business.name} (${business.latitude}, ${business.longitude})`);
          return false;
        }
        
        console.log(`✅ Negocio válido: ${business.name} (${lat}, ${lng})`);
        return true;
      });
      
      setBusinesses(businessesWithCoords);
      console.log(`📍 ${businessesWithCoords.length} negocios con coordenadas válidas`);
      
      // Información de debug
      setDebugInfo({
        method,
        totalReceived: allBusinesses.length,
        validCoordinates: businessesWithCoords.length,
        invalidCoordinates: allBusinesses.length - businessesWithCoords.length,
        sampleBusiness: businessesWithCoords[0] || null,
        timestamp: new Date().toISOString()
      });
      
      // Centrar mapa en el primer negocio si existe
      if (businessesWithCoords.length > 0) {
        const firstBusiness = businessesWithCoords[0];
        const newCenter = {
          lat: parseFloat(firstBusiness.latitude),
          lng: parseFloat(firstBusiness.longitude)
        };
        setCenter(newCenter);
        console.log(`🎯 Centrando mapa en: ${firstBusiness.name}`, newCenter);
      } else {
        console.log('⚠️ No hay negocios con coordenadas válidas, usando centro por defecto');
      }

      // Cargar tipos de negocio
      try {
        const typesResponse = await businessAPI.getTypes();
        if (typesResponse && typesResponse.data && typesResponse.data.success) {
          setBusinessTypes(typesResponse.data.data || []);
          console.log(`🏷️ ${typesResponse.data.data?.length || 0} tipos cargados`);
        }
      } catch (typesError) {
        console.warn('⚠️ No se pudieron cargar tipos de negocio:', typesError);
        // Extraer tipos únicos de los negocios cargados
        const uniqueTypes = [...new Set(businessesWithCoords.map(b => b.business_type))].filter(Boolean);
        setBusinessTypes(uniqueTypes);
        console.log(`🏷️ ${uniqueTypes.length} tipos extraídos de negocios`);
      }

    } catch (error) {
      console.error('❌ Error cargando datos del mapa:', error);
      const errorMessage = error.message || 'Error desconocido';
      setError(`Error cargando datos: ${errorMessage}`);
      
      setDebugInfo({
        error: errorMessage,
        timestamp: new Date().toISOString(),
        stack: error.stack
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
    console.log('🖱️ Click en marcador:', business.name);
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

  const getMarkerIcon = (businessType) => {
    const icons = {
      'restaurante': '🍽️',
      'tienda': '🛍️',
      'farmacia': '💊',
      'banco': '🏦',
      'hospital': '🏥',
      'hotel': '🏨',
      'gasolinera': '⛽',
      'supermercado': '🛒',
      'cafe': '☕',
      'gym': '💪',
      'peluqueria': '💇',
      'taller': '🔧',
      'libreria': '📚',
      'panaderia': '🥖'
    };
    
    const lowerType = businessType?.toLowerCase() || '';
    let icon = '📍'; // Default icon
    
    // Buscar coincidencias en el tipo de negocio
    for (const [key, emoji] of Object.entries(icons)) {
      if (lowerType.includes(key)) {
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

  // Componente de información de debug
  const DebugInfo = () => {
    if (!debugInfo) return null;
    
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '12px',
        maxWidth: '300px',
        zIndex: 1000,
        fontFamily: 'monospace'
      }}>
        <strong>🔧 Debug Info:</strong>
        <div style={{ marginTop: '5px' }}>
          {debugInfo.method && <div>📡 Método: {debugInfo.method}</div>}
          {debugInfo.totalReceived !== undefined && <div>📊 Total recibidos: {debugInfo.totalReceived}</div>}
          {debugInfo.validCoordinates !== undefined && <div>📍 Con coordenadas: {debugInfo.validCoordinates}</div>}
          {debugInfo.invalidCoordinates !== undefined && <div>⚠️ Sin coordenadas: {debugInfo.invalidCoordinates}</div>}
          {debugInfo.error && <div style={{color: '#ff6b6b'}}>❌ Error: {debugInfo.error}</div>}
          <div style={{ marginTop: '5px', fontSize: '10px', opacity: 0.7 }}>
            {debugInfo.timestamp}
          </div>
        </div>
      </div>
    );
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
          <p>Cargando {businesses.length} negocios...</p>
          {debugInfo && (
            <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.7 }}>
              {debugInfo.method && `Método: ${debugInfo.method}`}
            </div>
          )}
        </div>
        <DebugInfo />
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
                  <strong>{business.name}</strong><br/>
                  <small>{business.business_type} - {business.address}</small><br/>
                  <small>Coords: {business.latitude}, {business.longitude}</small>
                </div>
              ))}
              {businesses.length > 5 && <p>... y {businesses.length - 5} más</p>}
            </div>
          )}
        </div>
        <DebugInfo />
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
      >
        <div className="map-layout-clean">
          {/* Barra de controles flotante */}
          <div className="floating-controls">
            <div className="controls-group">
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
            
            <div className="map-stats">
              Mostrando {filteredBusinesses.length} de {businesses.length} negocios
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
                
                return (
                  <Marker
                    key={business.id}
                    position={{ lat, lng }}
                    icon={getMarkerIcon(business.business_type)}
                    onClick={() => onMarkerClick(business)}
                    title={`${business.name} - ${business.business_type}`}
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
                    <h4>{selectedBusiness.name}</h4>
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
      
      <DebugInfo />
    </div>
  );
};

export default GoogleMapComponent;