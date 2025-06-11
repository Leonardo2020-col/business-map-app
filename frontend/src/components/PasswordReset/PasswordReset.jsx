import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar/Navbar'; // ✅ Agregar Navbar
import './PasswordReset.css';

const PasswordReset = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Estados
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ✅ Usar configuración de API consistente
  const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

  // ✅ ELIMINAR la verificación que causa problemas - ahora se maneja en las rutas
  // React.useEffect(() => {
  //   if (!user || user.role !== 'admin') {
  //     navigate('/dashboard');
  //   }
  // }, [user, navigate]);

  // Validar formulario
  const validateForm = () => {
    if (!username.trim()) {
      setResults({
        type: 'error',
        success: false,
        message: 'El nombre de usuario es requerido'
      });
      return false;
    }

    if (!newPassword || newPassword.length < 6) {
      setResults({
        type: 'error',
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
      return false;
    }

    if (newPassword !== confirmPassword) {
      setResults({
        type: 'error',
        success: false,
        message: 'Las contraseñas no coinciden'
      });
      return false;
    }

    return true;
  };

  // Resetear contraseña
  const resetPassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setResults(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
          newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResults({
          type: 'success',
          success: true,
          message: `✅ Contraseña actualizada exitosamente para el usuario "${username}"`
        });
        
        // Limpiar formulario
        setUsername('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setResults({
          type: 'error',
          success: false,
          message: data.message || 'Error al resetear la contraseña'
        });
      }
    } catch (error) {
      setResults({
        type: 'error',
        success: false,
        message: 'Error de conexión con el servidor'
      });
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Buscar usuario (verificar si existe)
  const searchUser = async () => {
    if (!username.trim()) {
      setResults({
        type: 'error',
        success: false,
        message: 'Ingresa un nombre de usuario'
      });
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/search/${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.exists) {
        setResults({
          type: 'info',
          success: true,
          message: `✅ Usuario "${username}" encontrado - Rol: ${data.role}`
        });
      } else {
        setResults({
          type: 'warning',
          success: false,
          message: `⚠️ Usuario "${username}" no encontrado`
        });
      }
    } catch (error) {
      setResults({
        type: 'error',
        success: false,
        message: 'Error al buscar el usuario'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar /> {/* ✅ Agregar Navbar */}
      <div className="password-reset-container">
        <div className="password-reset-card">
          {/* Header */}
          <div className="reset-header">
            <h2>🔐 Gestión de Contraseñas</h2>
            <p>Panel administrativo para resetear contraseñas de usuarios</p>
          </div>

          {/* Alerta de seguridad */}
          <div className="security-alert">
            <span className="alert-icon">⚠️</span>
            <span>Esta acción es irreversible y quedará registrada en el sistema</span>
          </div>

          {/* Formulario */}
          <div className="reset-form">
            {/* Campo de usuario */}
            <div className="form-group">
              <label htmlFor="username">
                <span className="label-icon">👤</span>
                Nombre de Usuario
              </label>
              <div className="input-with-action">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingrese el nombre de usuario"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={searchUser}
                  className="btn-search"
                  disabled={loading || !username.trim()}
                >
                  🔍 Buscar
                </button>
              </div>
            </div>

            {/* Campo de nueva contraseña */}
            <div className="form-group">
              <label htmlFor="newPassword">
                <span className="label-icon">🔑</span>
                Nueva Contraseña
              </label>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Campo de confirmar contraseña */}
            <div className="form-group">
              <label htmlFor="confirmPassword">
                <span className="label-icon">🔑</span>
                Confirmar Contraseña
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita la nueva contraseña"
                disabled={loading}
              />
            </div>

            {/* Resultado */}
            {results && (
              <div className={`result-message ${results.type}`}>
                <span className="result-icon">
                  {results.type === 'success' && '✅'}
                  {results.type === 'error' && '❌'}
                  {results.type === 'warning' && '⚠️'}
                  {results.type === 'info' && 'ℹ️'}
                </span>
                <span>{results.message}</span>
              </div>
            )}

            {/* Botones de acción */}
            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn btn-secondary"
                disabled={loading}
              >
                ← Volver
              </button>
              <button
                type="button"
                onClick={resetPassword}
                className="btn btn-primary"
                disabled={loading || !username || !newPassword || !confirmPassword}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner">⏳</span>
                    Procesando...
                  </>
                ) : (
                  <>
                    🔄 Resetear Contraseña
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Información adicional */}
          <div className="info-section">
            <h4>📋 Instrucciones de uso:</h4>
            <ul>
              <li>Ingrese el nombre de usuario exacto</li>
              <li>Use el botón "Buscar" para verificar que el usuario existe</li>
              <li>Ingrese una contraseña segura de al menos 6 caracteres</li>
              <li>Confirme la contraseña para evitar errores</li>
              <li>El usuario deberá usar la nueva contraseña en su próximo inicio de sesión</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default PasswordReset;