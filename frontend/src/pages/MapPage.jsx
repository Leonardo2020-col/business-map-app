import React from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleMapComponent from '../components/GoogleMapComponent/GoogleMapComponent';
import { useAuth } from '../contexts/AuthContext';

const MapPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="map-page-container">
      {/* Header minimalista */}
      <div className="compact-header">
        <button 
          onClick={() => navigate('/dashboard')}
          className="back-arrow-btn"
          title="Volver al Dashboard"
        >
          ←
        </button>
        
        <div className="header-info">
          <span className="map-title">Mapa de Negocios</span>
          <span className="user-badge">{user?.username}</span>
        </div>
        
        <button 
          onClick={() => navigate('/business/new')}
          className="add-btn"
          title="Agregar Negocio"
        >
          +
        </button>
      </div>

      {/* Mapa */}
      <div className="map-container-wrapper">
        <GoogleMapComponent />
      </div>
    </div>
  );
};

export default MapPage;