const express = require('express');
const bcrypt = require('bcryptjs'); // ← CAMBIO: bcrypt por bcryptjs
const jwt = require('jsonwebtoken');

const router = express.Router();

// Importación segura del modelo User
let User;
try {
  User = require('../models/User');
  console.log('✅ Modelo User importado en auth routes');
} catch (error) {
  console.error('❌ Error importando User en auth routes:', error.message);
  User = null;
}

// ===============================================
// RUTAS DE AUTENTICACIÓN
// ===============================================

// POST /api/auth/login - Iniciar sesión
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validaciones básicas
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username y password son requeridos',
        error: 'MISSING_CREDENTIALS'
      });
    }

    // Verificar que el modelo User esté disponible
    if (!User) {
      return res.status(503).json({
        success: false,
        message: 'Servicio de autenticación no disponible',
        error: 'USER_MODEL_NOT_AVAILABLE'
      });
    }

    // Buscar usuario
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar que el usuario esté activo
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Usuario inactivo',
        error: 'USER_INACTIVE'
      });
    }

    // Generar JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'default_secret_change_in_production',
      { expiresIn: '24h' }
    );

    // Actualizar último login
    try {
      await user.updateLastLogin();
    } catch (updateError) {
      console.warn('⚠️ No se pudo actualizar last_login:', updateError.message);
    }

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: user.toSafeJSON()
      }
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/auth/register - Registrar usuario (básico)
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, full_name } = req.body;

    // Validaciones
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username y password son requeridos',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres',
        error: 'INVALID_PASSWORD'
      });
    }

    // Verificar que el modelo User esté disponible
    if (!User) {
      return res.status(503).json({
        success: false,
        message: 'Servicio de registro no disponible',
        error: 'USER_MODEL_NOT_AVAILABLE'
      });
    }

    // Verificar unicidad
    try {
      await User.checkUnique(username, email);
    } catch (uniqueError) {
      return res.status(400).json({
        success: false,
        message: uniqueError.message,
        error: 'DUPLICATE_USER'
      });
    }

    // Hashear contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const user = await User.create({
      username: username.toLowerCase().trim(),
      password: hashedPassword,
      email: email ? email.toLowerCase().trim() : null,
      full_name: full_name ? full_name.trim() : null,
      role: 'user',
      is_active: true
    });

    // Generar token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'default_secret_change_in_production',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        token,
        user: user.toSafeJSON()
      }
    });

  } catch (error) {
    console.error('❌ Error en registro:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        error: 'VALIDATION_ERROR',
        details: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/auth/me - Obtener perfil del usuario actual
router.get('/me', async (req, res) => {
  try {
    // Verificar token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido',
        error: 'TOKEN_REQUIRED'
      });
    }

    // Decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_change_in_production');
    
    // Verificar que el modelo User esté disponible
    if (!User) {
      return res.status(503).json({
        success: false,
        message: 'Servicio de usuario no disponible',
        error: 'USER_MODEL_NOT_AVAILABLE'
      });
    }

    // Buscar usuario actual
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({
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

    res.json({
      success: true,
      data: user.toSafeJSON()
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        error: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        error: 'TOKEN_EXPIRED'
      });
    }

    console.error('❌ Error en /me:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/auth/verify - Verificar validez del token
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token requerido',
        error: 'TOKEN_REQUIRED'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_change_in_production');
    
    res.json({
      success: true,
      message: 'Token válido',
      data: {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        exp: decoded.exp
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        error: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        error: 'TOKEN_EXPIRED'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error verificando token',
      error: 'VERIFICATION_ERROR'
    });
  }
});

// POST /api/auth/reset-password - Resetear contraseña (solo admins)
router.post('/reset-password', async (req, res) => {
  try {
    const { username, newPassword } = req.body;

    // Verificar token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido',
        error: 'TOKEN_REQUIRED'
      });
    }

    // Decodificar token y verificar que sea admin
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_change_in_production');
    
    // Verificar que el modelo User esté disponible
    if (!User) {
      return res.status(503).json({
        success: false,
        message: 'Servicio de usuarios no disponible',
        error: 'USER_MODEL_NOT_AVAILABLE'
      });
    }

    // Buscar usuario que hace la petición
    const adminUser = await User.findByPk(decoded.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden resetear contraseñas',
        error: 'ADMIN_REQUIRED'
      });
    }

    // Validaciones básicas
    if (!username || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de usuario y nueva contraseña son requeridos',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres',
        error: 'INVALID_PASSWORD'
      });
    }

    // Buscar usuario a resetear
    const targetUser = await User.findByUsername(username);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    // Hashear nueva contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    await targetUser.update({
      password: hashedPassword,
      updated_at: new Date()
    });

    console.log(`🔑 Admin ${adminUser.username} reseteo la contraseña de ${targetUser.username}`);

    // Respuesta exitosa (sin incluir la contraseña)
    res.json({
      success: true,
      message: `Contraseña actualizada exitosamente para el usuario ${username}`,
      data: {
        username: targetUser.username,
        resetBy: adminUser.username,
        resetAt: new Date().toISOString()
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        error: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        error: 'TOKEN_EXPIRED'
      });
    }

    console.error('❌ Error en reset-password:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;