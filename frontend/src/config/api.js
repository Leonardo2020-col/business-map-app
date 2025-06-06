// frontend/src/config/api.js
const API_BASE_URL = import.meta.env.PROD 
  ? '/api'  // En producción, el backend sirve el frontend
  : 'http://localhost:5000/api';  // En desarrollo, servidor separado

export default API_BASE_URL;

// También puedes exportar URLs específicas
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    VERIFY: `${API_BASE_URL}/auth/verify`
  },
  BUSINESSES: {
    GET_ALL: `${API_BASE_URL}/businesses`,
    CREATE: `${API_BASE_URL}/businesses`,
    UPDATE: (id) => `${API_BASE_URL}/businesses/${id}`,
    DELETE: (id) => `${API_BASE_URL}/businesses/${id}`
  },
  HEALTH: `${API_BASE_URL}/health`
};