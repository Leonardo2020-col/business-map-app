import axios from 'axios';

// Configurar URL del API con soporte para Railway
const API_URL = import.meta.env.PROD 
  ? '/api'  // En producción (Railway), el backend sirve el frontend
  : import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🔧 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_URL: API_URL,
  environment: import.meta.env.MODE,
  isProd: import.meta.env.PROD,
  isDev: import.meta.env.DEV
});

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  timeout: import.meta.env.PROD ? 15000 : 10000, // Más tiempo en producción
  headers: {
    'Content-Type': 'application/json'
  },
  // Configuración para Railway
  withCredentials: true, // Para cookies/sessions si las usas
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('📡 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
      data: config.data,
      headers: {
        'Content-Type': config.headers['Content-Type'],
        'Authorization': config.headers.Authorization ? '***' : 'none'
      }
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores (mejorado para Railway)
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data
    });

    // Manejar errores de autenticación
    if (error.response?.status === 401) {
      console.log('🚪 Unauthorized - clearing session');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // En Railway, redirigir sin cambiar el dominio
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    // Manejar errores específicos con mensajes útiles
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Error: Timeout de la petición');
      error.userMessage = 'La petición tardó demasiado tiempo. Intenta de nuevo.';
    }
    
    if (error.message === 'Network Error') {
      console.error('🔌 Error: No se puede conectar con el servidor');
      console.error('🔍 Verificar conexión. URL del API:', API_URL);
      
      if (import.meta.env.PROD) {
        error.userMessage = 'Error de conexión. Verifica tu conexión a internet.';
      } else {
        error.userMessage = `No se puede conectar con el servidor en ${API_URL}. ¿Está el backend ejecutándose?`;
      }
    }

    if (error.response?.status === 404) {
      console.error('🔍 Error 404: Endpoint no encontrado');
      error.userMessage = 'Endpoint no encontrado en el servidor';
    }

    if (error.response?.status === 400) {
      console.error('📝 Error 400: Bad Request');
      error.userMessage = error.response.data?.message || 'Datos de entrada inválidos';
    }

    if (error.response?.status === 500) {
      console.error('🚨 Error 500: Internal Server Error');
      error.userMessage = 'Error interno del servidor. Intenta de nuevo más tarde.';
    }

    // Errores específicos de Railway
    if (error.response?.status === 502 || error.response?.status === 503) {
      console.error('🚂 Railway Error: Service temporarily unavailable');
      error.userMessage = 'Servicio temporalmente no disponible. Intenta en unos momentos.';
    }
    
    return Promise.reject(error);
  }
);

// API de autenticación
export const authAPI = {
  login: async (credentials) => {
    console.log('🔐 authAPI.login called:', {
      username: credentials.username,
      hasPassword: !!credentials.password,
      passwordLength: credentials.password?.length
    });
    
    try {
      const response = await api.post('/auth/login', credentials);
      console.log('✅ Login successful');
      return response;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  },

  register: (userData) => {
    console.log('📝 authAPI.register called');
    return api.post('/auth/register', userData);
  },

  verify: () => {
    console.log('🔍 authAPI.verify called');
    return api.get('/auth/verify');
  },

  profile: () => {
    console.log('👤 authAPI.profile called');
    return api.get('/auth/profile');
  },

  changePassword: (passwords) => {
    console.log('🔒 authAPI.changePassword called');
    return api.put('/auth/change-password', passwords);
  }
};

// API de negocios
export const businessAPI = {
  getAll: (params = {}) => {
    console.log('📋 businessAPI.getAll called with params:', params);
    return api.get('/businesses', { params });
  },

  getById: (id) => {
    console.log(`🔍 businessAPI.getById called with id: ${id}`);
    return api.get(`/businesses/${id}`);
  },

  create: (business) => {
    console.log('➕ businessAPI.create called');
    return api.post('/businesses', business);
  },

  update: (id, business) => {
    console.log(`✏️ businessAPI.update called with id: ${id}`);
    return api.put(`/businesses/${id}`, business);
  },

  delete: (id) => {
    console.log(`🗑️ businessAPI.delete called with id: ${id}`);
    return api.delete(`/businesses/${id}`);
  },

  getStats: () => {
    console.log('📊 businessAPI.getStats called');
    return api.get('/businesses/stats/summary');
  },

  getTypes: () => {
    console.log('🏷️ businessAPI.getTypes called');
    return api.get('/businesses/types/list');
  }
};

// API del sistema
export const systemAPI = {
  health: () => {
    console.log('💓 systemAPI.health called');
    return api.get('/health');
  },

  info: () => {
    console.log('ℹ️ systemAPI.info called');
    return api.get('/');
  }
};

// Función de utilidad para test directo (mejorada para Railway)
export const testConnection = async () => {
  try {
    console.log('🧪 Testing direct connection...');
    console.log('🎯 Target URL:', `${API_URL}/health`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: import.meta.env.PROD ? 'same-origin' : 'include',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Connection test successful:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    
    if (error.name === 'AbortError') {
      return { success: false, error: 'Timeout: Connection test took too long' };
    }
    
    return { success: false, error: error.message };
  }
};

// Función helper para comprobar si el API está disponible
export const checkAPIHealth = async () => {
  try {
    const response = await systemAPI.health();
    return {
      available: true,
      status: response.data.status,
      environment: response.data.environment,
      database: response.data.database
    };
  } catch (error) {
    return {
      available: false,
      error: error.userMessage || error.message
    };
  }
};

// Exportar la configuración actual para debugging
export const getAPIConfig = () => ({
  baseURL: API_URL,
  environment: import.meta.env.MODE,
  isProd: import.meta.env.PROD,
  isDev: import.meta.env.DEV,
  viteApiUrl: import.meta.env.VITE_API_URL
});

export default api;