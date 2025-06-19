import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Importar componentes
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import MapPage from './pages/MapPage';
// ✅ IMPORTACIÓN CORREGIDA - puede ser con o sin extensión
import BusinessesPage from './pages/BusinessesPage';
import BusinessForm from './components/BusinessForm/BusinessForm';
import Profile from './components/Profile';
import UserManagement from './components/UserManagement/UserManagement';
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
            
            {/* ✅ RUTA CORREGIDA PARA BUSINESSES */}
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
            
            {/* ✅ RUTAS ADICIONALES PARA NEGOCIOS */}
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
            
            {/* ✅ RUTAS DE ADMINISTRACIÓN */}
            {/* Ruta nueva para /users que necesita el Dashboard */}
            <Route 
              path="/users" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <UserManagement />
                </ProtectedRoute>
              } 
            />
            
            {/* Ruta alternativa para admin/users */}
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <UserManagement />
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