// 🧪 ARCHIVO DE PRUEBA TEMPORAL: SimpleMapTest.jsx
// Crear este archivo en src/components/Map/ para probar

import React from 'react';
import { LoadScript, GoogleMap } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100vw',
  height: '100vh'
};

const center = {
  lat: -12.0464,
  lng: -77.0428
};

const SimpleMapTest = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  console.log('🧪 SimpleMapTest - API Key:', apiKey ? 'Presente' : 'Ausente');

  if (!apiKey) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#ff6b6b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '24px'
      }}>
        ❌ No hay API Key
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#4ecdc4' }}>
      <h1 style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        background: 'white',
        padding: '10px',
        borderRadius: '5px'
      }}>
        🧪 Prueba Simple de Google Maps
      </h1>
      
      <LoadScript
        googleMapsApiKey={apiKey}
        onLoad={() => {
          console.log('🧪 LoadScript cargado en test simple');
          console.log('🧪 Window.google:', window.google);
        }}
        onError={(error) => {
          console.error('🧪 Error en LoadScript:', error);
        }}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={12}
          onLoad={(map) => {
            console.log('🧪 Mapa cargado en test simple:', map);
          }}
        />
      </LoadScript>
    </div>
  );
};

export default SimpleMapTest;