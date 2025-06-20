import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI, testConnection, getAPIConfig } from '../../services/api';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDebugInfo(null);

    // Validaciones básicas
    if (!formData.username || !formData.password) {
      setError('Por favor, completa todos los campos');
      setLoading(false);
      return;
    }

    if (formData.username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Iniciando proceso de login...');
      console.log('🔧 API Config:', getAPIConfig());

      // Mostrar información de debug en desarrollo
      if (import.meta.env.DEV) {
        const config = getAPIConfig();
        setDebugInfo({
          apiUrl: config.baseURL,
          environment: config.environment,
          timestamp: new Date().toISOString()
        });
      }

      // Intentar login
      const response = await authAPI.login({
        username: formData.username.trim(),
        password: formData.password
      });

      console.log('✅ Login response received:', response.data);

      // Verificar que la respuesta sea exitosa
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Respuesta inválida del servidor');
      }

      // Verificar que venga el token
      if (!response.data.data || !response.data.data.token) {
        console.error('❌ No token in response:', response.data);
        throw new Error('No se recibió token del servidor');
      }

      // Verificar que venga información del usuario
      if (!response.data.data.user) {
        console.error('❌ No user data in response:', response.data);
        throw new Error('No se recibieron datos del usuario');
      }

      console.log('✅ Token recibido correctamente');
      console.log('👤 Usuario autenticado:', {
        id: response.data.data.user.id,
        username: response.data.data.user.username,
        role: response.data.data.user.role
      });

      // Usar el contexto para hacer login
      await login(response.data.data.token, response.data.data.user);
      
      console.log('✅ Login context updated');
      
      // Redirigir al dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.response) {
        // Error HTTP del servidor
        const status = error.response.status;
        const data = error.response.data;
        
        console.error('🚨 HTTP Error:', {
          status,
          statusText: error.response.statusText,
          data
        });
        
        switch (status) {
          case 400:
            errorMessage = data?.message || 'Datos de entrada inválidos';
            break;
          case 401:
            errorMessage = 'Credenciales incorrectas. Verifica tu usuario y contraseña.';
            break;
          case 403:
            errorMessage = 'Acceso denegado. Tu cuenta puede estar desactivada.';
            break;
          case 404:
            errorMessage = 'Servicio de autenticación no encontrado';
            break;
          case 500:
            errorMessage = 'Error interno del servidor. Intenta de nuevo más tarde.';
            break;
          case 502:
          case 503:
            errorMessage = 'Servicio temporalmente no disponible. Intenta en unos momentos.';
            break;
          default:
            errorMessage = data?.message || `Error del servidor (${status})`;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Tiempo de espera agotado. Verifica tu conexión a internet.';
      } else if (error.message === 'Network Error') {
        errorMessage = 'No se puede conectar con el servidor. Verifica tu conexión a internet.';
        
        // En desarrollo, mostrar más detalles
        if (import.meta.env.DEV) {
          const config = getAPIConfig();
          errorMessage += ` (intentando conectar a: ${config.baseURL})`;
        }
      } else if (error.userMessage) {
        errorMessage = error.userMessage;
      } else {
        errorMessage = error.message || 'Error desconocido';
      }
      
      setError(errorMessage);
      
      // En desarrollo, mostrar información adicional para debugging
      if (import.meta.env.DEV) {
        console.log('🔧 Debug info for developers:');
        console.log('- API Config:', getAPIConfig());
        console.log('- Error object:', error);
        
        setDebugInfo({
          error: error.message,
          code: error.code,
          status: error.response?.status,
          config: getAPIConfig(),
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para probar la conexión
  const handleTestConnection = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🧪 Testing connection...');
      const result = await testConnection();
      
      if (result.success) {
        setError(''); // Limpiar error anterior
        alert('✅ Conexión exitosa con el servidor!');
        console.log('✅ Connection test successful:', result.data);
      } else {
        setError(`❌ Error de conexión: ${result.error}`);
        console.error('❌ Connection test failed:', result.error);
      }
    } catch (error) {
      setError(`❌ Error probando conexión: ${error.message}`);
      console.error('❌ Connection test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Business Map</h1>
          <p>Inicia sesión para continuar</p>
        </div>

        {/* Debug info en desarrollo */}
        {import.meta.env.DEV && debugInfo && (
          <div className="debug-info">
            <h4>🔧 Info de Debug:</h4>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Usuario:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Ingresa tu usuario"
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Ingresa tu contraseña"
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>

          {/* Botón de test de conexión solo en desarrollo */}
          {import.meta.env.DEV && (
            <button 
              type="button"
              onClick={handleTestConnection}
              className="test-connection-button"
              disabled={loading}
            >
              🧪 Probar Conexión
            </button>
          )}
        </form>

        <div className="login-footer">
          
          
          
        </div>
      </div>
    </div>
  );
};

export default Login;