import React, { useState, useCallback } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';

// Estilo del mapa para el selector (NO fullscreen)
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

const MapLocationPicker = ({ 
  onLocationSelect, 
  initialLocation = null,
  onClose 
}) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [isSelecting, setIsSelecting] = useState(!initialLocation);

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

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      {/* Header del selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '2px solid #f0f0f0'
      }}>
        <h3 style={{ margin: 0, color: '#333' }}>
          📍 Seleccionar Ubicación
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666',
              padding: '5px'
            }}
          >
            ❌
          </button>
        )}
      </div>

      {/* Instrucciones */}
      <div style={{
        background: '#e7f3ff',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '15px',
        border: '1px solid #b3d9ff'
      }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#0c5aa6' }}>
          💡 <strong>Instrucciones:</strong> {isSelecting ? 
            'Haz clic en el mapa para seleccionar la ubicación del negocio' :
            'Ubicación seleccionada. Puedes hacer clic en otro lugar para cambiarla'
          }
        </p>
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
    </div>
  );
};

export default MapLocationPicker;