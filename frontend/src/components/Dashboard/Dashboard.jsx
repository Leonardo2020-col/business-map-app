import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState('Iniciando Dashboard...');

  useEffect(() => {
    console.log('🚀 Dashboard useEffect ejecutado');
    setDebugInfo('Dashboard montado correctamente');
    
    // Test simple sin API calls
    setTimeout(() => {
      setDebugInfo('Dashboard completamente cargado - SIN API calls');
    }, 1000);
  }, []);

  console.log('🔍 Dashboard renderizando...');

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f0f0',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#333', marginBottom: '1rem' }}>
          🎉 ¡Dashboard Funcionando!
        </h1>
        
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#666' }}>Información del Usuario:</h2>
          <div style={{ 
            backgroundColor: '#f9f9f9', 
            padding: '1rem', 
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}>
            <p><strong>Username:</strong> {user?.username || 'No disponible'}</p>
            <p><strong>Email:</strong> {user?.email || 'No disponible'}</p>
            <p><strong>Rol:</strong> {user?.role || 'No disponible'}</p>
            <p><strong>Activo:</strong> {user?.is_active ? 'Sí' : 'No'}</p>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#666' }}>Estado de Debug:</h2>
          <div style={{ 
            backgroundColor: '#e8f5e8', 
            padding: '1rem', 
            borderRadius: '4px',
            border: '1px solid #4caf50'
          }}>
            <p style={{ margin: 0, color: '#2e7d32' }}>
              ✅ {debugInfo}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#666' }}>Información Técnica:</h2>
          <div style={{ 
            backgroundColor: '#f0f8ff', 
            padding: '1rem', 
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.9rem'
          }}>
            <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
            <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 100)}...</p>
            <p><strong>Window Location:</strong> {window.location.href}</p>
            <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#666' }}>Acciones de Prueba:</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                console.log('✅ Botón 1 clickeado');
                alert('✅ JavaScript funciona correctamente!');
              }}
              style={{
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              🧪 Test JavaScript
            </button>

            <button 
              onClick={() => {
                console.log('✅ Botón 2 clickeado');
                setDebugInfo(`Button clicked at ${new Date().toLocaleTimeString()}`);
              }}
              style={{
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              🔄 Update State
            </button>

            <button 
              onClick={() => {
                console.log('✅ Botón 3 clickeado');
                window.location.reload();
              }}
              style={{
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              🔃 Reload Page
            </button>

            <button 
              onClick={() => {
                console.log('✅ Botón 4 clickeado - Probando console logs');
                console.log('🔍 Debug info:', {
                  user,
                  debugInfo,
                  timestamp: new Date(),
                  location: window.location.href
                });
                alert('Revisa la consola para ver los logs!');
              }}
              style={{
                backgroundColor: '#9c27b0',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              📝 Console Log Test
            </button>
          </div>
        </div>

        <div>
          <h2 style={{ color: '#666' }}>Navegación de Prueba:</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a 
              href="/login"
              style={{
                backgroundColor: '#f44336',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '1rem'
              }}
            >
              🚪 Ir a Login
            </a>

            <a 
              href="/api/health"
              target="_blank"
              style={{
                backgroundColor: '#607d8b',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '1rem'
              }}
            >
              💊 Test API Health
            </a>

            <button 
              onClick={() => {
                console.log('✅ Probando API fetch...');
                fetch('/api/health')
                  .then(response => response.json())
                  .then(data => {
                    console.log('✅ API Response:', data);
                    alert('API funciona! Ver consola para detalles.');
                  })
                  .catch(error => {
                    console.error('❌ API Error:', error);
                    alert('Error en API: ' + error.message);
                  });
              }}
              style={{
                backgroundColor: '#795548',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              🔧 Test API Direct
            </button>
          </div>
        </div>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px'
        }}>
          <h3 style={{ color: '#856404', margin: '0 0 1rem 0' }}>
            📋 Instrucciones de Debug:
          </h3>
          <ol style={{ color: '#856404', paddingLeft: '1.5rem' }}>
            <li>Si ves esta pantalla, React está funcionando ✅</li>
            <li>Si los botones funcionan, JavaScript está OK ✅</li>
            <li>Revisa la consola del navegador (F12) para logs detallados</li>
            <li>Prueba el botón "Test API Direct" para verificar conectividad</li>
            <li>Si esta pantalla se queda "cargando", hay un problema en otro componente</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;