import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI, systemAPI, getAPIConfig } from '../services/api';

export const AuthContext = createContext();

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');

  // Verificar API al inicializar
  useEffect(() => {
    const checkAPI = async () => {
      try {
        console.log('🔍 Verificando conexión con API...');
        console.log('🔧 API Config:', getAPIConfig());
        
        const response = await systemAPI.health();
        console.log('✅ API disponible:', response.data);
        setApiStatus('available');
        setInitialized(true);
      } catch (error) {
        console.error('❌ API no disponible:', error);
        setApiStatus('unavailable');
        setInitialized(true);
        
        // En desarrollo, mostrar más información
        if (import.meta.env.DEV) {
          console.error('🔧 Debug info:', {
            config: getAPIConfig(),
            error: error.message,
            errorDetails: error
          });
        }
      }
    };

    checkAPI();
  }, []);

  // Verificar token almacenado al cargar
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        console.log('🔍 Verificando sesión almacenada...');
        console.log('Token stored:', !!storedToken);
        console.log('User stored:', !!storedUser);

        if (storedToken && storedUser) {
          // Verificar que el token siga siendo válido
          try {
            setToken(storedToken);
            
            // Intentar verificar el token con el servidor
            const response = await authAPI.verify();
            
            if (response.data.success) {
              const userData = JSON.parse(storedUser);
              setUser(userData);
              console.log('✅ Sesión válida restaurada:', userData.username);
            } else {
              throw new Error('Token inválido');
            }
          } catch (error) {
            console.warn('⚠️ Token almacenado inválido, limpiando sesión');
            clearSession();
          }
        } else {
          console.log('ℹ️ No hay sesión almacenada');
        }
      } catch (error) {
        console.error('❌ Error inicializando auth:', error);
        clearSession();
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    // Solo inicializar si la API está disponible o después de un tiempo
    if (apiStatus === 'available') {
      initializeAuth();
    } else if (apiStatus === 'unavailable') {
      // En caso de que la API no esté disponible, verificar sesión local
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);
          console.log('⚠️ Usando sesión local (API no disponible):', userData.username);
        } catch (error) {
          console.error('❌ Error parsing stored user data:', error);
          clearSession();
        }
      }
      setLoading(false);
      setInitialized(true);
    }
  }, [apiStatus]);

  const clearSession = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('🧹 Sesión limpiada');
  };

  const login = async (authToken, userData) => {
    try {
      console.log('🔐 Procesando login en contexto...');
      console.log('Token received:', !!authToken);
      console.log('User data received:', {
        id: userData?.id,
        username: userData?.username,
        role: userData?.role
      });

      if (!authToken) {
        throw new Error('Token de autenticación requerido');
      }

      if (!userData) {
        throw new Error('Datos de usuario requeridos');
      }

      // Validar estructura mínima del usuario
      if (!userData.id || !userData.username) {
        throw new Error('Datos de usuario incompletos');
      }

      // Guardar en estado
      setToken(authToken);
      setUser(userData);

      // Guardar en localStorage
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));

      console.log('✅ Login exitoso en contexto:', {
        userId: userData.id,
        username: userData.username,
        role: userData.role
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error en login context:', error);
      clearSession();
      throw error;
    }
  };

  const logout = () => {
    console.log('🚪 Cerrando sesión...');
    clearSession();
    
    // Redirigir al login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const updateUser = (updatedUserData) => {
    console.log('👤 Actualizando datos de usuario:', updatedUserData);
    
    const newUserData = { ...user, ...updatedUserData };
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  const refreshToken = async () => {
    try {
      console.log('🔄 Renovando token...');
      
      const response = await authAPI.verify();
      
      if (response.data.success) {
        console.log('✅ Token renovado exitosamente');
        return true;
      } else {
        throw new Error('No se pudo renovar el token');
      }
    } catch (error) {
      console.error('❌ Error renovando token:', error);
      logout();
      return false;
    }
  };

  // Verificar si el usuario está autenticado
  const isAuthenticated = () => {
    return !!(token && user);
  };

  // Verificar si el usuario es administrador
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Verificar si el usuario tiene un rol específico
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Obtener información de debug
  const getDebugInfo = () => {
    return {
      isAuthenticated: isAuthenticated(),
      user: user ? {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      } : null,
      hasToken: !!token,
      apiStatus,
      apiConfig: getAPIConfig(),
      localStorage: {
        hasToken: !!localStorage.getItem('token'),
        hasUser: !!localStorage.getItem('user')
      }
    };
  };

  const contextValue = {
    // Estado
    user,
    token,
    loading,
    initialized,
    apiStatus,
    
    // Métodos de autenticación
    login,
    logout,
    updateUser,
    refreshToken,
    
    // Métodos de verificación
    isAuthenticated,
    isAdmin,
    hasRole,
    
    // Debug (solo en desarrollo)
    ...(import.meta.env.DEV && { getDebugInfo, clearSession })
  };

  // Mostrar loading mientras se inicializa
  if (loading && !initialized) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner">
          <p>Inicializando sesión...</p>
          {import.meta.env.DEV && (
            <p><small>API Status: {apiStatus}</small></p>
          )}
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};