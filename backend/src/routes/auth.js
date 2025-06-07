const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Middleware de autenticación simple (para reset-password)
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acceso requerido'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// Función para generar JWT
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Función para sanitizar datos del usuario
const sanitizeUser = (user) => {
  const { password, ...userWithoutPassword } = user.toJSON();
  return userWithoutPassword;
};

// Función para validar formato de username
const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// POST /api/auth/register - Registro de usuarios
router.post('/register', async (req, res) => {
  try {
    const { username, password, role = 'user' } = req.body;

    console.log('📝 Register attempt:', { username, role, hasPassword: !!password });

    // Validaciones básicas
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username y password son requeridos',
        error: 'MISSING_FIELDS'
      });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        message: 'El username debe tener entre 3-20 caracteres y solo contener letras, números y guiones bajos',
        error: 'INVALID_USERNAME_FORMAT'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres',
        error: 'PASSWORD_TOO_SHORT'
      });
    }

    // Validar rol
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido. Debe ser "user" o "admin"',
        error: 'INVALID_ROLE'
      });
    }

    // Verificar si el usuario ya existe (case insensitive)
    const existingUser = await User.findOne({ 
      where: { username: username.toLowerCase() } 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe',
        error: 'USER_EXISTS'
      });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear el usuario
    const user = await User.create({
      username: username.toLowerCase(),
      password: hashedPassword,
      role
    });

    console.log('✅ Usuario creado exitosamente:', user.username);

    // Generar token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      token,
      user: sanitizeUser(user)
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

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe',
        error: 'USER_EXISTS'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/auth/login - Inicio de sesión
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('🔐 Login attempt:', { 
      username, 
      hasPassword: !!password,
      passwordLength: password?.length,
      timestamp: new Date().toISOString()
    });

    // Validaciones básicas
    if (!username || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Username y password son requeridos',
        error: 'MISSING_CREDENTIALS'
      });
    }

    // Buscar el usuario (case insensitive)
    console.log(`🔍 Searching for user: "${username}" (lowercase: "${username.toLowerCase()}")`);
    
    const user = await User.findOne({ 
      where: { username: username.toLowerCase() } 
    });
    
    if (!user) {
      console.log(`❌ User not found: ${username}`);
      return res.status(400).json({
        success: false,
        message: 'Credenciales inválidas',
        error: 'INVALID_CREDENTIALS'
      });
    }

    console.log(`✅ User found: ${user.username} (ID: ${user.id}, Role: ${user.role})`);

    // Verificar la contraseña
    console.log('🔑 Checking password...');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log(`❌ Password mismatch for user: ${username}`);
      return res.status(400).json({
        success: false,
        message: 'Credenciales inválidas',
        error: 'INVALID_CREDENTIALS'
      });
    }

    console.log(`✅ Password correct for user: ${username}`);

    // Generar token
    console.log('🎫 Generating JWT token...');
    const token = generateToken(user);

    console.log(`🎉 Login successful for user: ${username}`);

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/auth/verify - Verificar token
router.get('/verify', auth, async (req, res) => {
  try {
    console.log('🔍 Token verification for user:', req.user.username);
    res.json({
      success: true,
      message: 'Token válido',
      user: sanitizeUser(req.user)
    });
  } catch (error) {
    console.error('❌ Error en verificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/auth/profile - Obtener perfil del usuario
router.get('/profile', auth, async (req, res) => {
  try {
    console.log('👤 Profile request for user:', req.user.username);
    
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Perfil obtenido exitosamente',
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('❌ Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/auth/profile - Actualizar perfil del usuario
router.put('/profile', auth, async (req, res) => {
  try {
    const { username } = req.body;

    console.log('✏️ Profile update for user:', req.user.username, 'new username:', username);

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username es requerido',
        error: 'MISSING_USERNAME'
      });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        message: 'El username debe tener entre 3-20 caracteres y solo contener letras, números y guiones bajos',
        error: 'INVALID_USERNAME_FORMAT'
      });
    }

    // Verificar si el username ya existe (excluyendo el usuario actual)
    const existingUser = await User.findOne({
      where: {
        username: username.toLowerCase(),
        id: { [require('sequelize').Op.ne]: req.user.id }
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El username ya está en uso',
        error: 'USERNAME_TAKEN'
      });
    }

    // Actualizar el usuario
    await req.user.update({ username: username.toLowerCase() });

    // Obtener datos actualizados
    const updatedUser = await User.findByPk(req.user.id);

    console.log('✅ Profile updated successfully for user:', updatedUser.username);

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: sanitizeUser(updatedUser)
    });
  } catch (error) {
    console.error('❌ Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/auth/change-password - Cambiar contraseña
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    console.log('🔒 Password change request for user:', req.user.username);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva contraseña son requeridas',
        error: 'MISSING_PASSWORDS'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres',
        error: 'PASSWORD_TOO_SHORT'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe ser diferente a la actual',
        error: 'SAME_PASSWORD'
      });
    }

    // Verificar contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, req.user.password);
    if (!isMatch) {
      console.log('❌ Current password incorrect for user:', req.user.username);
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual incorrecta',
        error: 'WRONG_CURRENT_PASSWORD'
      });
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña
    await req.user.update({ password: hashedPassword });

    console.log('✅ Password updated successfully for user:', req.user.username);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/auth/reset-password - Resetear contraseña (solo admin)
router.post('/reset-password', authMiddleware, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo administradores pueden resetear contraseñas.'
      });
    }

    const { username, newPassword } = req.body;

    // Validaciones
    if (!username || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Username y nueva contraseña son requeridos'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Buscar el usuario
    const user = await User.findOne({
      where: { username: username.toLowerCase() }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar la contraseña
    await user.update({
      password: hashedPassword
    });

    console.log(`🔑 Admin ${req.user.username} reset password for user: ${username}`);

    res.json({
      success: true,
      message: `Contraseña actualizada exitosamente para el usuario "${username}"`
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', auth, async (req, res) => {
  try {
    console.log(`👋 Usuario ${req.user.username} cerró sesión`);
    
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;