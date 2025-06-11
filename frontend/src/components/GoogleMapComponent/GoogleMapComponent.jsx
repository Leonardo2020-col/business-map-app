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

  // Cargar datos al montar el componente
  useEffect(() => {
    loadMapData();
  }, []);

  // Filtrar negocios cuando cambia el tipo seleccionado
  useEffect(() => {
    filterBusinesses();
  }, [businesses, selectedType]);

  const loadMapData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🗺️ Cargando datos para el mapa...');

      // Cargar negocios y tipos en paralelo
      const [businessResponse, typesResponse] = await Promise.all([
        businessAPI.getAll({ limit: 500 }), // Cargar más negocios
        businessAPI.getTypes()
      ]);

      console.log('📊 Respuesta de negocios:', businessResponse);

      if (businessResponse && businessResponse.success) {
        const allBusinesses = businessResponse.data || [];
        console.log(`📋 Total negocios recibidos: ${allBusinesses.length}`);
        
        // Filtrar solo negocios con coordenadas válidas
        const businessesWithCoords = allBusinesses.filter(business => {
          const hasCoords = business.latitude && business.longitude;
          const lat = parseFloat(business.latitude);
          const lng = parseFloat(business.longitude);
          const validCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
          
          if (hasCoords && validCoords) {
            console.log(`✅ Negocio con coordenadas válidas: ${business.name} (${lat}, ${lng})`);
            return true;
          } else {
            console.log(`❌ Negocio sin coordenadas: ${business.name}`);
            return false;
          }
        });
        
        setBusinesses(businessesWithCoords);
        console.log(`📍 ${businessesWithCoords.length} negocios con coordenadas válidas cargados`);
        
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
          console.log('⚠️ No hay negocios con coordenadas, usando centro por defecto');
        }
      } else {
        console.error('❌ Error en respuesta de negocios:', businessResponse);
      }

      if (typesResponse && typesResponse.success) {
        setBusinessTypes(typesResponse.data || []);
        console.log(`🏷️ ${typesResponse.data?.length || 0} tipos de negocio cargados`);
      }

    } catch (error) {
      console.error('❌ Error cargando datos del mapa:', error);
      setError('Error cargando datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterBusinesses = () => {
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
  };

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

  // Si no hay API key, mostrar mensaje
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="map-container">
        <div className="map-error">
          <h2>🗺️ Google Maps no configurado</h2>
          <p>Se requiere una API Key de Google Maps para mostrar el mapa.</p>
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
          <p>Preparando {businesses.length} negocios</p>
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
                
                console.log(`🗺️ Renderizando marcador: ${business.name} en (${lat}, ${lng})`);
                
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
    </div>
  );
};

export default GoogleMapComponent;