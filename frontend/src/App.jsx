import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Importar componentes
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import MapPage from './pages/MapPage';
import BusinessesPage from './pages/BusinessesPage'; // ✅ NUEVA IMPORTACIÓN
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
            
            <Route 
              path="/forgot-password" 
              element={
                <PublicRoute>
                  <PasswordReset />
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
            
            {/* ✅ NUEVA RUTA PARA LA LISTA COMPLETA DE NEGOCIOS */}
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
            
            {/* ✅ OPCIONAL: También agregar rutas alternativas para editar */}
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
            
            {/* Rutas de admin - solo accesibles para administradores */}
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <UserManagement />
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