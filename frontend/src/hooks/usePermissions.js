// hooks/usePermissions.js
import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Los administradores tienen todos los permisos
    if (user.role === 'admin') return true;
    
    // Verificar permisos específicos
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permission);
    }
    
    return false;
  };

  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions) => {
    return permissions.every(permission => hasPermission(permission));
  };

  // Permisos específicos para negocios
  const canViewBusinesses = () => hasPermission('business:read');
  const canCreateBusinesses = () => hasPermission('business:create');
  const canEditBusinesses = () => hasPermission('business:edit');
  const canDeleteBusinesses = () => hasPermission('business:delete');
  
  // Permisos específicos para usuarios
  const canViewUsers = () => hasPermission('user:read');
  const canCreateUsers = () => hasPermission('user:create');
  const canEditUsers = () => hasPermission('user:edit');
  const canDeleteUsers = () => hasPermission('user:delete');
  
  // Permisos específicos para admin
  const canAccessAdminPanel = () => hasPermission('admin:panel') || user?.role === 'admin';
  const canViewReports = () => hasPermission('reports:view');
  const canViewMap = () => hasPermission('map:view');

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    // Permisos de negocios
    canViewBusinesses,
    canCreateBusinesses,
    canEditBusinesses,
    canDeleteBusinesses,
    // Permisos de usuarios
    canViewUsers,
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,
    // Permisos generales
    canAccessAdminPanel,
    canViewReports,
    canViewMap,
    // Info del usuario
    isAdmin: user?.role === 'admin',
    userPermissions: user?.permissions || []
  };
};

// components/BusinessList.jsx - Ejemplo de uso
import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

const BusinessList = () => {
  const { 
    canViewBusinesses, 
    canCreateBusinesses, 
    canEditBusinesses, 
    canDeleteBusinesses 
  } = usePermissions();

  // Si no puede ver negocios, no mostrar nada
  if (!canViewBusinesses()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Acceso Denegado</h3>
          <p className="text-gray-500">No tienes permisos para ver los negocios</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Botón de crear solo si tiene permisos */}
      {canCreateBusinesses() && (
        <button 
          className="btn-primary"
          onClick={() => {/* lógica para crear */}}
        >
          ➕ Crear Negocio
        </button>
      )}

      {/* Lista de negocios */}
      <div className="grid gap-4">
        {businesses.map(business => (
          <div key={business.id} className="business-card">
            <h3>{business.name}</h3>
            <p>{business.address}</p>
            
            {/* Botones de acción según permisos */}
            <div className="flex gap-2 mt-4">
              {canEditBusinesses() && (
                <button 
                  className="btn-secondary"
                  onClick={() => editBusiness(business.id)}
                >
                  ✏️ Editar
                </button>
              )}
              
              {canDeleteBusinesses() && (
                <button 
                  className="btn-danger"
                  onClick={() => deleteBusiness(business.id)}
                >
                  🗑️ Eliminar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// components/Navigation.jsx - Ejemplo de navegación con permisos
import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

const Navigation = () => {
  const { 
    canViewBusinesses, 
    canAccessAdminPanel, 
    canViewUsers,
    canViewReports,
    canViewMap 
  } = usePermissions();

  return (
    <nav className="bg-gray-800 text-white">
      <div className="flex space-x-4">
        {/* Siempre mostrar Dashboard */}
        <a href="/dashboard" className="nav-link">
          🏠 Dashboard
        </a>

        {/* Solo mostrar si puede ver negocios */}
        {canViewBusinesses() && (
          <a href="/businesses" className="nav-link">
            🏢 Negocios
          </a>
        )}

        {/* Solo mostrar si puede ver el mapa */}
        {canViewMap() && (
          <a href="/map" className="nav-link">
            🗺️ Mapa
          </a>
        )}

        {/* Solo mostrar si puede ver reportes */}
        {canViewReports() && (
          <a href="/reports" className="nav-link">
            📊 Reportes
          </a>
        )}

        {/* Solo mostrar si puede acceder al panel de admin */}
        {canAccessAdminPanel() && (
          <div className="nav-dropdown">
            <span className="nav-link">⚙️ Administración</span>
            <div className="dropdown-content">
              {canViewUsers() && (
                <a href="/admin/users">👥 Usuarios</a>
              )}
              <a href="/admin/settings">⚙️ Configuración</a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export { BusinessList, Navigation };