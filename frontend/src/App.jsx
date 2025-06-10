import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Componentes existentes
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import BusinessForm from './components/BusinessForm/BusinessForm';
import BusinessTable from './components/BusinessTable/BusinessTable';
import GoogleMap from './components/Map/GoogleMap';
import BusinessMap from './components/Map/BusinessMap';
import PasswordReset from './components/PasswordReset/PasswordReset';

// ✅ NUEVO: Componente de gestión de usuarios
import UserManagement from './components/UserManagement/UserManagement';

// 🧪 IMPORTAR TEST TEMPORAL
import SimpleMapTest from './components/Map/SimpleMapTest';

// Componentes básicos
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Profile from './components/Profile';

// Estilos
import './App.css';

// ✅ Configuración global de Google Maps
const libraries = [];
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, initialized } = useAuth();

  if (!initialized || loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Componente para rutas públicas
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, initialized } = useAuth();

  if (!initialized || loading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Componente para rutas de administrador
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading, initialized, user } = useAuth();

  if (!initialized || loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar si el usuario es admin
  if (!isAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Layout principal
const AppLayout = ({ children }) => {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
};

// Contenido principal de la app
function AppContent() {
  const { initialized, loading } = useAuth();

  if (!initialized || loading) {
    return (
      <div className="app-loading">
        <LoadingSpinner />
        <p>Iniciando Business Map...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Rutas protegidas */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/businesses"
        element={
          <ProtectedRoute>
            <AppLayout>
              <BusinessTable />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/businesses/new"
        element={
          <ProtectedRoute>
            <AppLayout>
              <div style={{ padding: '20px' }}>
                <h1>Crear Nuevo Negocio</h1>
                <BusinessForm />
              </div>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/businesses/edit/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <div style={{ padding: '20px' }}>
                <h1>Editar Negocio</h1>
                <BusinessForm />
              </div>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* ✅ MAPA USANDO COMPONENTE GOOGLEMAP.JSX */}
      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <BusinessMap />
          </ProtectedRoute>
        }
      />

      {/* 🧪 TEST SIMPLE DEL MAPA */}
      <Route
        path="/map-test"
        element={
          <ProtectedRoute>
            <SimpleMapTest />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* ==================== RUTAS DE ADMINISTRADOR ==================== */}
      
      {/* Panel de administración general */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AppLayout>
              <AdminPanel />
            </AppLayout>
          </AdminRoute>
        }
      />

      {/* ✅ GESTIÓN DE CONTRASEÑAS (solo admin) */}
      <Route
        path="/admin/password-reset"
        element={
          <AdminRoute>
            <AppLayout>
              <PasswordReset />
            </AppLayout>
          </AdminRoute>
        }
      />

      {/* ✅ NUEVA RUTA: Gestión de usuarios (solo admin) */}
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AppLayout>
              <UserManagement />
            </AppLayout>
          </AdminRoute>
        }
      />

      {/* Futura ruta: Logs del sistema */}
      <Route
        path="/admin/logs"
        element={
          <AdminRoute>
            <AppLayout>
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>📊 Logs del Sistema</h2>
                <p style={{ color: '#666', marginTop: '20px' }}>
                  Esta funcionalidad estará disponible próximamente
                </p>
              </div>
            </AppLayout>
          </AdminRoute>
        }
      />

      {/* ==================== FIN RUTAS DE ADMINISTRADOR ==================== */}

      {/* Ruta raíz */}
      <Route
        path="/"
        element={<RootRedirect />}
      />

      {/* Página 404 */}
      <Route
        path="*"
        element={
          <AppLayout>
            <NotFound />
          </AppLayout>
        }
      />
    </Routes>
  );
}

// Componente para redirigir desde la raíz
const RootRedirect = () => {
  const { isAuthenticated, loading, initialized } = useAuth();

  if (!initialized || loading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

// Componente de página no encontrada
const NotFound = () => {
  return (
    <div style={{
      textAlign: 'center',
      padding: '50px 20px',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h1 style={{ fontSize: '4rem', margin: '0', color: '#dc3545' }}>404</h1>
      <h2 style={{ color: '#6c757d', marginBottom: '20px' }}>Página no encontrada</h2>
      <p style={{ color: '#6c757d', marginBottom: '30px' }}>
        Lo sentimos, la página que buscas no existe.
      </p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button 
          onClick={() => window.history.back()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Volver
        </button>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🏠 Ir al Dashboard
        </button>
      </div>
    </div>
  );
};

// ✅ PANEL DE ADMINISTRADOR ACTUALIZADO
const AdminPanel = () => {
  const { user } = useAuth();
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>⚙️ Panel de Administración</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Bienvenido al panel de administración, {user?.username}
      </p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {/* ✅ Card de Gestión de Usuarios - AHORA DISPONIBLE */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          cursor: 'pointer',
          transition: 'all 0.3s'
        }}
        onClick={() => window.location.href = '/admin/users'}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <h3>👥 Gestión de Usuarios</h3>
          <p>Crear, editar y gestionar usuarios del sistema</p>
          <ul style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            <li>✅ Crear nuevos usuarios</li>
            <li>✅ Asignar roles y permisos</li>
            <li>✅ Activar/desactivar usuarios</li>
            <li>✅ Gestión de contraseñas</li>
          </ul>
          <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Disponible</span>
        </div>

        {/* Card de Gestión de Contraseñas */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          cursor: 'pointer',
          transition: 'all 0.3s'
        }}
        onClick={() => window.location.href = '/admin/password-reset'}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <h3>🔐 Gestión de Contraseñas</h3>
          <p>Resetear contraseñas de usuarios del sistema</p>
          <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Disponible</span>
        </div>

        {/* Card de Logs del Sistema */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          opacity: 0.6,
          cursor: 'not-allowed'
        }}>
          <h3>📊 Logs del Sistema</h3>
          <p>Ver actividad y auditoría del sistema</p>
          <span style={{ color: '#ffc107', fontWeight: 'bold' }}>🚧 Próximamente</span>
        </div>

        {/* Card de Configuración */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          opacity: 0.6,
          cursor: 'not-allowed'
        }}>
          <h3>🔧 Configuración</h3>
          <p>Ajustes generales de la aplicación</p>
          <span style={{ color: '#ffc107', fontWeight: 'bold' }}>🚧 Próximamente</span>
        </div>

        {/* ✅ NUEVA Card de Estadísticas */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          opacity: 0.6,
          cursor: 'not-allowed'
        }}>
          <h3>📈 Estadísticas</h3>
          <p>Métricas y análisis del sistema</p>
          <span style={{ color: '#ffc107', fontWeight: 'bold' }}>🚧 Próximamente</span>
        </div>

        {/* ✅ NUEVA Card de Respaldos */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          opacity: 0.6,
          cursor: 'not-allowed'
        }}>
          <h3>💾 Respaldos</h3>
          <p>Gestión de copias de seguridad</p>
          <span style={{ color: '#ffc107', fontWeight: 'bold' }}>🚧 Próximamente</span>
        </div>
      </div>

      {/* ✅ SECCIÓN DE ESTADÍSTICAS RÁPIDAS */}
      <div style={{ marginTop: '40px' }}>
        <h2>📊 Estadísticas Rápidas</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginTop: '20px'
        }}>
          <div style={{
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#667eea' }}>👥</h3>
            <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>Usuarios</p>
          </div>
          <div style={{
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#28a745' }}>🏢</h3>
            <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>Negocios</p>
          </div>
          <div style={{
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#ffc107' }}>📍</h3>
            <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>Ubicaciones</p>
          </div>
          <div style={{
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#dc3545' }}>🔐</h3>
            <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>Permisos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ Componente principal con LoadScript global
function App() {
  // Si no hay API key, mostrar error
  if (!apiKey) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: 'white',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h1 style={{ fontSize: '5rem', marginBottom: '30px' }}>🔑</h1>
        <h2>API Key de Google Maps Requerida</h2>
        <p>Agrega VITE_GOOGLE_MAPS_API_KEY a tu archivo .env</p>
      </div>
    );
  }

  return (
    <Router>
      <AuthProvider>
        {/* ✅ LoadScript global para toda la aplicación */}
        <LoadScript
          googleMapsApiKey={apiKey}
          libraries={libraries}
          onLoad={() => {
            console.log('✅ Google Maps cargado globalmente');
          }}
          onError={(error) => {
            console.error('❌ Error cargando Google Maps globalmente:', error);
          }}
          loadingElement={
            <div style={{
              width: '100vw',
              height: '100vh',
              background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: '4rem', 
                marginBottom: '20px',
                animation: 'spin 2s linear infinite' 
              }}>🗺️</div>
              <h2>Cargando Google Maps...</h2>
              <p>Inicializando aplicación Business Map</p>
            </div>
          }
        >
          <div className="App">
            <AppContent />
          </div>
        </LoadScript>
      </AuthProvider>
    </Router>
  );
}

export default App;