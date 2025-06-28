const User = require('../models/User');

// ===============================================
// MIDDLEWARE PARA VALIDAR PERMISOS ESPECÍFICOS
// ===============================================

/**
 * Función helper para verificar permisos en controladores
 * @param {number} userId - ID del usuario
 * @param {string} permission - Permiso a verificar
 * @returns {Promise<boolean>} - True si tiene el permiso
 */
const checkUserPermission = async (userId, permission) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'role', 'is_active', 'permissions']
    });

    if (!user || !user.is_active) {
      console.log(`❌ Usuario ${userId} no encontrado o inactivo`);
      return false;
    }

    // ✅ CORRECCIÓN: Los administradores tienen todos los permisos
    if (user.role === 'admin') {
      console.log(`✅ Usuario ${userId} es admin - permiso concedido automáticamente`);
      return true;
    }

    // ✅ VERIFICAR PERMISOS ESPECÍFICOS PARA USUARIOS REGULARES
    if (user.permissions && Array.isArray(user.permissions)) {
      const hasPermission = user.permissions.includes(permission);
      console.log(`🔍 Usuario ${userId} - Permiso ${permission}: ${hasPermission ? 'SÍ' : 'NO'}`);
      console.log(`🔑 Permisos del usuario:`, user.permissions);
      return hasPermission;
    }

    console.log(`❌ Usuario ${userId} no tiene permisos definidos`);
    return false;

  } catch (error) {
    console.error('Error verificando permiso:', error);
    return false;
  }
};

/**
 * Función helper para obtener todos los permisos de un usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<string[]>} - Array de permisos
 */
const getUserPermissions = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'role', 'is_active', 'permissions']
    });

    if (!user || !user.is_active) {
      return [];
    }

    // Los administradores tienen todos los permisos
    if (user.role === 'admin') {
      return ['ALL'];
    }

    // Verificar permisos específicos para usuarios regulares
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions;
    }

    return [];

  } catch (error) {
    console.error('Error obteniendo permisos del usuario:', error);
    return [];
  }
};

/**
 * Middleware que verifica si el usuario tiene un permiso específico
 * @param {string} permission - Permiso requerido
 * @returns {Function} - Middleware express
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        console.log(`❌ requirePermission: No hay usuario autenticado`);
        return res.status(401).json({
          success: false,
          message: 'Token de autenticación requerido',
          error: 'AUTHENTICATION_REQUIRED'
        });
      }

      console.log(`🔐 requirePermission: Verificando permiso ${permission} para usuario ${userId}`);

      const hasPermission = await checkUserPermission(userId, permission);

      if (!hasPermission) {
        console.log(`❌ requirePermission: Permiso ${permission} denegado para usuario ${userId}`);
        return res.status(403).json({
          success: false,
          message: `No tienes permisos para: ${permission}`,
          error: 'INSUFFICIENT_PERMISSIONS',
          required_permission: permission
        });
      }

      console.log(`✅ requirePermission: Permiso ${permission} concedido para usuario ${userId}`);
      req.user.hasPermission = true;
      next();

    } catch (error) {
      console.error('Error verificando permisos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_ERROR'
      });
    }
  };
};

/**
 * Middleware que verifica múltiples permisos (AND - todos requeridos)
 * @param {string[]} permissions - Array de permisos requeridos
 * @returns {Function} - Middleware express
 */
const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticación requerido',
          error: 'AUTHENTICATION_REQUIRED'
        });
      }

      const permissionChecks = await Promise.all(
        permissions.map(async (permission) => {
          const hasPermission = await checkUserPermission(userId, permission);
          return {
            permission,
            hasPermission
          };
        })
      );

      const missingPermissions = permissionChecks
        .filter(check => !check.hasPermission)
        .map(check => check.permission);

      if (missingPermissions.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'Permisos insuficientes',
          error: 'INSUFFICIENT_PERMISSIONS',
          missing_permissions: missingPermissions
        });
      }

      req.user.hasAllPermissions = true;
      next();

    } catch (error) {
      console.error('Error verificando permisos múltiples:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_ERROR'
      });
    }
  };
};

/**
 * Middleware que verifica permisos alternativos (OR - al menos uno requerido)
 * @param {string[]} permissions - Array de permisos alternativos
 * @returns {Function} - Middleware express
 */
const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticación requerido',
          error: 'AUTHENTICATION_REQUIRED'
        });
      }

      for (const permission of permissions) {
        const hasPermission = await checkUserPermission(userId, permission);
        if (hasPermission) {
          req.user.hasAnyPermission = true;
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        message: 'Permisos insuficientes',
        error: 'INSUFFICIENT_PERMISSIONS',
        required_permissions: permissions
      });

    } catch (error) {
      console.error('Error verificando permisos alternativos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_ERROR'
      });
    }
  };
};

/**
 * Middleware para agregar permisos del usuario al request
 * Útil para el frontend para mostrar/ocultar elementos
 */
const attachUserPermissions = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (userId) {
      const permissions = await getUserPermissions(userId);
      req.user.permissions = permissions;
      console.log(`🔐 Permisos adjuntados para usuario ${userId}:`, permissions);
    }
    
    next();
  } catch (error) {
    console.error('Error adjuntando permisos:', error);
    next(); // Continuar sin permisos
  }
};

/**
 * Middleware de validación de permisos para negocios
 * Verifica permisos específicos según la acción
 */
const validateBusinessPermissions = (action) => {
  const permissionMap = {
    'view': 'business:read',
    'create': 'business:create',
    'edit': 'business:edit',
    'delete': 'business:delete'
  };

  const permission = permissionMap[action];
  
  if (!permission) {
    throw new Error(`Acción de negocio inválida: ${action}`);
  }

  return requirePermission(permission);
};

/**
 * Middleware de validación de permisos para usuarios
 * Verifica permisos específicos según la acción
 */
const validateUserPermissions = (action) => {
  const permissionMap = {
    'view': 'user:read',
    'create': 'user:create',
    'edit': 'user:edit',
    'delete': 'user:delete'
  };

  const permission = permissionMap[action];
  
  if (!permission) {
    throw new Error(`Acción de usuario inválida: ${action}`);
  }

  return requirePermission(permission);
};

// ===============================================
// CONSTANTES DE PERMISOS
// ===============================================
const PERMISSIONS = {
  // Permisos de negocios
  BUSINESS_READ: 'business:read',
  BUSINESS_CREATE: 'business:create',
  BUSINESS_EDIT: 'business:edit',
  BUSINESS_DELETE: 'business:delete',
  
  // Permisos de usuarios
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  
  // Permisos generales
  ADMIN_PANEL: 'admin:panel',
  REPORTS_VIEW: 'reports:view',
  MAP_VIEW: 'map:view'
};

module.exports = {
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  checkUserPermission,
  getUserPermissions,
  attachUserPermissions,
  validateBusinessPermissions,
  validateUserPermissions,
  PERMISSIONS
};