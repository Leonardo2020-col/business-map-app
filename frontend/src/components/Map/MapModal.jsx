import React, { useEffect } from 'react';
import { LoadScript } from '@react-google-maps/api';
import MapLocationPicker from './MapLocationPicker';

const libraries = ['places'];
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const MapModal = ({ 
  isOpen, 
  onClose, 
  onLocationSelect, 
  initialLocation = null 
}) => {
  // Manejar ESC para cerrar
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Manejar selección de ubicación
  const handleLocationSelect = (location) => {
    onLocationSelect(location);
    onClose();
  };

  // No renderizar si no está abierto
  if (!isOpen) return null;

  // Si no hay API key, mostrar mensaje
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div style={overlayStyle}>
        <div style={contentStyle}>
          <div style={headerStyle}>
            <h3 style={{ margin: 0, color: '#dc3545' }}>⚠️ Configuración requerida</h3>
            <button onClick={onClose} style={closeButtonStyle}>✕</button>
          </div>
          <div style={{ padding: '20px' }}>
            <p style={{ margin: '0 0 15px 0', color: '#666' }}>
              No se encontró la API Key de Google Maps.
            </p>
            <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '14px' }}>
              Agrega <code>VITE_GOOGLE_MAPS_API_KEY</code> a tu archivo de variables de entorno.
            </p>
            <button onClick={onClose} className="btn btn-primary">
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle} onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0, color: '#333' }}>📍 Seleccionar Ubicación</h3>
          <button onClick={onClose} style={closeButtonStyle}>✕</button>
        </div>
        
        <div style={{ padding: '20px' }}>
          {/* Instrucciones */}
          <div style={instructionsStyle}>
            <p style={{ margin: 0, fontSize: '14px', color: '#0c5aa6' }}>
              💡 <strong>Instrucciones:</strong> Haz clic en el mapa para seleccionar la ubicación del negocio
            </p>
          </div>

          {/* LoadScript debe envolver SOLO el componente que use Google Maps */}
          <LoadScript
            googleMapsApiKey={GOOGLE_MAPS_API_KEY}
            libraries={libraries}
            onLoad={() => {
              console.log('✅ Google Maps cargado en modal');
            }}
            onError={(error) => {
              console.error('❌ Error cargando Google Maps:', error);
            }}
            loadingElement={
              <div style={loadingStyle}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🗺️</div>
                <p>Cargando Google Maps...</p>
              </div>
            }
          >
            <MapLocationPicker
              onLocationSelect={handleLocationSelect}
              initialLocation={initialLocation}
              onClose={onClose}
            />
          </LoadScript>
        </div>
      </div>
    </div>
  );
};

// Estilos inline para evitar conflictos
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10000,
  padding: '20px',
  backdropFilter: 'blur(5px)'
};

// ✅ CORREGIDO: Eliminé el maxWidth duplicado
const contentStyle = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  maxWidth: '700px', // ✅ Solo una vez - valor más específico
  width: '100%',
  maxHeight: '90vh',
  overflow: 'auto',
  animation: 'fadeInScale 0.3s ease-out'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 20px 0 20px',
  borderBottom: '2px solid #f0f0f0',
  paddingBottom: '15px',
  marginBottom: '0'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '20px',
  cursor: 'pointer',
  color: '#666',
  padding: '5px',
  borderRadius: '50%',
  width: '35px',
  height: '35px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const instructionsStyle = {
  background: '#e7f3ff',
  padding: '12px',
  borderRadius: '8px',
  marginBottom: '15px',
  border: '1px solid #b3d9ff'
};

const loadingStyle = {
  height: '400px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  border: '2px solid #e0e0e0'
};

export default MapModal;