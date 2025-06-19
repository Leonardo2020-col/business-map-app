// ============================================================================
// CONSTANTES PARA SERVICIOS Y DOCUMENTACIÓN DE NEGOCIOS
// ============================================================================

/**
 * Configuración de servicios disponibles
 */
export const SERVICES = [
  {
    key: 'defensa_civil_expiry',
    name: 'Defensa Civil',
    shortName: 'Defensa Civil',
    icon: '🚨',
    description: 'Certificado de Defensa Civil',
    required: true,
    category: 'seguridad'
  },
  {
    key: 'extintores_expiry',
    name: 'Extintores',
    shortName: 'Extintores',
    icon: '🧯',
    description: 'Mantenimiento de extintores',
    required: true,
    category: 'seguridad'
  },
  {
    key: 'fumigacion_expiry',
    name: 'Fumigación',
    shortName: 'Fumigación',
    icon: '🦟',
    description: 'Certificado de fumigación',
    required: false,
    category: 'sanitario'
  },
  {
    key: 'pozo_tierra_expiry',
    name: 'Pozo a Tierra',
    shortName: 'Pozo Tierra',
    icon: '⚡',
    description: 'Certificado de pozo a tierra',
    required: false,
    category: 'electrico'
  },
  {
    key: 'publicidad_expiry',
    name: 'Publicidad',
    shortName: 'Publicidad',
    icon: '📢',
    description: 'Permiso de publicidad',
    required: false,
    category: 'municipal'
  }
];

/**
 * Estados posibles de los servicios
 */
export const SERVICE_STATUS = {
  EXPIRED: 'expired',
  EXPIRING_SOON: 'expiring-soon', 
  VALID: 'valid',
  NO_DATE: 'no-date'
};

/**
 * Configuración de iconos por estado
 */
export const STATUS_ICONS = {
  [SERVICE_STATUS.EXPIRED]: '🔴',
  [SERVICE_STATUS.EXPIRING_SOON]: '🟡',
  [SERVICE_STATUS.VALID]: '🟢',
  [SERVICE_STATUS.NO_DATE]: '⚪'
};

/**
 * Textos descriptivos por estado
 */
export const STATUS_TEXTS = {
  [SERVICE_STATUS.EXPIRED]: 'Vencido',
  [SERVICE_STATUS.EXPIRING_SOON]: 'Vence pronto',
  [SERVICE_STATUS.VALID]: 'Vigente',
  [SERVICE_STATUS.NO_DATE]: 'Sin fecha'
};

/**
 * Configuración de alertas
 */
export const ALERT_CONFIG = {
  DAYS_UNTIL_EXPIRY_WARNING: 30,
  DAYS_UNTIL_EXPIRY_URGENT: 7,
  SHOW_EXPIRED_PRIORITY: true
};

/**
 * Categorías de servicios
 */
export const SERVICE_CATEGORIES = {
  seguridad: {
    name: 'Seguridad',
    icon: '🛡️',
    color: '#dc3545'
  },
  sanitario: {
    name: 'Sanitario',
    icon: '🧼',
    color: '#28a745'
  },
  electrico: {
    name: 'Eléctrico',
    icon: '⚡',
    color: '#ffc107'
  },
  municipal: {
    name: 'Municipal',
    icon: '🏛️',
    color: '#007bff'
  }
};

/**
 * Obtener servicio por clave
 */
export const getServiceByKey = (key) => {
  return SERVICES.find(service => service.key === key);
};

/**
 * Obtener servicios por categoría
 */
export const getServicesByCategory = (category) => {
  return SERVICES.filter(service => service.category === category);
};

/**
 * Obtener solo los servicios requeridos
 */
export const getRequiredServices = () => {
  return SERVICES.filter(service => service.required);
};

/**
 * Obtener servicios opcionales
 */
export const getOptionalServices = () => {
  return SERVICES.filter(service => !service.required);
};