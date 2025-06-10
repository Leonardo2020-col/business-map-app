const User = require('../models/User');

// ===============================================
// MIDDLEWARE PARA VALIDAR PERMISOS ESPECÍFICOS
// ===============================================

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

      // Obtener usuario con rol
      const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'role', 'is_active']
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado',
          error: 'USER_NOT_FOUND'
        });
      }

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Usuario inactivo',
          error: 'USER_INACTIVE'
        });
      }

      // Los administradores tienen todos los permisos
      if (user.role === 'admin') {
        req.user.hasPermission = true;
        return next();
      }

      // Verificar permiso específico para usuarios normales
      const hasPermission = await user.sequelize.query(
        `SELECT user_has_permission(:userId, :permission) as has_permission`,
        {
          replacements: { userId, permission },
          type: user.sequelize.QueryTypes.SELECT
        }
      );

      if (!hasPermission[0]?.has_permission) {
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

      const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'role', 'is_active']
      });

      if (!user || !user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Usuario no encontrado o inactivo',
          error: 'USER_INACTIVE'
        });
      }

      // Los administradores tienen todos los permisos
      if (user.role === 'admin') {
        req.user.hasAllPermissions = true;
        return next();
      }

      // Verificar todos los permisos
      const permissionChecks = await Promise.all(
        permissions.map(async (permission) => {
          const result = await user.sequelize.query(
            `SELECT user_has_permission(:userId, :permission) as has_permission`,
            {
              replacements: { userId, permission },
              type: user.sequelize.QueryTypes.SELECT
            }
          );
          return {
            permission,
            hasPermission: result[0]?.has_permission || false
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

      const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'role', 'is_active']
      });

      if (!user || !user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Usuario no encontrado o inactivo',
          error: 'USER_INACTIVE'
        });
      }

      // Los administradores tienen todos los permisos
      if (user.role === 'admin') {
        req.user.hasAnyPermission = true;
        return next();
      }

      // Verificar si tiene al menos uno de los permisos
      for (const permission of permissions) {
        const result = await user.sequelize.query(
          `SELECT user_has_permission(:userId, :permission) as has_permission`,
          {
            replacements: { userId, permission },
            type: user.sequelize.QueryTypes.SELECT
          }
        );

        if (result[0]?.has_permission) {
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
 * Función helper para verificar permisos en controladores
 * @param {number} userId - ID del usuario
 * @param {string} permission - Permiso a verificar
 * @returns {Promise<boolean>} - True si tiene el permiso
 */
const checkUserPermission = async (userId, permission) => {
  try {
    // Obtener usuario
    const user = await User.findByPk(userId, {
      attributes: ['id', 'role', 'is_active']
    });

    if (!user || !user.is_active) {
      return false;
    }

    // Los administradores tienen todos los permisos
    if (user.role === 'admin') {
      return true;
    }

    // Verificar permiso específico
    const result = await user.sequelize.query(
      `SELECT user_has_permission(:userId, :permission) as has_permission`,
      {
        replacements: { userId, permission },
        type: user.sequelize.QueryTypes.SELECT
      }
    );

    return result[0]?.has_permission || false;

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
      attributes: ['id', 'role', 'is_active']
    });

    if (!user || !user.is_active) {
      return [];
    }

    // Los administradores tienen todos los permisos
    if (user.role === 'admin') {
      return ['ALL'];
    }

    // Obtener permisos específicos
    const permissions = await user.sequelize.query(
      `SELECT permission FROM get_user_permissions(:userId)`,
      {
        replacements: { userId },
        type: user.sequelize.QueryTypes.SELECT
      }
    );

    return permissions.map(p => p.permission);

  } catch (error) {
    console.error('Error obteniendo permisos del usuario:', error);
    return [];
  }
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
    'view': 'businesses_view',
    'create': 'businesses_create',
    'edit': 'businesses_edit',
    'delete': 'businesses_delete'
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
    'view': 'users_view',
    'create': 'users_create',
    'edit': 'users_edit',
    'delete': 'users_delete'
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
  BUSINESSES_VIEW: 'businesses_view',
  BUSINESSES_CREATE: 'businesses_create',
  BUSINESSES_EDIT: 'businesses_edit',
  BUSINESSES_DELETE: 'businesses_delete',
  
  // Permisos de usuarios
  USERS_VIEW: 'users_view',
  USERS_CREATE: 'users_create',
  USERS_EDIT: 'users_edit',
  USERS_DELETE: 'users_delete',
  
  // Permisos generales
  ADMIN_PANEL: 'admin_panel',
  REPORTS_VIEW: 'reports_view',
  MAP_VIEW: 'map_view'
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