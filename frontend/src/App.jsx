// En tu App.jsx, asegúrate de tener estas rutas:

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Componentes
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import UserManagement from './components/UserManagement/UserManagement';
import BusinessList from './components/BusinessList/BusinessList';
import GoogleMapComponent from './components/GoogleMapComponent/GoogleMapComponent';

// Componente de ruta protegida
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/businesses" element={
            <ProtectedRoute>
              <BusinessList />
            </ProtectedRoute>
          } />
          
          <Route path="/map" element={
            <ProtectedRoute>
              <GoogleMapComponent />
            </ProtectedRoute>
          } />
          
          {/* Rutas de administración */}
          <Route path="/users" element={
            <ProtectedRoute adminOnly={true}>
              <UserManagement />
            </ProtectedRoute>
          } />
          
          {/* Redirecciones */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;