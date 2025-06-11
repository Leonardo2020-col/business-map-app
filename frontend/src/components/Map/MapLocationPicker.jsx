import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';

// Estilo del mapa para el selector
const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px',
  border: '2px solid #e0e0e0'
};

// Centro inicial en Lima, Perú
const defaultCenter = {
  lat: -12.0464,
  lng: -77.0428
};

const mapOptions = {
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  gestureHandling: 'greedy',
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'on' }]
    }
  ]
};

const MapLocationPicker = ({ 
  onLocationSelect, 
  initialLocation = null,
  onClose 
}) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [isSelecting, setIsSelecting] = useState(!initialLocation);
  const [mapError, setMapError] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Verificar que Google Maps esté disponible
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsMapLoaded(true);
        setMapError(null);
      } else {
        setMapError('Google Maps no está disponible');
      }
    };

    // Verificar inmediatamente
    checkGoogleMaps();

    // Verificar periódicamente si no está cargado
    const interval = setInterval(() => {
      if (!isMapLoaded) {
        checkGoogleMaps();
      } else {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isMapLoaded]);

  // Manejar click en el mapa para seleccionar ubicación
  const handleMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    const newLocation = { lat, lng };
    setSelectedLocation(newLocation);
    setIsSelecting(false);
    
    console.log('📍 Ubicación seleccionada:', newLocation);
  }, []);

  // Confirmar la ubicación seleccionada
  const handleConfirmLocation = () => {
    if (selectedLocation && onLocationSelect) {
      onLocationSelect(selectedLocation);
    }
  };

  // Limpiar selección
  const handleClearLocation = () => {
    setSelectedLocation(null);
    setIsSelecting(true);
  };

  // Obtener ubicación actual del usuario
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setSelectedLocation(newLocation);
          setIsSelecting(false);
          setIsGettingLocation(false);
          console.log('📍 Ubicación actual obtenida:', newLocation);
        },
        (error) => {
          setIsGettingLocation(false);
          console.error('Error obteniendo ubicación:', error);
          let errorMessage = 'No se pudo obtener tu ubicación actual.';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permiso de ubicación denegado. Por favor, habilita la ubicación en tu navegador.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Información de ubicación no disponible.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado para obtener la ubicación.';
              break;
          }
          
          alert(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        }
      );
    } else {
      alert('Geolocalización no soportada en este navegador');
    }
  };

  // Si hay error del mapa
  if (mapError) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center',
        border: '2px solid #dc3545'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '15px' }}>⚠️</div>
        <h3 style={{ color: '#dc3545', margin: '0 0 10px 0' }}>Error en el mapa</h3>
        <p style={{ color: '#666', margin: '0 0 20px 0' }}>{mapError}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            🔄 Recargar página
          </button>
          {onClose && (
            <button onClick={onClose} className="btn btn-secondary">
              ❌ Cerrar
            </button>
          )}
        </div>
      </div>
    );
  }

  // Si no está cargado el mapa
  if (!isMapLoaded) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <div style={{
          height: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '2px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🗺️</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Cargando Google Maps...</h3>
          <p style={{ margin: 0, color: '#666' }}>Esto puede tardar unos segundos</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      padding: '0' // Sin padding para el contenedor principal
    }}>
      {/* Botón para obtener ubicación actual */}
      <div style={{
        marginBottom: '15px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <button
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation}
          style={{
            padding: '12px 24px',
            background: isGettingLocation ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: isGettingLocation ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            if (!isGettingLocation) {
              e.target.style.background = '#218838';
              e.target.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseOut={(e) => {
            if (!isGettingLocation) {
              e.target.style.background = '#28a745';
              e.target.style.transform = 'translateY(0)';
            }
          }}
        >
          {isGettingLocation ? (
            <>
              <span style={{ 
                animation: 'spin 1s linear infinite',
                display: 'inline-block'
              }}>⏳</span>
              Obteniendo ubicación...
            </>
          ) : (
            <>
              📍 Usar mi ubicación actual
            </>
          )}
        </button>
      </div>

      {/* Información de la ubicación seleccionada */}
      {selectedLocation && (
        <div style={{
          background: '#d4edda',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '15px',
          border: '1px solid #c3e6cb'
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#155724' }}>
            ✅ <strong>Ubicación seleccionada:</strong><br/>
            Latitud: {selectedLocation.lat.toFixed(6)}<br/>
            Longitud: {selectedLocation.lng.toFixed(6)}
          </p>
        </div>
      )}

      {/* Mapa */}
      <div style={{ marginBottom: '20px' }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={selectedLocation || defaultCenter}
          zoom={selectedLocation ? 16 : 12}
          onClick={handleMapClick}
          options={{
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy'
          }}
        >
          {/* Marcador de la ubicación seleccionada */}
          {selectedLocation && (
            <Marker
              position={selectedLocation}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: window.google?.maps?.Size ? 
                  new window.google.maps.Size(40, 40) : 
                  undefined
              }}
              animation={window.google?.maps?.Animation?.BOUNCE}
            />
          )}
        </GoogleMap>
      </div>

      {/* Botones de acción */}
      <div style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end',
        flexWrap: 'wrap'
      }}>
        {selectedLocation && (
          <button
            onClick={handleClearLocation}
            style={{
              padding: '10px 20px',
              background: '#f8f9fa',
              color: '#333',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            🗑️ Limpiar
          </button>
        )}
        
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            ❌ Cancelar
          </button>
        )}

        <button
          onClick={handleConfirmLocation}
          disabled={!selectedLocation}
          style={{
            padding: '10px 20px',
            background: selectedLocation ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: selectedLocation ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: 'bold',
            opacity: selectedLocation ? 1 : 0.6
          }}
        >
          ✅ Confirmar Ubicación
        </button>
      </div>

      {/* Estilos CSS inline para la animación */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default MapLocationPicker;