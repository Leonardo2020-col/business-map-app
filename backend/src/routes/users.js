const express = require('express');
const { Op } = require('sequelize');

const router = express.Router();

// ✅ IMPORTAR MIDDLEWARE DE AUTENTICACIÓN
let User, auth;
try {
  User = require('../models/User');
  const authMiddleware = require('../middleware/auth');
  auth = authMiddleware.auth;
  console.log('✅ Middleware auth importado en users routes');
} catch (error) {
  console.error('❌ Error importando en users routes:', error.message);
  User = null;
  auth = (req, res, next) => {
    console.log('⚠️ FALLBACK AUTH EN USERS ROUTES - USANDO ADMIN');
    req.user = { id: 1, role: 'admin', username: 'fallback' };
    next();
  };
}

// ✅ APLICAR AUTENTICACIÓN A TODAS LAS RUTAS
router.use(auth);

// GET /api/users/search/:query - Buscar usuarios (CON AUTENTICACIÓN)
router.get('/search/:query', async (req, res) => {
  try {
    console.log('🔍 Usuario buscando:', req.user?.username, 'buscando:', req.params.query);
    
    const { query } = req.params;
    
    if (!User) {
      return res.status(503).json({
        success: false,
        message: 'Servicio de usuarios no disponible',
        error: 'USER_MODEL_NOT_AVAILABLE'
      });
    }
    
    const users = await User.findAll({
      where: {
        username: {
          [Op.iLike]: `%${query}%`
        }
      },
      attributes: ['id', 'username', 'role', 'created_at'],
      limit: 10
    });
    
    if (users.length > 0) {
      const user = users[0];
      res.json({
        success: true,
        exists: true,
        role: user.role,
        user: user,
        users: users
      });
    } else {
      res.json({
        success: true,
        exists: false,
        message: 'Usuario no encontrado'
      });
    }
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      exists: false,
      message: 'Error al buscar usuarios',
      error: error.message
    });
  }
});

module.exports = router;