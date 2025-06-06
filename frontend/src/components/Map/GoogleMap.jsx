import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';

// ✅ ADAPTADO: Estilo fullscreen en lugar de 400px
const containerStyle = {
  width: '100vw',
  height: '100vh',
  position: 'absolute',
  top: 0,
  left: 0
};

// Centro inicial en Lima, Perú
const center = {
  lat: -12.0464,
  lng: -77.0428
};

function MyGoogleMap({ businesses = [] }) {
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [mapError, setMapError] = useState(null);

  // Obtener API key del environment
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Verificar que tenemos API key
  useEffect(() => {
    if (!apiKey) {
      setMapError('No se encontró la API key de Google Maps. Verifica tu archivo .env');
      console.error('❌ Google Maps API key not found in environment variables');
    } else {
      console.log('✅ Google Maps API key found');
      setMapError(null);
    }
  }, [apiKey]);

  // Si no hay API key, mostrar mensaje de error
  if (!apiKey) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#667eea',
        color: 'white',
        flexDirection: 'column',
        gap: '15px',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{ fontSize: '5rem' }}>🗺️</div>
        <h3 style={{ margin: 0 }}>Mapa no disponible</h3>
        <p style={{ margin: 0, maxWidth: '600px' }}>
          No se encontró la API key de Google Maps.<br />
          Agrega <code>VITE_GOOGLE_MAPS_API_KEY</code> a tu archivo .env
        </p>
      </div>
    );
  }

  // Si hay error del mapa, mostrar mensaje
  if (mapError) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ff6b6b',
        color: 'white',
        flexDirection: 'column',
        gap: '15px',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{ fontSize: '5rem' }}>⚠️</div>
        <h3 style={{ margin: 0 }}>Error en el mapa</h3>
        <p style={{ margin: 0, maxWidth: '600px' }}>
          {mapError}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 20px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '2px solid white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔄 Recargar página
        </button>
      </div>
    );
  }

  // Verificar si Google Maps ya está disponible
  const isGoogleMapsLoaded = window.google && window.google.maps;

  if (!isGoogleMapsLoaded) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4ecdc4',
        color: 'white',
        fontSize: '24px',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🗺️</div>
          <div>Esperando a que cargue Google Maps...</div>
          <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.8 }}>
            Esto puede tardar unos segundos
          </div>
        </div>
      </div>
    );
  }

  // Filtrar solo negocios con coordenadas válidas
  const businessesWithCoords = businesses.filter(business => 
    business.latitude && 
    business.longitude && 
    !isNaN(parseFloat(business.latitude)) && 
    !isNaN(parseFloat(business.longitude))
  );

  console.log(`📍 Showing ${businessesWithCoords.length} businesses on map`);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* ✅ GoogleMap sin LoadScript ya que se maneja globalmente */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        options={{
          zoomControl: true,
          mapTypeControl: true,
          scaleControl: true,
          streetViewControl: true,
          rotateControl: false,
          fullscreenControl: true,
          gestureHandling: 'greedy'
        }}
      >
        {businessesWithCoords.map(business => (
          <Marker
            key={business.id}
            position={{
              lat: parseFloat(business.latitude),
              lng: parseFloat(business.longitude)
            }}
            title={business.name}
            onClick={() => setSelectedBusiness(business)}
            icon={{
              url: getMarkerIcon(business.business_type),
              scaledSize: window.google?.maps?.Size ? 
                new window.google.maps.Size(32, 32) : 
                undefined
            }}
          />
        ))}

        {selectedBusiness && (
          <InfoWindow
            position={{
              lat: parseFloat(selectedBusiness.latitude),
              lng: parseFloat(selectedBusiness.longitude)
            }}
            onCloseClick={() => setSelectedBusiness(null)}
          >
            <div style={{ maxWidth: '300px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
                {selectedBusiness.name}
              </h4>
              <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                <strong>📍 Dirección:</strong> {selectedBusiness.address}
              </p>
              <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                <strong>🏢 Tipo:</strong> {selectedBusiness.business_type}
              </p>
              {selectedBusiness.phone && (
                <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                  <strong>📞 Teléfono:</strong> {selectedBusiness.phone}
                </p>
              )}
              {selectedBusiness.email && (
                <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                  <strong>📧 Email:</strong> {selectedBusiness.email}
                </p>
              )}
              {selectedBusiness.description && (
                <p style={{ margin: '10px 0 0 0', color: '#666', fontSize: '13px' }}>
                  {selectedBusiness.description}
                </p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

// Función para obtener íconos según el tipo de negocio
const getMarkerIcon = (businessType) => {
  const icons = {
    'Restaurante': 'https://maps.google.com/mapfiles/ms/icons/restaurant.png',
    'Hospital': 'https://maps.google.com/mapfiles/ms/icons/hospitals.png',
    'Banco': 'https://maps.google.com/mapfiles/ms/icons/dollar.png',
    'Farmacia': 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    'Supermercado': 'https://maps.google.com/mapfiles/ms/icons/shopping.png',
    'Gimnasio': 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
    'Escuela': 'https://maps.google.com/mapfiles/ms/icons/schools.png',
    'Taller': 'https://maps.google.com/mapfiles/ms/icons/mechanic.png',
    'Tienda': 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
  };
  
  return icons[businessType] || 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
};

export default MyGoogleMap;