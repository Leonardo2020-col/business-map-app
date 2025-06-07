const express = require('express');
const { Op } = require('sequelize');
const User = require('../models/User');  // Cambio aquí
// const authMiddleware = require('../middleware/auth');  // Comentar si no existe
// const adminMiddleware = require('../middleware/admin'); // Comentar si no existe

const router = express.Router();

// Buscar usuarios (solo admin por ahora, sin middleware)
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
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar usuarios',
      error: error.message
    });
  }
});

// Listar todos los usuarios
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'role', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
});

module.exports = router;