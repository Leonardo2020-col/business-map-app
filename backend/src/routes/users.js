const express = require('express');
const { Op } = require('sequelize');
const User = require('../models/User');  // Cambio aquí
// const authMiddleware = require('../middleware/auth');  // Comentar si no existe
// const adminMiddleware = require('../middleware/admin'); // Comentar si no existe

const router = express.Router();

// Buscar usuarios (verificar si existe)
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
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
        exists: true,           // ← El frontend necesita esto
        role: user.role,        // ← Y esto
        user: user,
        users: users
      });
    } else {
      res.json({
        success: true,
        exists: false,          // ← Y esto cuando no encuentra
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