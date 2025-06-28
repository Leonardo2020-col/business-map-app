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
    // ✅ OBTENER USUARIO CON PERMISOS
    const user = await User.findByPk(userId, {
      attributes: ['id', 'role', 'is_active', 'permissions']
    });

    if (!user || !user.is_active) {
      return false;
    }

    // Los administradores tienen todos los permisos
    if (user.role === 'admin') {
      return true;
    }

    // ✅ VERIFICAR PRIMERO EN LA COLUMNA permissions (JSON)
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permission);
    }

    // ✅ VERIFICAR EN LA TABLA user_permissions (usando las funciones SQL existentes)
    try {
      const result = await user.sequelize.query(
        `SELECT user_has_permission(:userId, :permission::permission_type) as has_permission`,
        {
          replacements: { userId, permission },
          type: user.sequelize.QueryTypes.SELECT
        }
      );

      return result[0]?.has_permission || false;
    } catch (sqlError) {
      // Si falla la función SQL, verificar directamente en la tabla
      const permissionRecord = await user.sequelize.query(
        `SELECT 1 FROM user_permissions 
         WHERE user_id = :userId 
         AND permission = :permission::permission_type 
         AND is_active = true 
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
        {
          replacements: { userId, permission },
          type: user.sequelize.QueryTypes.SELECT
        }
      );

      return permissionRecord.length > 0;
    }

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
    // ✅ OBTENER USUARIO CON PERMISOS
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

    // ✅ VERIFICAR PRIMERO EN LA COLUMNA permissions (JSON)
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions;
    }

    // ✅ VERIFICAR EN LA TABLA user_permissions
    try {
      const permissions = await user.sequelize.query(
        `SELECT permission::text FROM get_user_permissions(:userId)`,
        {
          replacements: { userId },
          type: user.sequelize.QueryTypes.SELECT
        }
      );

      return permissions.map(p => p.permission);
    } catch (sqlError) {
      // Si falla la función SQL, consultar directamente la tabla
      const permissions = await user.sequelize.query(
        `SELECT permission::text as permission 
         FROM user_permissions 
         WHERE user_id = :userId 
         AND is_active = true 
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
        {
          replacements: { userId },
          type: user.sequelize.QueryTypes.SELECT
        }
      );

      return permissions.map(p => p.permission);
    }

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
        return res.status(401).json({
          success: false,
          message: 'Token de autenticación requerido',
          error: 'AUTHENTICATION_REQUIRED'
        });
      }

      // ✅ USAR LA FUNCIÓN HELPER CORREGIDA
      const hasPermission = await checkUserPermission(userId, permission);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `No tienes permisos para: ${permission}`,
          error: 'INSUFFICIENT_PERMISSIONS',
          required_permission: permission
        });
      }

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

      // ✅ VERIFICAR TODOS LOS PERMISOS USANDO LA FUNCIÓN HELPER
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

      // ✅ VERIFICAR SI TIENE AL MENOS UNO DE LOS PERMISOS
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
    'view': 'business:read',      // ✅ USAR FORMATO DE BD
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
    'view': 'user:read',      // ✅ USAR FORMATO DE BD
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
// CONSTANTES DE PERMISOS - ✅ FORMATO DE BD
// ===============================================
const PERMISSIONS = {
  // Permisos de negocios (formato BD)
  BUSINESS_READ: 'business:read',
  BUSINESS_CREATE: 'business:create',
  BUSINESS_EDIT: 'business:edit',
  BUSINESS_DELETE: 'business:delete',
  
  // Permisos de usuarios (formato BD)
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  
  // Permisos generales (formato BD)
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