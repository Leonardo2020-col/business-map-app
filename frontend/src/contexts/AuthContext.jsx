import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
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

  // Función para limpiar sesión (memoizada para evitar re-renders)
  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('🧹 Sesión limpiada');
  }, []);

  // Inicialización una sola vez al montar el componente
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔍 Inicializando autenticación...');

        // 1. Verificar sesión almacenada PRIMERO (sin hacer peticiones)
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            
            // Establecer estado local inmediatamente
            if (isMounted) {
              setToken(storedToken);
              setUser(userData);
              console.log('✅ Sesión local restaurada:', userData.username);
            }

            // 2. Verificar con el servidor en segundo plano (sin bloquear UI)
            try {
              const response = await authAPI.verify();
              if (!response.data.success && isMounted) {
                console.warn('⚠️ Token inválido en servidor, limpiando sesión');
                clearSession();
              }
            } catch (verifyError) {
              console.warn('⚠️ Error verificando token:', verifyError.message);
              // No limpiar sesión aquí - puede ser problema temporal de red
            }

          } catch (parseError) {
            console.error('❌ Error parsing user data:', parseError);
            if (isMounted) {
              clearSession();
            }
          }
        } else {
          console.log('ℹ️ No hay sesión almacenada');
        }

        // 3. Verificar API en segundo plano
        try {
          const healthResponse = await systemAPI.health();
          if (isMounted) {
            setApiStatus('available');
            console.log('✅ API disponible');
          }
        } catch (apiError) {
          if (isMounted) {
            setApiStatus('unavailable');
            console.warn('⚠️ API no disponible:', apiError.message);
          }
        }

      } catch (error) {
        console.error('❌ Error inicializando auth:', error);
        if (isMounted) {
          clearSession();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Cleanup para evitar memory leaks
    return () => {
      isMounted = false;
    };
  }, []); // ¡IMPORTANTE! Solo ejecutar una vez

  // Función de login (memoizada)
  const login = useCallback(async (authToken, userData) => {
    try {
      console.log('🔐 Procesando login...');

      if (!authToken || !userData) {
        throw new Error('Token y datos de usuario requeridos');
      }

      if (!userData.id || !userData.username) {
        throw new Error('Datos de usuario incompletos');
      }

      // Actualizar estado
      setToken(authToken);
      setUser(userData);

      // Guardar en localStorage
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));

      console.log('✅ Login exitoso:', userData.username);
      return { success: true };

    } catch (error) {
      console.error('❌ Error en login:', error);
      clearSession();
      throw error;
    }
  }, [clearSession]);

  // Función de logout (memoizada)
  const logout = useCallback(() => {
    console.log('🚪 Cerrando sesión...');
    clearSession();
    
    // Redirigir después de un pequeño delay para evitar problemas de estado
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }, 100);
  }, [clearSession]);

  // Función para actualizar usuario (memoizada)
  const updateUser = useCallback((updatedUserData) => {
    if (!user) return;

    console.log('👤 Actualizando datos de usuario');
    const newUserData = { ...user, ...updatedUserData };
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  }, [user]);

  // Verificar autenticación (memoizada)
  const isAuthenticated = useCallback(() => {
    return !!(token && user && user.id);
  }, [token, user]);

  // Verificar rol admin (memoizada)
  const isAdmin = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  // Verificar rol específico (memoizada)
  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user]);

  // Refresh token (memoizada)
  const refreshToken = useCallback(async () => {
    try {
      console.log('🔄 Renovando token...');
      const response = await authAPI.verify();
      
      if (response.data.success) {
        console.log('✅ Token renovado');
        return true;
      } else {
        throw new Error('Token inválido');
      }
    } catch (error) {
      console.error('❌ Error renovando token:', error);
      logout();
      return false;
    }
  }, [logout]);

  // Debug info (solo en desarrollo)
  const getDebugInfo = useCallback(() => {
    if (!import.meta.env.DEV) return null;

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
      initialized,
      loading,
      apiConfig: getAPIConfig(),
      localStorage: {
        hasToken: !!localStorage.getItem('token'),
        hasUser: !!localStorage.getItem('user')
      }
    };
  }, [isAuthenticated, user, token, apiStatus, initialized, loading]);

  // Valor del contexto (memoizado para evitar re-renders innecesarios)
  const contextValue = React.useMemo(() => ({
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
  }), [
    user, 
    token, 
    loading, 
    initialized, 
    apiStatus,
    login,
    logout,
    updateUser,
    refreshToken,
    isAuthenticated,
    isAdmin,
    hasRole,
    getDebugInfo,
    clearSession
  ]);

  // Mostrar loading solo al inicio
  if (loading && !initialized) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner">
          <p>Inicializando aplicación...</p>
          {import.meta.env.DEV && (
            <div>
              <p><small>API Status: {apiStatus}</small></p>
              <p><small>Initialized: {initialized ? 'Yes' : 'No'}</small></p>
            </div>
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