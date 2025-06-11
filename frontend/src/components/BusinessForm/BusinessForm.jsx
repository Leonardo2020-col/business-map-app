import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { businessAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import MapModal from '../Map/MapModal';
import Navbar from '../Navbar/Navbar';
import './BusinessForm.css';

const BusinessForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    distrito: '',
    sector: '',
    anexo: '',
    business_type: '',
    phone: '',
    email: '',
    description: '',
    latitude: '',
    longitude: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados para el modal del mapa
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const isEditing = !!id;

  // Cargar datos iniciales
  useEffect(() => {
    if (isEditing) {
      loadBusinessData();
    } else {
      loadInitialCoordinates();
    }
  }, [id]);

  // Cargar coordenadas iniciales desde URL (cuando viene del mapa)
  const loadInitialCoordinates = () => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    
    if (lat && lng) {
      const location = {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      };
      
      setSelectedLocation(location);
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng
      }));
      
      console.log('📍 Coordenadas cargadas desde URL:', location);
    }
  };

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      const response = await businessAPI.getById(id);
      const business = response.data?.data || response.data;
      
      if (business) {
        setFormData({
          name: business.name || '',
          address: business.address || '',
          distrito: business.distrito || '',
          sector: business.sector || '',
          anexo: business.anexo || '',
          business_type: business.business_type || '',
          phone: business.phone || '',
          email: business.email || '',
          description: business.description || '',
          latitude: business.latitude || '',
          longitude: business.longitude || ''
        });

        // Si tiene coordenadas, establecer la ubicación seleccionada
        if (business.latitude && business.longitude) {
          setSelectedLocation({
            lat: parseFloat(business.latitude),
            lng: parseFloat(business.longitude)
          });
        }
      }
    } catch (err) {
      console.error('Error cargando negocio:', err);
      setError('Error al cargar los datos del negocio');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar mensajes al editar
    if (error) setError('');
    if (success) setSuccess('');
  };

  // Función para abrir el modal del mapa
  const handleOpenMapModal = () => {
    setIsMapModalOpen(true);
  };

  // Función para manejar la selección de ubicación
  const handleLocationSelect = (location) => {
    console.log('📍 Ubicación seleccionada:', location);
    setSelectedLocation(location);
    
    // Actualizar los campos del formulario
    setFormData(prev => ({
      ...prev,
      latitude: location.lat.toString(),
      longitude: location.lng.toString()
    }));
    
    setIsMapModalOpen(false);
    
    // Mostrar mensaje de éxito
    setSuccess('📍 Ubicación seleccionada correctamente');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Función para limpiar la ubicación
  const handleClearLocation = () => {
    setSelectedLocation(null);
    setFormData(prev => ({
      ...prev,
      latitude: '',
      longitude: ''
    }));
    
    setSuccess('🗑️ Ubicación eliminada');
    setTimeout(() => setSuccess(''), 2000);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    if (!formData.address.trim()) {
      setError('La dirección es requerida');
      return false;
    }
    if (!formData.business_type.trim()) {
      setError('El tipo de negocio es requerido');
      return false;
    }
    
    // Validar email solo si se proporciona
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setError('El email no tiene un formato válido');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const businessData = {
        ...formData,
        email: formData.email.trim() || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      };

      if (isEditing) {
        await businessAPI.update(id, businessData);
        setSuccess('✅ Negocio actualizado exitosamente');
      } else {
        await businessAPI.create(businessData);
        setSuccess('✅ Negocio creado exitosamente');
      }

      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/businesses');
      }, 2000);

    } catch (err) {
      console.error('Error guardando negocio:', err);
      const errorMessage = err.response?.data?.message || 'Error al guardar el negocio';
      setError(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/businesses');
  };

  if (loading && isEditing) {
    return (
      <>
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner">🔄</div>
          <p>Cargando datos del negocio...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="business-form-container">
        <div className="business-form">
          {/* HEADER FIJO */}
          <div className="form-header">
            <h2>
              {isEditing ? '✏️ Editar Negocio' : '➕ Crear Nuevo Negocio'}
            </h2>
            <p className="form-subtitle">
              {isEditing ? 'Modifica los datos del negocio' : 'Completa la información del nuevo negocio'}
            </p>
          </div>

          {/* CONTENIDO SCROLLEABLE */}
          <form onSubmit={handleSubmit} className="form">
            {/* Mensajes de error y éxito */}
            {error && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <span className="alert-icon">✅</span>
                <span>{success}</span>
              </div>
            )}

            {/* Información básica */}
            <div className="form-section">
              <h3 className="section-title">📋 Información Básica</h3>
              
              <div className="form-group">
                <label htmlFor="name">🏢 Nombre del Negocio:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej: Restaurante El Buen Sabor"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="business_type">🏷️ Tipo de Negocio:</label>
                <input
                  type="text"
                  id="business_type"
                  name="business_type"
                  value={formData.business_type}
                  onChange={handleChange}
                  placeholder="Ej: Restaurante, Tienda, Farmacia, etc."
                  required
                />
                <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                  💡 Escribe el tipo de negocio que mejor describa tu actividad
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="description">📝 Descripción:</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe brevemente tu negocio..."
                  rows="3"
                />
              </div>
            </div>

            {/* Información de contacto */}
            <div className="form-section">
              <h3 className="section-title">📞 Información de Contacto</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">📱 Teléfono:</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Ej: +51 999 888 777"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    📧 Email: 
                    <span style={{ color: '#6c757d', fontWeight: 'normal', fontSize: '12px' }}>
                      (opcional)
                    </span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contacto@negocio.com (opcional)"
                  />
                </div>
              </div>
            </div>

            {/* Sección de ubicación */}
            <div className="form-section">
              <h3 className="section-title">📍 Ubicación</h3>
              
              <div className="form-group">
                <label htmlFor="address">🏠 Dirección Principal:</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Ingresa la dirección completa del negocio..."
                  rows="3"
                  required
                />
              </div>

              {/* Nuevos campos de ubicación */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="distrito">🏛️ Distrito:</label>
                  <input
                    type="text"
                    id="distrito"
                    name="distrito"
                    value={formData.distrito}
                    onChange={handleChange}
                    placeholder="Ej: San Isidro, Miraflores, etc."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sector">📍 Sector:</label>
                  <input
                    type="text"
                    id="sector"
                    name="sector"
                    value={formData.sector}
                    onChange={handleChange}
                    placeholder="Ej: Centro, Norte, Sur, etc."
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="anexo">🏘️ Anexo:</label>
                <input
                  type="text"
                  id="anexo"
                  name="anexo"
                  value={formData.anexo}
                  onChange={handleChange}
                  placeholder="Ej: Anexo 22, Villa Los Rosales, etc."
                />
              </div>

              {/* ✅ SECCIÓN DE MAPA SIMPLIFICADA - SIN COORDENADAS MANUALES */}
              <div className="form-group">
                <label>🗺️ Ubicación en el mapa:</label>
                
                {/* Información de la ubicación actual */}
                {selectedLocation ? (
                  <div className="location-selected">
                    <div className="location-info">
                      <p className="location-title">
                        ✅ Ubicación seleccionada en el mapa
                      </p>
                      <p className="location-coords">
                        📍 Coordenadas: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                      </p>
                    </div>
                    <div className="location-actions">
                      <button
                        type="button"
                        onClick={handleOpenMapModal}
                        className="btn btn-secondary"
                      >
                        📝 Cambiar Ubicación
                      </button>
                      <button
                        type="button"
                        onClick={handleClearLocation}
                        className="btn btn-outline"
                      >
                        🗑️ Limpiar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="location-empty">
                    <p className="location-message">
                      📍 No se ha seleccionado ubicación en el mapa
                    </p>
                    <p style={{ fontSize: '14px', color: '#666', margin: '10px 0' }}>
                      La ubicación en el mapa es opcional, pero ayuda a que los clientes encuentren tu negocio más fácilmente.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenMapModal}
                      className="btn btn-primary btn-map"
                    >
                      🗺️ Seleccionar en Mapa
                    </button>
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* FOOTER FIJO - Botones de acción */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary"
              disabled={loading}
            >
              ❌ Cancelar
            </button>
            
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner">🔄</span>
                  {isEditing ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  {isEditing ? '💾 Actualizar Negocio' : '➕ Crear Negocio'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* MODAL DEL MAPA */}
        <MapModal
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          onLocationSelect={handleLocationSelect}
          initialLocation={selectedLocation}
        />
      </div>
    </>
  );
};

export default BusinessForm;