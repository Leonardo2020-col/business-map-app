// hooks/usePermissions.js
import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { user } = useAuth();

  // ✅ FUNCIÓN PRINCIPAL PARA VERIFICAR PERMISOS
  const hasPermission = (permission) => {
    if (!user) {
      console.log(`🔒 Sin usuario autenticado para permiso: ${permission}`);
      return false;
    }
    
    // Los administradores tienen todos los permisos
    if (user.role === 'admin') {
      console.log(`👑 Admin tiene permiso automático: ${permission}`);
      return true;
    }
    
    // Verificar permisos específicos del usuario
    if (user.permissions && Array.isArray(user.permissions)) {
      const hasIt = user.permissions.includes(permission);
      console.log(`🔍 Verificando ${permission} para ${user.username}: ${hasIt ? 'SÍ' : 'NO'}`);
      console.log(`🔑 Permisos disponibles:`, user.permissions);
      return hasIt;
    }
    
    console.log(`❌ Usuario ${user.username} sin permisos definidos`);
    return false;
  };

  // ✅ PERMISOS ESPECÍFICOS PARA EL MAPA
  const canViewMap = () => {
    return hasPermission('map:view');
  };

  // ✅ PERMISOS ESPECÍFICOS PARA NEGOCIOS
  const canViewBusinesses = () => {
    return hasPermission('business:read');
  };

  const canCreateBusinesses = () => {
    return hasPermission('business:create');
  };

  const canEditBusinesses = () => {
    return hasPermission('business:edit');
  };

  const canDeleteBusinesses = () => {
    return hasPermission('business:delete');
  };

  // ✅ PERMISOS ESPECÍFICOS PARA USUARIOS
  const canViewUsers = () => {
    return hasPermission('user:read');
  };

  const canCreateUsers = () => {
    return hasPermission('user:create');
  };

  const canEditUsers = () => {
    return hasPermission('user:edit');
  };

  const canDeleteUsers = () => {
    return hasPermission('user:delete');
  };

  // ✅ PERMISOS ESPECÍFICOS PARA ADMIN
  const canAccessAdminPanel = () => {
    return hasPermission('admin:panel') || user?.role === 'admin';
  };

  const canViewReports = () => {
    return hasPermission('reports:view');
  };

  // ✅ FUNCIÓN HELPER PARA MÚLTIPLES PERMISOS
  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions) => {
    return permissions.every(permission => hasPermission(permission));
  };

  // ✅ FUNCIÓN PARA DEBUGGING
  const debugPermissions = () => {
    if (!user) {
      console.log('🔒 No hay usuario autenticado');
      return;
    }

    console.log('=== DEBUG PERMISOS ===');
    console.log('👤 Usuario:', user.username);
    console.log('🎭 Rol:', user.role);
    console.log('🔑 Permisos:', user.permissions);
    console.log('');
    console.log('📋 Verificaciones:');
    console.log('  🗺️ Ver mapa:', canViewMap());
    console.log('  🏢 Ver negocios:', canViewBusinesses());
    console.log('  ➕ Crear negocios:', canCreateBusinesses());
    console.log('  ✏️ Editar negocios:', canEditBusinesses());
    console.log('  🗑️ Eliminar negocios:', canDeleteBusinesses());
    console.log('  👥 Ver usuarios:', canViewUsers());
    console.log('  ⚙️ Panel admin:', canAccessAdminPanel());
    console.log('==================');
  };

  return {
    // Función principal
    hasPermission,
    
    // Permisos específicos - Mapa
    canViewMap,
    
    // Permisos específicos - Negocios
    canViewBusinesses,
    canCreateBusinesses,
    canEditBusinesses,
    canDeleteBusinesses,
    
    // Permisos específicos - Usuarios
    canViewUsers,
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,
    
    // Permisos específicos - Admin
    canAccessAdminPanel,
    canViewReports,
    
    // Helpers
    hasAnyPermission,
    hasAllPermissions,
    
    // Debug
    debugPermissions,
    
    // Info del usuario
    isAdmin: user?.role === 'admin',
    userPermissions: user?.permissions || [],
    currentUser: user
  };
};

// ✅ COMPONENTE WRAPPER PARA PERMISOS
export const PermissionWrapper = ({ permission, children, fallback = null }) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return fallback;
  }

  return children;
};

// ✅ HOOK PARA RUTAS PROTEGIDAS
export const useRoutePermissions = () => {
  const { user } = useAuth();
  const permissions = usePermissions();

  const getAccessibleRoutes = () => {
    const routes = [];

    // Dashboard siempre accesible si está autenticado
    if (user) {
      routes.push({ path: '/dashboard', name: 'Dashboard', icon: '🏠' });
    }

    // Rutas según permisos
    if (permissions.canViewMap()) {
      routes.push({ path: '/map', name: 'Mapa', icon: '🗺️' });
    }

    if (permissions.canViewBusinesses()) {
      routes.push({ path: '/businesses', name: 'Negocios', icon: '🏢' });
    }

    if (permissions.canViewUsers()) {
      routes.push({ path: '/users', name: 'Usuarios', icon: '👥' });
    }

    if (permissions.canAccessAdminPanel()) {
      routes.push({ path: '/admin', name: 'Administración', icon: '⚙️' });
    }

    if (permissions.canViewReports()) {
      routes.push({ path: '/reports', name: 'Reportes', icon: '📊' });
    }

    return routes;
  };

  const canAccessRoute = (routePath) => {
    const routePermissions = {
      '/map': 'map:view',
      '/businesses': 'business:read',
      '/users': 'user:read',
      '/admin': 'admin:panel',
      '/reports': 'reports:view'
    };

    const requiredPermission = routePermissions[routePath];
    
    if (!requiredPermission) {
      // Ruta sin permisos específicos (como dashboard)
      return !!user;
    }

    return permissions.hasPermission(requiredPermission);
  };

  return {
    getAccessibleRoutes,
    canAccessRoute
  };
};