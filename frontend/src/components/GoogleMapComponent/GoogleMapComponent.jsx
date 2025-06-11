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
  lat: -12.0464, // Lima, Perú (ajusta según tu región)
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
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);

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
        businessAPI.getAll({ limit: 200 }), // Cargar más para el mapa
        businessAPI.getTypes()
      ]);

      if (businessResponse.success) {
        // Filtrar solo negocios con coordenadas
        const businessesWithCoords = businessResponse.data.filter(
          business => business.latitude && business.longitude
        );
        
        setBusinesses(businessesWithCoords);
        console.log(`📍 ${businessesWithCoords.length} negocios con coordenadas cargados`);
        
        // Centrar mapa en el primer negocio si existe
        if (businessesWithCoords.length > 0) {
          setCenter({
            lat: parseFloat(businessesWithCoords[0].latitude),
            lng: parseFloat(businessesWithCoords[0].longitude)
          });
        }
      }

      if (typesResponse.success) {
        setBusinessTypes(typesResponse.data);
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
    } else {
      const filtered = businesses.filter(
        business => business.business_type === selectedType
      );
      setFilteredBusinesses(filtered);
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
    setSelectedBusiness(business);
    setCenter({
      lat: parseFloat(business.latitude),
      lng: parseFloat(business.longitude)
    });
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
      'cafe': '☕'
    };
    
    const icon = icons[businessType.toLowerCase()] || '📍';
    
    return {
      url: `data:image/svg+xml;charset=UTF-8,%3csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3e%3ctext y='50%25' font-size='24' text-anchor='middle' dominant-baseline='middle' x='50%25'%3e${icon}%3c/text%3e%3c/svg%3e`,
      scaledSize: { width: 40, height: 40 }
    };
  };

  const centerMapOnBusiness = (business) => {
    if (map) {
      const position = {
        lat: parseFloat(business.latitude),
        lng: parseFloat(business.longitude)
      };
      map.panTo(position);
      map.setZoom(16);
      setSelectedBusiness(business);
    }
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
          <div className="business-list-fallback">
            <h3>Negocios disponibles:</h3>
            {businesses.map(business => (
              <div key={business.id} className="business-item">
                <h4>{business.name}</h4>
                <p>{business.address}</p>
                <button
                  onClick={() => {
                    const url = `https://www.google.com/maps?q=${business.latitude},${business.longitude}`;
                    window.open(url, '_blank');
                  }}
                >
                  Ver en Google Maps
                </button>
              </div>
            ))}
          </div>
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
          <p>Preparando datos de negocios</p>
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
        <div className="map-layout">
          {/* Panel de controles */}
          <div className={`map-controls ${isControlsCollapsed ? 'collapsed' : ''}`}>
            <div className="controls-header">
              <h3>🗺️ Mapa de Negocios</h3>
              <button
                onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
                className="collapse-btn"
                title={isControlsCollapsed ? 'Expandir panel' : 'Contraer panel'}
              >
                {isControlsCollapsed ? '📋' : '❌'}
              </button>
            </div>

            {!isControlsCollapsed && (
              <div className="controls-content">
                {/* Estadísticas */}
                <div className="stats-section">
                  <div className="stat-item">
                    <span className="stat-number">{businesses.length}</span>
                    <span className="stat-label">Total negocios</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{filteredBusinesses.length}</span>
                    <span className="stat-label">Mostrando</span>
                  </div>
                </div>

                {/* Filtros */}
                <div className="filter-section">
                  <label htmlFor="typeFilter">Filtrar por tipo:</label>
                  <select
                    id="typeFilter"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Todos los tipos ({businesses.length})</option>
                    {businessTypes.map((type) => {
                      const count = businesses.filter(b => b.business_type === type).length;
                      return (
                        <option key={type} value={type}>
                          {type} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Controles de ubicación */}
                <div className="location-controls">
                  <button
                    onClick={getCurrentLocation}
                    className="btn btn-outline"
                    title="Ir a mi ubicación"
                  >
                    📍 Mi ubicación
                  </button>
                  
                  <button
                    onClick={() => {
                      setCenter(defaultCenter);
                      if (map) {
                        map.panTo(defaultCenter);
                        map.setZoom(11);
                      }
                    }}
                    className="btn btn-outline"
                    title="Vista general"
                  >
                    🌍 Vista general
                  </button>
                </div>

                {/* Lista de negocios */}
                <div className="businesses-list">
                  <h4>Negocios en el mapa:</h4>
                  <div className="businesses-scroll">
                    {filteredBusinesses.map((business) => (
                      <div
                        key={business.id}
                        className={`business-item ${
                          selectedBusiness?.id === business.id ? 'selected' : ''
                        }`}
                        onClick={() => centerMapOnBusiness(business)}
                      >
                        <div className="business-icon">
                          {getMarkerIcon(business.business_type).url.match(/(%3e)(.*?)(%3c)/)?.[2] || '📍'}
                        </div>
                        <div className="business-info">
                          <h5>{business.name}</h5>
                          <p className="business-type">{business.business_type}</p>
                          <p className="business-address">{business.address}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* El mapa */}
          <div className="map-wrapper">
            {mapLoading && (
              <div className="map-loading-overlay">
                <div className="loading-spinner"></div>
                <p>Cargando Google Maps...</p>
              </div>
            )}
            
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={11}
              options={mapOptions}
              onLoad={onMapLoad}
              onError={onMapError}
            >
              {/* Marcadores de negocios */}
              {filteredBusinesses.map((business) => (
                <Marker
                  key={business.id}
                  position={{
                    lat: parseFloat(business.latitude),
                    lng: parseFloat(business.longitude)
                  }}
                  icon={getMarkerIcon(business.business_type)}
                  onClick={() => onMarkerClick(business)}
                  title={business.name}
                />
              ))}

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