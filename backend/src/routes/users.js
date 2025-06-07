const express = require('express');
const { User } = require('../models');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// Buscar usuarios (solo admin)
router.get('/search/:query', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { query } = req.params;
    
    const users = await User.findAll({
      where: {
        username: {
          [Op.iLike]: `%${query}%` // Búsqueda case-insensitive
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
      message: 'Error al buscar usuarios'
    });
  }
});

module.exports = router;