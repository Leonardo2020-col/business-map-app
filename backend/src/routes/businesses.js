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

// ✅ IMPORTAR MIDDLEWARE DE PERMISOS
let auth, requirePermission;
try {
  const authMiddleware = require('../middleware/auth');
  const permissionsMiddleware = require('../middleware/permissions');
  auth = authMiddleware.auth;
  requirePermission = permissionsMiddleware.requirePermission;
  console.log('✅ Middleware de permisos importado');
} catch (error) {
  console.error('❌ Error importando middleware de permisos:', error.message);
  auth = (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
  };
  requirePermission = (permission) => (req, res, next) => next();
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

// ✅ FUNCIÓN HELPER PARA VERIFICAR PERMISOS
const hasPermission = (userPermissions, requiredPermission) => {
  // Si es admin, tiene todos los permisos
  if (userPermissions.includes('ALL')) {
    return true;
  }
  
  // Verificar si tiene el permiso específico
  return userPermissions.includes(requiredPermission);
};

// ✅ MIDDLEWARE PERSONALIZADO PARA VALIDAR PERMISOS
const validateBusinessPermission = (requiredPermission) => {
  return (req, res, next) => {
    const userPermissions = req.user?.permissions || [];
    
    console.log(`🔐 Validando permiso: ${requiredPermission}`);
    console.log(`👤 Usuario: ${req.user?.username}`);
    console.log(`🔑 Permisos del usuario:`, userPermissions);
    
    if (!hasPermission(userPermissions, requiredPermission)) {
      console.log(`❌ Permiso denegado para ${requiredPermission}`);
      return res.status(403).json({
        success: false,
        message: `No tienes permisos para: ${requiredPermission}`,
        error: 'INSUFFICIENT_PERMISSIONS',
        required_permission: requiredPermission,
        user_permissions: userPermissions
      });
    }
    
    console.log(`✅ Permiso concedido para ${requiredPermission}`);
    next();
  };
};

// ============================================================================
// RUTAS ESPECÍFICAS PRIMERO
// ============================================================================

// GET /api/businesses/types/list - Lista de tipos de negocio
router.get('/types/list', checkModels, async (req, res) => {
  try {
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
router.get('/stats/summary', 
  auth, 
  checkModels, 
  validateBusinessPermission('business:read'),
  async (req, res) => {
    try {
      console.log('📊 Obteniendo estadísticas del dashboard...');

      const basicStats = {
        total: 0,
        active: 0,
        inactive: 0,
        recent: 0,
        byType: [],
        byDistrict: [],
        servicesStatus: {
          total: 0,
          withIssues: 0,
          ok: 0
        }
      };

      try {
        basicStats.total = await Business.count();
        console.log(`✅ Total de negocios: ${basicStats.total}`);

        try {
          basicStats.active = await Business.count({ 
            where: { is_active: true } 
          });
          basicStats.inactive = basicStats.total - basicStats.active;
          console.log(`✅ Activos: ${basicStats.active}, Inactivos: ${basicStats.inactive}`);
        } catch (activeError) {
          console.warn('⚠️ Campo is_active no existe, usando todos como activos');
          basicStats.active = basicStats.total;
          basicStats.inactive = 0;
        }

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        basicStats.recent = await Business.count({
          where: {
            created_at: { [Op.gte]: thirtyDaysAgo }
          }
        });

        const businessesByType = await Business.findAll({
          attributes: [
            'business_type',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          group: ['business_type'],
          raw: true
        });
        
        basicStats.byType = businessesByType.map(item => ({
          type: item.business_type || 'Sin tipo',
          count: parseInt(item.count) || 0
        }));

        const businessesByDistrict = await Business.findAll({
          attributes: [
            'distrito',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          group: ['distrito'],
          raw: true,
          limit: 10
        });
        
        basicStats.byDistrict = businessesByDistrict.map(item => ({
          district: item.distrito || 'Sin distrito',
          count: parseInt(item.count) || 0
        }));

      } catch (queryError) {
        console.error('❌ Error en consultas de estadísticas:', queryError);
      }

      console.log('📊 Estadísticas calculadas exitosamente');
      
      res.json({
        success: true,
        data: basicStats,
        timestamp: new Date().toISOString(),
        message: 'Estadísticas obtenidas correctamente'
      });

    } catch (error) {
      console.error('❌ Error fatal en stats/summary:', error);
      
      res.json({
        success: true,
        data: {
          total: 0,
          active: 0,
          inactive: 0,
          recent: 0,
          byType: [],
          byDistrict: [],
          servicesStatus: {
            total: 0,
            withIssues: 0,
            ok: 0
          }
        },
        error: 'Estadísticas no disponibles temporalmente',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// ============================================================================
// RUTAS PRINCIPALES CON VALIDACIÓN DE PERMISOS
// ============================================================================

// GET /api/businesses - Obtener todos los negocios
router.get('/', 
  auth, 
  checkModels, 
  validateBusinessPermission('business:read'),
  async (req, res) => {
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

      const where = {};

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { address: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (type && type !== 'all') {
        where.business_type = type;
      }

      if (district && district !== 'all') {
        where.distrito = district;
      }

      if (sector && sector !== 'all') {
        where.sector = sector;
      }

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const offset = (pageNum - 1) * limitNum;

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
  }
);

// POST /api/businesses - Crear nuevo negocio
router.post('/', 
  auth,
  checkModels, 
  validateBusinessPermission('business:create'),
  async (req, res) => {
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
  }
);

// GET /api/businesses/:id - Obtener negocio específico
router.get('/:id', 
  auth,
  checkModels, 
  validateBusinessPermission('business:read'),
  async (req, res) => {
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
  }
);

// PUT /api/businesses/:id - Actualizar negocio
router.put('/:id', 
  auth,
  checkModels, 
  validateBusinessPermission('business:edit'),
  async (req, res) => {
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

      // Verificar permisos adicionales para usuarios no admin
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
  }
);

// DELETE /api/businesses/:id - Eliminar negocio
router.delete('/:id', 
  auth,
  checkModels, 
  validateBusinessPermission('business:delete'),
  async (req, res) => {
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

      // Verificar permisos adicionales para usuarios no admin
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
  }
);

module.exports = router;