import React from 'react';
import { Link } from 'react-router-dom';
import GoogleMapComponent from '../components/GoogleMapComponent/GoogleMapComponent';
import { useAuth } from '../contexts/AuthContext';
import './MapPage.css';

const MapPage = () => {
  const { user } = useAuth();

  return (
    <div className="map-page">
      {/* Header navegación */}
      <div className="map-page-header">
        <div className="header-content">
          <div className="header-left">
            <Link to="/dashboard" className="back-btn">
              ← Volver al Dashboard
            </Link>
            <h1>🗺️ Mapa de Negocios</h1>
          </div>
          
          <div className="header-right">
            <span className="user-info">
              👤 {user?.username}
            </span>
            <Link to="/business/new" className="add-business-btn">
              ➕ Agregar Negocio
            </Link>
          </div>
        </div>
      </div>

      {/* Componente del mapa */}
      <div className="map-content">
        <GoogleMapComponent />
      </div>
    </div>
  );
};

export default MapPage;