const express = require('express');
const { Op } = require('sequelize');

const router = express.Router();

// Importación segura de modelos
let Business, User, sequelize;
try {
  sequelize = require('../config/database');
  Business = require('../models/Business');
  User = require('../models/User');
  console.log('✅ Modelos importados en businesses routes');
} catch (error) {
  console.error('❌ Error importando modelos en businesses routes:', error.message);
  Business = null;
  User = null;
  sequelize = null;
}

// Middleware para verificar que los modelos estén disponibles
const checkModels = (req, res, next) => {
  if (!Business || !User) {
    return res.status(503).json({
      success: false,
      message: 'Servicio de negocios no disponible',
      error: 'MODELS_NOT_AVAILABLE'
    });
  }
  next();
};

// Middleware de autenticación básico (temporal)
const authMiddleware = (req, res, next) => {
  // Por ahora, permitir todas las peticiones
  // TODO: Implementar autenticación real
  req.user = { id: 1, role: 'admin' }; // Usuario temporal
  next();
};

// ============================================================================
// RUTAS ESPECÍFICAS PRIMERO
// ============================================================================

// GET /api/businesses/types/list - Lista de tipos de negocio
router.get('/types/list', checkModels, async (req, res) => {
  try {
    // Lista estática de tipos de negocio
    const businessTypes = [
      { value: 'restaurant', label: 'Restaurante', icon: '🍽️' },
      { value: 'store', label: 'Tienda', icon: '🏪' },
      { value: 'pharmacy', label: 'Farmacia', icon: '💊' },
      { value: 'bakery', label: 'Panadería', icon: '🥖' },
      { value: 'market', label: 'Mercado', icon: '🛒' },
      { value: 'clinic', label: 'Clínica', icon: '🏥' },
      { value: 'workshop', label: 'Taller', icon: '🔧' },
      { value: 'office', label: 'Oficina', icon: '🏢' },
      { value: 'salon', label: 'Salón de belleza', icon: '💇' },
      { value: 'gym', label: 'Gimnasio', icon: '🏋️' },
      { value: 'school', label: 'Colegio/Academia', icon: '🎓' },
      { value: 'bank', label: 'Banco/Financiera', icon: '🏦' },
      { value: 'hotel', label: 'Hotel/Hospedaje', icon: '🏨' },
      { value: 'gas_station', label: 'Grifo', icon: '⛽' },
      { value: 'other', label: 'Otro', icon: '📍' }
    ];

    res.json({
      success: true,
      data: businessTypes
    });
  } catch (error) {
    console.error('Error al obtener tipos de negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/businesses/stats/summary - Estadísticas generales
router.get('/stats/summary', checkModels, async (req, res) => {
  try {
    const totalBusinesses = await Business.count();
    const activeBusinesses = await Business.count({ 
      where: { is_active: true } 
    });

    // Estadísticas por tipo (si el campo existe)
    let businessesByType = [];
    try {
      businessesByType = await Business.findAll({
        attributes: [
          'business_type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['business_type'],
        raw: true
      });
    } catch (typeError) {
      console.warn('Campo business_type no existe, usando estadísticas básicas');
    }

    // Negocios recientes (últimos 30 días)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentBusinesses = await Business.count({
      where: {
        created_at: { [Op.gte]: thirtyDaysAgo }
      }
    });

    res.json({
      success: true,
      data: {
        total: totalBusinesses,
        active: activeBusinesses,
        inactive: totalBusinesses - activeBusinesses,
        recent: recentBusinesses,
        byType: businessesByType
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/businesses/services/status - Estadísticas de servicios
router.get('/services/status', checkModels, async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const services = [
      { name: 'Defensa Civil', field: 'defensa_civil_expiry', icon: '🚨' },
      { name: 'Extintores', field: 'extintores_expiry', icon: '🧯' },
      { name: 'Fumigación', field: 'fumigacion_expiry', icon: '🦟' },
      { name: 'Pozo a Tierra', field: 'pozo_tierra_expiry', icon: '⚡' },
      { name: 'Publicidad', field: 'publicidad_expiry', icon: '📢' }
    ];

    const statistics = await Promise.all(
      services.map(async (service) => {
        try {
          const [expired, expiringSoon, valid, withoutDate] = await Promise.all([
            // Vencidos
            Business.count({
              where: { [service.field]: { [Op.lt]: today } }
            }),
            // Vencen pronto (próximos 30 días)
            Business.count({
              where: { [service.field]: { [Op.between]: [today, thirtyDaysFromNow] } }
            }),
            // Vigentes (más de 30 días)
            Business.count({
              where: { [service.field]: { [Op.gt]: thirtyDaysFromNow } }
            }),
            // Sin fecha
            Business.count({
              where: { [service.field]: null }
            })
          ]);

          return {
            service: service.name,
            field: service.field,
            icon: service.icon,
            expired,
            expiringSoon,
            valid,
            withoutDate,
            total: expired + expiringSoon + valid + withoutDate
          };
        } catch (serviceError) {
          console.warn(`Campo ${service.field} no existe en la BD`);
          return {
            service: service.name,
            field: service.field,
            icon: service.icon,
            expired: 0,
            expiringSoon: 0,
            valid: 0,
            withoutDate: 0,
            total: 0
          };
        }
      })
    );

    // Estadísticas generales
    const totalBusinesses = await Business.count();

    res.json({
      success: true,
      data: {
        summary: {
          totalBusinesses,
          businessesWithIssues: 0, // Calcular según servicios
          businessesOk: totalBusinesses
        },
        services: statistics
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de servicios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// ============================================================================
// RUTAS PRINCIPALES
// ============================================================================

// GET /api/businesses - Obtener todos los negocios
router.get('/', checkModels, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      type,
      district,
      sector,
      sortBy = 'created_at', 
      sortOrder = 'DESC' 
    } = req.query;

    // Construir condiciones de búsqueda
    const where = {};

    if (search) {
      where[Op.or] = [
        { business_name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (type && type !== 'all') {
      where.business_type = type;
    }

    if (district && district !== 'all') {
      where.district = district;
    }

    if (sector && sector !== 'all') {
      where.sector = sector;
    }

    // Configurar paginación
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Obtener negocios
    const { count, rows: businesses } = await Business.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'role'],
        required: false
      }],
      order: [[sortBy, sortOrder]],
      limit: limitNum,
      offset: offset
    });

    res.json({
      success: true,
      data: businesses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        pages: Math.ceil(count / limitNum),
        hasNext: pageNum < Math.ceil(count / limitNum),
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error obteniendo negocios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/businesses - Crear nuevo negocio
router.post('/', checkModels, authMiddleware, async (req, res) => {
  try {
    const businessData = { ...req.body };
    businessData.created_by = req.user.id;

    const newBusiness = await Business.create(businessData);

    res.status(201).json({
      success: true,
      message: 'Negocio creado exitosamente',
      data: newBusiness
    });

  } catch (error) {
    console.error('Error creando negocio:', error);
    
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

// GET /api/businesses/:id - Obtener negocio específico
router.get('/:id', checkModels, async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de negocio inválido',
        error: 'INVALID_BUSINESS_ID'
      });
    }

    const business = await Business.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'role'],
        required: false
      }]
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Negocio no encontrado',
        error: 'BUSINESS_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: business
    });

  } catch (error) {
    console.error('Error obteniendo negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/businesses/:id - Actualizar negocio
router.put('/:id', checkModels, authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de negocio inválido',
        error: 'INVALID_BUSINESS_ID'
      });
    }

    const business = await Business.findByPk(id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Negocio no encontrado',
        error: 'BUSINESS_NOT_FOUND'
      });
    }

    // Verificar permisos
    if (req.user.role !== 'admin' && business.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar este negocio',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.created_by;

    await business.update(updateData);

    const updatedBusiness = await Business.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'role'],
        required: false
      }]
    });

    res.json({
      success: true,
      message: 'Negocio actualizado exitosamente',
      data: updatedBusiness
    });

  } catch (error) {
    console.error('Error actualizando negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// DELETE /api/businesses/:id - Eliminar negocio
router.delete('/:id', checkModels, authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de negocio inválido',
        error: 'INVALID_BUSINESS_ID'
      });
    }

    const business = await Business.findByPk(id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Negocio no encontrado',
        error: 'BUSINESS_NOT_FOUND'
      });
    }

    // Verificar permisos
    if (req.user.role !== 'admin' && business.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este negocio',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    await business.destroy();

    res.json({
      success: true,
      message: 'Negocio eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;