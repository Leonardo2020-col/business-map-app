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
    
    // Buscar el usuario
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Token inválido - Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    // Agregar usuario a la request
    req.user = user;
    next();
  } catch (error) {
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

    console.error('Error en middleware de autenticación:', error);
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
      const user = await User.findByPk(decoded.id);
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continuar sin autenticación en caso de error
    next();
  }
};

module.exports = { auth, adminAuth, optionalAuth };