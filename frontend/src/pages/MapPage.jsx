import React, { useEffect } from 'react';
import GoogleMapComponent from '../components/GoogleMapComponent/GoogleMapComponent';

const MapPage = () => {
  // Agregar clase al body para mapa fullscreen
  useEffect(() => {
    document.body.classList.add('map-page');
    
    // Cleanup: remover la clase cuando el componente se desmonte
    return () => {
      document.body.classList.remove('map-page');
    };
  }, []);

  return (
    // Sin header, sin navbar, sin nada - solo el mapa
    <GoogleMapComponent />
  );
};

export default MapPage;