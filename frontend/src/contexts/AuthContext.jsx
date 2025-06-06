import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      console.log('🔍 Checking auth:', { 
        hasToken: !!token, 
        hasStoredUser: !!storedUser 
      });
      
      if (token && storedUser) {
        // Intentar verificar el token con el servidor
        try {
          console.log('📡 Verificando token con servidor...');
          const response = await authAPI.verify();
          console.log('✅ Token válido, usuario:', response.data.user);
          setUser(response.data.user);
        } catch (error) {
          // Si el token no es válido, usar los datos almacenados localmente
          console.warn('⚠️ Token verification failed, using stored user data:', error.message);
          setUser(JSON.parse(storedUser));
        }
      }
    } catch (error) {
      console.error('❌ Error checking auth:', error);
      // Limpiar datos si hay error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const login = async (credentials) => {
    try {
      console.log('🚀 AuthContext: Iniciando login...');
      console.log('📦 Credentials enviadas:', {
        username: credentials.username,
        password: credentials.password ? '***' : 'empty',
        hasUsername: !!credentials.username,
        hasPassword: !!credentials.password
      });

      // Validación adicional
      if (!credentials.username || !credentials.password) {
        throw new Error('Username y password son requeridos');
      }

      console.log('📡 Llamando authAPI.login...');
      const response = await authAPI.login(credentials);
      
      console.log('📥 Respuesta completa del servidor:', response);
      console.log('📊 Status code:', response.status);
      console.log('📋 Response data:', response.data);
      
      // Verificar estructura de respuesta
      if (!response.data) {
        throw new Error('Respuesta del servidor sin data');
      }

      const { token, user: userData } = response.data;
      
      if (!token) {
        throw new Error('No se recibió token del servidor');
      }

      if (!userData) {
        throw new Error('No se recibieron datos de usuario del servidor');
      }
      
      console.log('💾 Guardando token y usuario en localStorage...');
      // Guardar token y datos del usuario
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      console.log('✅ Login exitoso:', userData);
      return { success: true, user: userData };
      
    } catch (error) {
      console.error('❌ Login error completo:', error);
      console.error('📋 Error details:', {
        message: error.message,
        code: error.code,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      
      let message = 'Error de conexión';
      
      // Determinar mensaje específico basado en el error
      if (error.response) {
        // El servidor respondió con un código de error
        const status = error.response.status;
        const serverMessage = error.response.data?.message;
        
        console.log(`🚨 Error del servidor: ${status} - ${serverMessage}`);
        
        switch (status) {
          case 400:
            message = serverMessage || 'Datos de entrada inválidos';
            break;
          case 401:
            message = 'Usuario o contraseña incorrectos';
            break;
          case 404:
            message = 'Endpoint no encontrado. Verifica la URL del backend.';
            break;
          case 500:
            message = 'Error interno del servidor';
            break;
          default:
            message = serverMessage || `Error del servidor (${status})`;
        }
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        console.log('🔌 No response from server:', error.request);
        message = 'No se puede conectar con el servidor. Verifica que esté ejecutándose en http://localhost:5000';
      } else {
        // Error en la configuración de la petición
        console.log('⚙️ Request setup error:', error.message);
        message = error.message || 'Error en la configuración de la petición';
      }
      
      return { 
        success: false, 
        message,
        error: error.response?.data || error.message
      };
    }
  };

  const logout = () => {
    console.log('👋 Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (userData) => {
    console.log('👤 Updating user data:', userData);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Función de debug para probar conexión directa
  const testConnection = async () => {
    try {
      console.log('🔌 Testing direct connection to backend...');
      const response = await fetch('http://localhost:5000/api/health');
      const data = await response.json();
      console.log('✅ Health check response:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    loading,
    initialized,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user,
    testConnection, // Agregar función de debug
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};