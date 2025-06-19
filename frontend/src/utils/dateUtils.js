// ============================================================================
// UTILIDADES PARA MANEJO DE FECHAS DE SERVICIOS
// ============================================================================

/**
 * Verifica si una fecha ha vencido
 * @param {string} dateString - Fecha en formato string
 * @returns {boolean} - True si la fecha ha vencido
 */
export const isExpired = (dateString) => {
  if (!dateString) return false;
  const expiryDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiryDate < today;
};

/**
 * Verifica si una fecha vence pronto (próximos 30 días)
 * @param {string} dateString - Fecha en formato string
 * @param {number} daysAhead - Días a futuro para considerar (default: 30)
 * @returns {boolean} - True si la fecha vence pronto
 */
export const isExpiringSoon = (dateString, daysAhead = 30) => {
  if (!dateString) return false;
  const expiryDate = new Date(dateString);
  const today = new Date();
  const futureDate = new Date(today.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
  return expiryDate >= today && expiryDate <= futureDate;
};

/**
 * Formatea una fecha para mostrarla en español
 * @param {string} dateString - Fecha en formato string
 * @param {object} options - Opciones de formateo
 * @returns {string} - Fecha formateada
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return date.toLocaleDateString('es-PE', defaultOptions);
};

/**
 * Obtiene el estado de una fecha de servicio
 * @param {string} dateString - Fecha en formato string
 * @returns {string} - Estado: 'expired', 'expiring-soon', 'valid', 'no-date'
 */
export const getDateStatus = (dateString) => {
  if (!dateString) return 'no-date';
  if (isExpired(dateString)) return 'expired';
  if (isExpiringSoon(dateString)) return 'expiring-soon';
  return 'valid';
};

/**
 * Obtiene el icono correspondiente al estado
 * @param {string} status - Estado de la fecha
 * @returns {string} - Emoji del estado
 */
export const getStatusIcon = (status) => {
  const icons = {
    expired: '🔴',
    'expiring-soon': '🟡',
    valid: '🟢',
    'no-date': '⚪'
  };
  return icons[status] || '⚪';
};

/**
 * Obtiene el texto descriptivo del estado
 * @param {string} status - Estado de la fecha
 * @returns {string} - Texto descriptivo
 */
export const getStatusText = (status) => {
  const texts = {
    expired: 'Vencido',
    'expiring-soon': 'Vence pronto',
    valid: 'Vigente',
    'no-date': 'Sin fecha'
  };
  return texts[status] || 'Sin fecha';
};

/**
 * Calcula días restantes hasta el vencimiento
 * @param {string} dateString - Fecha en formato string
 * @returns {number|null} - Días restantes (negativo si ya venció)
 */
export const getDaysUntilExpiry = (dateString) => {
  if (!dateString) return null;
  
  const expiryDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Obtiene el próximo vencimiento de una lista de fechas
 * @param {object} dates - Objeto con fechas de servicios
 * @returns {object|null} - Información del próximo vencimiento
 */
export const getNextExpiry = (dates) => {
  const validDates = Object.entries(dates)
    .filter(([key, value]) => value)
    .map(([key, value]) => ({
      service: key,
      date: value,
      daysUntil: getDaysUntilExpiry(value)
    }))
    .filter(item => item.daysUntil !== null)
    .sort((a, b) => a.daysUntil - b.daysUntil);
  
  return validDates.length > 0 ? validDates[0] : null;
};

/**
 * Verifica si un negocio tiene problemas con sus servicios
 * @param {object} business - Objeto del negocio
 * @param {array} serviceFields - Array con nombres de campos de servicios
 * @returns {boolean} - True si tiene servicios vencidos o por vencer
 */
export const hasServiceIssues = (business, serviceFields = [
  'defensa_civil_expiry',
  'extintores_expiry', 
  'fumigacion_expiry',
  'pozo_tierra_expiry',
  'publicidad_expiry'
]) => {
  return serviceFields.some(field => {
    const dateValue = business[field];
    return dateValue && (isExpired(dateValue) || isExpiringSoon(dateValue));
  });
};