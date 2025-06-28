const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware de autenticación
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Token de acceso requerido',
        error: 'NO_TOKEN'
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ BUSCAR USUARIO CON PERMISOS - INCLUIR permissions
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'email', 'full_name', 'role', 'is_active', 'permissions', 'last_login']
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Token inválido - Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({ 
        success: false,
        message: 'Usuario inactivo',
        error: 'USER_INACTIVE'
      });
    }

    // ✅ PROCESAR PERMISOS CORRECTAMENTE
    const userObj = user.toJSON();
    
    console.log('🔍 Debug Auth - Usuario encontrado:', user.username);
    console.log('🔍 Debug Auth - Rol:', user.role);
    console.log('🔍 Debug Auth - Permisos en BD:', user.permissions);
    
    if (user.role === 'admin') {
      userObj.permissions = ['ALL'];
      console.log('🔐 Admin con todos los permisos');
    } else {
      // ✅ USAR PERMISOS REALES DE LA COLUMNA permissions
      userObj.permissions = user.permissions || [];
      console.log('🔐 Permisos de usuario:', userObj.permissions);
    }

    console.log(`🔐 Usuario autenticado: ${user.username} con permisos:`, userObj.permissions);

    // Agregar usuario completo a la request
    req.user = userObj;
    next();
    
  } catch (error) {
    console.error('❌ Error en auth middleware:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token malformado',
        error: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expirado',
        error: 'EXPIRED_TOKEN'
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Middleware para verificar rol de administrador
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador',
      error: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  next();
};

// Middleware opcional de autenticación (no falla si no hay token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // ✅ INCLUIR PERMISOS EN AUTH OPCIONAL
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'username', 'email', 'full_name', 'role', 'is_active', 'permissions', 'last_login']
      });
      
      if (user && user.is_active) {
        const userObj = user.toJSON();
        if (user.role === 'admin') {
          userObj.permissions = ['ALL'];
        } else {
          userObj.permissions = user.permissions || [];
        }
        req.user = userObj;
      }
    }
    
    next();
  } catch (error) {
    // Continuar sin autenticación en caso de error
    console.log('⚠️ Error en optionalAuth:', error.message);
    next();
  }
};

module.exports = { auth, adminAuth, optionalAuth };