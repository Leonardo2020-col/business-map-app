import React, { useEffect } from 'react';
import MapLocationPicker from './MapLocationPicker';

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

  return (
    <div
      style={{
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
      }}
      onClick={(e) => {
        // Cerrar si se hace clic en el fondo
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          animation: 'fadeInScale 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <MapLocationPicker
          onLocationSelect={handleLocationSelect}
          initialLocation={initialLocation}
          onClose={onClose}
        />
      </div>

      {/* Estilos de animación */}
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default MapModal;