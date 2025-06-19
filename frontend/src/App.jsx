import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Importar componentes
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import MapPage from './pages/MapPage';
import SystemReports from './components/SystemReports/SystemReports';
import BusinessesPage from './pages/BusinessesPage';
import BusinessForm from './components/BusinessForm/BusinessForm';
import Profile from './components/Profile';
// ✅ CAMBIO: Importar UsersPage en lugar de UserManagement directamente
import UsersPage from './pages/UsersPage';
import PasswordReset from './components/PasswordReset/PasswordReset';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Rutas públicas - solo accesibles si NO estás autenticado */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            
            {/* Rutas protegidas - solo accesibles si estás autenticado */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/map" 
              element={
                <ProtectedRoute>
                  <MapPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/businesses" 
              element={
                <ProtectedRoute>
                  <BusinessesPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            {/* Rutas para formularios de negocios */}
            <Route 
              path="/business/new" 
              element={
                <ProtectedRoute>
                  <BusinessForm />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/business/edit/:id" 
              element={
                <ProtectedRoute>
                  <BusinessForm />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/businesses/edit/:id" 
              element={
                <ProtectedRoute>
                  <BusinessForm />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/businesses/new" 
              element={
                <ProtectedRoute>
                  <BusinessForm />
                </ProtectedRoute>
              } 
            />
            
            {/* ✅ RUTAS DE ADMINISTRACIÓN CORREGIDAS */}
            {/* Gestión de usuarios - ahora usa UsersPage que incluye Navbar */}
            <Route 
              path="/users" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <UsersPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Ruta alternativa para admin/users */}
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <UsersPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Gestión de contraseñas - Solo para admins autenticados */}
            <Route 
              path="/admin/password-reset" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <PasswordReset />
                </ProtectedRoute>
              } 
            />
            
            {/* Reportes del Sistema - Solo para admins autenticados */}
            <Route 
              path="/admin/reports" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <SystemReports />
                </ProtectedRoute>
              } 
            />
            
            {/* Ruta por defecto - redirigir según estado de autenticación */}
            <Route 
              path="/" 
              element={<Navigate to="/dashboard" replace />} 
            />
            
            {/* Ruta 404 */}
            <Route 
              path="*" 
              element={
                <div className="not-found">
                  <h1>404 - Página no encontrada</h1>
                  <p>La página que buscas no existe.</p>
                  <a href="/dashboard">Volver al Dashboard</a>
                </div>
              } 
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;