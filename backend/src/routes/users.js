const express = require('express');
const { Op } = require('sequelize');

const router = express.Router();

// Importación segura de modelos
let Business, User, sequelize, auth, requirePermission;
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

// ✅ IMPORTAR MIDDLEWARE DE AUTENTICACIÓN REAL
try {
  const authMiddleware = require('../middleware/auth');
  const permissionsMiddleware = require('../middleware/permissions');
  auth = authMiddleware.auth;
  requirePermission = permissionsMiddleware.requirePermission;
  console.log('✅ Middleware de autenticación importado correctamente');
} catch (error) {
  console.error('❌ Error importando middleware de autenticación:', error.message);
  // Fallback para desarrollo
  auth = (req, res, next) => {
    req.user = { id: 1, role: 'admin', username: 'fallback' };
    next();
  };
  requirePermission = (perm) => (req, res, next) => next();
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

// ============================================================================
// RUTAS ESPECÍFICAS PRIMERO
// ============================================================================

// GET /api/businesses/types/list - Lista de tipos de negocio (SIN AUTENTICACIÓN)
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

// GET /api/businesses/stats/summary - Estadísticas generales - ✅ CON PERMISOS
router.get('/stats/summary', checkModels, auth, requirePermission('reports:view'), async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas del dashboard...');
    console.log('👤 Usuario solicitando stats:', req.user?.username, 'con permisos:', req.user?.permissions);

    // Estadísticas básicas que siempre funcionan
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
      // Contar total de negocios
      basicStats.total = await Business.count();
      console.log(`✅ Total de negocios: ${basicStats.total}`);

      // Intentar contar activos (si el campo existe)
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

      // Negocios recientes (últimos 30 días)
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        basicStats.recent = await Business.count({
          where: {
            created_at: { [Op.gte]: thirtyDaysAgo }
          }
        });
        console.log(`✅ Negocios recientes: ${basicStats.recent}`);
      } catch (recentError) {
        console.warn('⚠️ No se pudo calcular negocios recientes:', recentError.message);
        basicStats.recent = 0;
      }

      // Estadísticas por tipo (si el campo existe)
      try {
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
        console.log(`✅ Tipos de negocio: ${basicStats.byType.length}`);
      } catch (typeError) {
        console.warn('⚠️ Campo business_type no existe o error:', typeError.message);
        basicStats.byType = [{ type: 'Todos', count: basicStats.total }];
      }

      // Estadísticas por distrito
      try {
        const businessesByDistrict = await Business.findAll({
          attributes: [
            'distrito',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          group: ['distrito'],
          raw: true,
          limit: 10 // Solo top 10
        });
        
        basicStats.byDistrict = businessesByDistrict.map(item => ({
          district: item.distrito || 'Sin distrito',
          count: parseInt(item.count) || 0
        }));
        console.log(`✅ Distritos: ${basicStats.byDistrict.length}`);
      } catch (districtError) {
        console.warn('⚠️ Campo distrito no existe o error:', districtError.message);
        basicStats.byDistrict = [];
      }

      // Estadísticas de servicios (si los campos existen)
      try {
        const today = new Date();
        const serviceFields = [
          'defensa_civil_expiry', 
          'extintores_expiry', 
          'fumigacion_expiry', 
          'pozo_tierra_expiry', 
          'publicidad_expiry'
        ];

        let businessesWithIssues = 0;
        for (const field of serviceFields) {
          try {
            const count = await Business.count({
              where: { [field]: { [Op.lt]: today } }
            });
            businessesWithIssues += count;
          } catch (fieldError) {
            // Campo no existe, continuar
          }
        }

        basicStats.servicesStatus = {
          total: basicStats.total,
          withIssues: businessesWithIssues,
          ok: basicStats.total - businessesWithIssues
        };
        console.log(`✅ Servicios - Con problemas: ${businessesWithIssues}`);
      } catch (servicesError) {
        console.warn('⚠️ No se pudieron calcular estadísticas de servicios:', servicesError.message);
        basicStats.servicesStatus = {
          total: basicStats.total,
          withIssues: 0,
          ok: basicStats.total
        };
      }

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
});

// GET /api/businesses/services/status - ✅ CON PERMISOS
router.get('/services/status', checkModels, auth, requirePermission('reports:view'), async (req, res) => {
  try {
    console.log('📊 Usuario solicitando servicios:', req.user?.username);
    
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
            Business.count({
              where: { [service.field]: { [Op.lt]: today } }
            }),
            Business.count({
              where: { [service.field]: { [Op.between]: [today, thirtyDaysFromNow] } }
            }),
            Business.count({
              where: { [service.field]: { [Op.gt]: thirtyDaysFromNow } }
            }),
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

    const totalBusinesses = await Business.count();

    res.json({
      success: true,
      data: {
        summary: {
          totalBusinesses,
          businessesWithIssues: 0,
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

// GET /api/businesses - ✅ CON PERMISOS DE LECTURA
router.get('/', checkModels, auth, requirePermission('business:read'), async (req, res) => {
  try {
    console.log('📋 Usuario solicitando negocios:', req.user?.username, 'con permisos:', req.user?.permissions);
    
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

    console.log(`✅ ${businesses.length} negocios devueltos a ${req.user.username}`);

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

// POST /api/businesses - ✅ CON PERMISOS DE CREACIÓN
router.post('/', checkModels, auth, requirePermission('business:create'), async (req, res) => {
  try {
    console.log('➕ Usuario creando negocio:', req.user?.username);
    
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

// GET /api/businesses/:id - ✅ CON PERMISOS DE LECTURA
router.get('/:id', checkModels, auth, requirePermission('business:read'), async (req, res) => {
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

// PUT /api/businesses/:id - ✅ CON PERMISOS DE EDICIÓN
router.put('/:id', checkModels, auth, requirePermission('business:edit'), async (req, res) => {
  try {
    console.log('✏️ Usuario editando negocio:', req.user?.username);
    
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

    // Verificar permisos adicionales
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

// DELETE /api/businesses/:id - ✅ CON PERMISOS DE ELIMINACIÓN
router.delete('/:id', checkModels, auth, requirePermission('business:delete'), async (req, res) => {
  try {
    console.log('🗑️ Usuario eliminando negocio:', req.user?.username);
    
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

    // Verificar permisos adicionales
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