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
  
  // Estados del formulario - ACTUALIZADO con nuevos campos
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
    longitude: '',
    // ✅ NUEVOS CAMPOS DE SERVICIOS
    defensa_civil_expiry: '',
    extintores_expiry: '',
    fumigacion_expiry: '',
    pozo_tierra_expiry: '',
    publicidad_expiry: ''
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
          longitude: business.longitude || '',
          // ✅ CARGAR NUEVOS CAMPOS
          defensa_civil_expiry: business.defensa_civil_expiry || '',
          extintores_expiry: business.extintores_expiry || '',
          fumigacion_expiry: business.fumigacion_expiry || '',
          pozo_tierra_expiry: business.pozo_tierra_expiry || '',
          publicidad_expiry: business.publicidad_expiry || ''
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

  // ✅ FUNCIÓN PARA VERIFICAR SI UNA FECHA ESTÁ VENCIDA
  const isExpired = (dateString) => {
    if (!dateString) return false;
    const expiryDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
    return expiryDate < today;
  };

  // ✅ FUNCIÓN PARA VERIFICAR SI UNA FECHA VENCE PRONTO (30 días)
  const isExpiringSoon = (dateString) => {
    if (!dateString) return false;
    const expiryDate = new Date(dateString);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
  };

  // ✅ FUNCIÓN PARA OBTENER LA CLASE CSS SEGÚN EL ESTADO DE LA FECHA
  const getExpiryClass = (dateString) => {
    if (!dateString) return '';
    if (isExpired(dateString)) return 'expired';
    if (isExpiringSoon(dateString)) return 'expiring-soon';
    return 'valid';
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
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        // ✅ INCLUIR FECHAS DE VENCIMIENTO (como null si están vacías)
        defensa_civil_expiry: formData.defensa_civil_expiry || null,
        extintores_expiry: formData.extintores_expiry || null,
        fumigacion_expiry: formData.fumigacion_expiry || null,
        pozo_tierra_expiry: formData.pozo_tierra_expiry || null,
        publicidad_expiry: formData.publicidad_expiry || null
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

              {/* Sección de mapa */}
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

            {/* ✅ NUEVA SECCIÓN - SERVICIOS Y VENCIMIENTOS */}
            <div className="form-section">
              <h3 className="section-title">📋 Servicios y Documentación</h3>
              <p className="section-description">
                Registra las fechas de vencimiento de los servicios y documentos importantes del negocio
              </p>
              
              {/* Defensa Civil */}
              <div className="form-group">
                <label htmlFor="defensa_civil_expiry">
                  🚨 Defensa Civil - Fecha de Vencimiento:
                </label>
                <input
                  type="date"
                  id="defensa_civil_expiry"
                  name="defensa_civil_expiry"
                  value={formData.defensa_civil_expiry}
                  onChange={handleChange}
                  className={`expiry-input ${getExpiryClass(formData.defensa_civil_expiry)}`}
                />
                {formData.defensa_civil_expiry && (
                  <div className="expiry-status">
                    {isExpired(formData.defensa_civil_expiry) && (
                      <span className="status-expired">⚠️ VENCIDO</span>
                    )}
                    {isExpiringSoon(formData.defensa_civil_expiry) && !isExpired(formData.defensa_civil_expiry) && (
                      <span className="status-expiring">⏰ Vence pronto</span>
                    )}
                    {!isExpired(formData.defensa_civil_expiry) && !isExpiringSoon(formData.defensa_civil_expiry) && (
                      <span className="status-valid">✅ Vigente</span>
                    )}
                  </div>
                )}
              </div>

              {/* Extintores */}
              <div className="form-group">
                <label htmlFor="extintores_expiry">
                  🧯 Extintores - Fecha de Vencimiento:
                </label>
                <input
                  type="date"
                  id="extintores_expiry"
                  name="extintores_expiry"
                  value={formData.extintores_expiry}
                  onChange={handleChange}
                  className={`expiry-input ${getExpiryClass(formData.extintores_expiry)}`}
                />
                {formData.extintores_expiry && (
                  <div className="expiry-status">
                    {isExpired(formData.extintores_expiry) && (
                      <span className="status-expired">⚠️ VENCIDO</span>
                    )}
                    {isExpiringSoon(formData.extintores_expiry) && !isExpired(formData.extintores_expiry) && (
                      <span className="status-expiring">⏰ Vence pronto</span>
                    )}
                    {!isExpired(formData.extintores_expiry) && !isExpiringSoon(formData.extintores_expiry) && (
                      <span className="status-valid">✅ Vigente</span>
                    )}
                  </div>
                )}
              </div>

              {/* Fumigación */}
              <div className="form-group">
                <label htmlFor="fumigacion_expiry">
                  🦟 Fumigación - Fecha de Vencimiento:
                </label>
                <input
                  type="date"
                  id="fumigacion_expiry"
                  name="fumigacion_expiry"
                  value={formData.fumigacion_expiry}
                  onChange={handleChange}
                  className={`expiry-input ${getExpiryClass(formData.fumigacion_expiry)}`}
                />
                {formData.fumigacion_expiry && (
                  <div className="expiry-status">
                    {isExpired(formData.fumigacion_expiry) && (
                      <span className="status-expired">⚠️ VENCIDO</span>
                    )}
                    {isExpiringSoon(formData.fumigacion_expiry) && !isExpired(formData.fumigacion_expiry) && (
                      <span className="status-expiring">⏰ Vence pronto</span>
                    )}
                    {!isExpired(formData.fumigacion_expiry) && !isExpiringSoon(formData.fumigacion_expiry) && (
                      <span className="status-valid">✅ Vigente</span>
                    )}
                  </div>
                )}
              </div>

              {/* Pozo a Tierra */}
              <div className="form-group">
                <label htmlFor="pozo_tierra_expiry">
                  ⚡ Pozo a Tierra - Fecha de Vencimiento:
                </label>
                <input
                  type="date"
                  id="pozo_tierra_expiry"
                  name="pozo_tierra_expiry"
                  value={formData.pozo_tierra_expiry}
                  onChange={handleChange}
                  className={`expiry-input ${getExpiryClass(formData.pozo_tierra_expiry)}`}
                />
                {formData.pozo_tierra_expiry && (
                  <div className="expiry-status">
                    {isExpired(formData.pozo_tierra_expiry) && (
                      <span className="status-expired">⚠️ VENCIDO</span>
                    )}
                    {isExpiringSoon(formData.pozo_tierra_expiry) && !isExpired(formData.pozo_tierra_expiry) && (
                      <span className="status-expiring">⏰ Vence pronto</span>
                    )}
                    {!isExpired(formData.pozo_tierra_expiry) && !isExpiringSoon(formData.pozo_tierra_expiry) && (
                      <span className="status-valid">✅ Vigente</span>
                    )}
                  </div>
                )}
              </div>

              {/* Publicidad */}
              <div className="form-group">
                <label htmlFor="publicidad_expiry">
                  📢 Publicidad - Fecha de Vencimiento:
                </label>
                <input
                  type="date"
                  id="publicidad_expiry"
                  name="publicidad_expiry"
                  value={formData.publicidad_expiry}
                  onChange={handleChange}
                  className={`expiry-input ${getExpiryClass(formData.publicidad_expiry)}`}
                />
                {formData.publicidad_expiry && (
                  <div className="expiry-status">
                    {isExpired(formData.publicidad_expiry) && (
                      <span className="status-expired">⚠️ VENCIDO</span>
                    )}
                    {isExpiringSoon(formData.publicidad_expiry) && !isExpired(formData.publicidad_expiry) && (
                      <span className="status-expiring">⏰ Vence pronto</span>
                    )}
                    {!isExpired(formData.publicidad_expiry) && !isExpiringSoon(formData.publicidad_expiry) && (
                      <span className="status-valid">✅ Vigente</span>
                    )}
                  </div>
                )}
              </div>

              <div className="services-info">
                <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic', marginTop: '20px' }}>
                  💡 <strong>Tip:</strong> Mantener actualizadas las fechas de vencimiento te ayudará a renovar estos servicios a tiempo y evitar multas o problemas legales.
                </p>
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