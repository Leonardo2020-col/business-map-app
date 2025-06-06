const express = require('express');
const { Op } = require('sequelize');
const sequelize = require('../config/database'); // Importar sequelize para las funciones
const Business = require('../models/Business');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// IMPORTANTE: Rutas específicas DEBEN ir ANTES que las rutas con parámetros dinámicos
// Esto evita que Express confunda /stats/summary con /:id donde id="stats"

// GET /api/businesses/stats/summary - Obtener estadísticas generales
router.get('/stats/summary', auth, async (req, res) => {
  try {
    // Contar total de negocios
    const totalBusinesses = await Business.count();

    // Contar por tipo de negocio
    const businessesByType = await Business.findAll({
      attributes: [
        'business_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['business_type'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });

    // Negocios recientes (últimos 7 días)
    const recentBusinesses = await Business.count({
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Negocios con coordenadas
    const businessesWithCoordinates = await Business.count({
      where: {
        latitude: { [Op.not]: null },
        longitude: { [Op.not]: null }
      }
    });

    res.json({
      success: true,
      data: {
        total: totalBusinesses,
        byType: businessesByType,
        recent: recentBusinesses,
        withCoordinates: businessesWithCoordinates,
        withoutCoordinates: totalBusinesses - businessesWithCoordinates
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

// GET /api/businesses/types/list - Obtener lista de tipos de negocio
router.get('/types/list', auth, async (req, res) => {
  try {
    const types = await Business.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('business_type')), 'business_type']
      ],
      order: [['business_type', 'ASC']],
      raw: true
    });

    const businessTypes = types
      .map(type => type.business_type)
      .filter(type => type) // Filtrar valores null/undefined
      .sort();

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

// GET /api/businesses/search - Búsqueda avanzada de negocios
router.get('/search', auth, async (req, res) => {
  try {
    const { 
      q: query, 
      type, 
      lat, 
      lng, 
      radius = 10, // km
      limit = 20 
    } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'La búsqueda debe tener al menos 2 caracteres',
        error: 'INVALID_SEARCH_QUERY'
      });
    }

    const where = {
      [Op.or]: [
        { name: { [Op.iLike]: `%${query.trim()}%` } },
        { address: { [Op.iLike]: `%${query.trim()}%` } },
        { description: { [Op.iLike]: `%${query.trim()}%` } }
      ]
    };

    if (type) {
      where.business_type = type;
    }

    // Si se proporcionan coordenadas, buscar por proximidad
    let order = [['name', 'ASC']];
    if (lat && lng) {
      // Usar la fórmula de distancia haversine para PostgreSQL
      const earthRadius = 6371; // km
      where[Op.and] = [
        sequelize.literal(`
          (${earthRadius} * acos(
            cos(radians(${parseFloat(lat)})) * 
            cos(radians(latitude)) * 
            cos(radians(longitude) - radians(${parseFloat(lng)})) + 
            sin(radians(${parseFloat(lat)})) * 
            sin(radians(latitude))
          )) <= ${parseFloat(radius)}
        `)
      ];
      
      // Ordenar por distancia
      order = [
        sequelize.literal(`
          (${earthRadius} * acos(
            cos(radians(${parseFloat(lat)})) * 
            cos(radians(latitude)) * 
            cos(radians(longitude) - radians(${parseFloat(lng)})) + 
            sin(radians(${parseFloat(lat)})) * 
            sin(radians(latitude))
          ))
        `)
      ];
    }

    const businesses = await Business.findAll({
      where,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'role']
      }],
      order,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: businesses,
      searchInfo: {
        query: query.trim(),
        type: type || 'all',
        location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng), radius: parseFloat(radius) } : null,
        resultsCount: businesses.length
      }
    });
  } catch (error) {
    console.error('Error en búsqueda de negocios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/businesses - Obtener todos los negocios
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      type, 
      sortBy = 'created_at', 
      sortOrder = 'DESC' 
    } = req.query;

    // Construir condiciones de búsqueda
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (type && type !== 'all') {
      where.business_type = type;
    }

    // Validar campos de ordenamiento
    const allowedSortFields = ['name', 'created_at', 'updated_at', 'business_type'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Configurar paginación
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Máximo 100 elementos
    const offset = (pageNum - 1) * limitNum;

    // Obtener negocios
    const { count, rows: businesses } = await Business.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'role']
      }],
      order: [[sortField, sortDirection]],
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
      },
      filters: {
        search: search || null,
        type: type || null,
        sortBy: sortField,
        sortOrder: sortDirection
      }
    });
  } catch (error) {
    console.error('Error al obtener negocios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/businesses/:id - Obtener un negocio específico
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el ID sea un número
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
        attributes: ['id', 'username', 'role']
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
    console.error('Error al obtener negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/businesses - Crear nuevo negocio
router.post('/', auth, async (req, res) => {
  try {
    const businessData = {
      ...req.body,
      created_by: req.user.id
    };

    // Validaciones adicionales
    if (!businessData.name || !businessData.address || !businessData.business_type) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, dirección y tipo de negocio son requeridos',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validar que el nombre no esté vacío
    if (businessData.name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del negocio debe tener al menos 2 caracteres',
        error: 'INVALID_BUSINESS_NAME'
      });
    }

    // Validar coordenadas si se proporcionan
    if (businessData.latitude || businessData.longitude) {
      const lat = parseFloat(businessData.latitude);
      const lng = parseFloat(businessData.longitude);
      
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Coordenadas inválidas',
          error: 'INVALID_COORDINATES'
        });
      }
      
      businessData.latitude = lat;
      businessData.longitude = lng;
    }

    // Crear el negocio
    const business = await Business.create(businessData);

    // Obtener el negocio creado con la información del usuario
    const createdBusiness = await Business.findByPk(business.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'role']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Negocio creado exitosamente',
      data: createdBusiness
    });
  } catch (error) {
    console.error('Error al crear negocio:', error);
    
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
        message: 'Ya existe un negocio con esos datos',
        error: 'DUPLICATE_BUSINESS'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/businesses/:id - Actualizar negocio
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el ID sea un número
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de negocio inválido',
        error: 'INVALID_BUSINESS_ID'
      });
    }

    // Buscar el negocio
    const business = await Business.findByPk(id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Negocio no encontrado',
        error: 'BUSINESS_NOT_FOUND'
      });
    }

    // Verificar permisos: admin puede editar cualquier negocio, user solo los suyos
    if (req.user.role !== 'admin' && business.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar este negocio',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Validar datos de entrada
    const updateData = { ...req.body };
    delete updateData.id; // No permitir cambiar el ID
    delete updateData.created_by; // No permitir cambiar el creador

    // Validar coordenadas si se proporcionan
    if (updateData.latitude !== undefined || updateData.longitude !== undefined) {
      const lat = parseFloat(updateData.latitude);
      const lng = parseFloat(updateData.longitude);
      
      if (updateData.latitude !== null && updateData.longitude !== null) {
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return res.status(400).json({
            success: false,
            message: 'Coordenadas inválidas',
            error: 'INVALID_COORDINATES'
          });
        }
        updateData.latitude = lat;
        updateData.longitude = lng;
      }
    }

    // Actualizar el negocio
    await business.update(updateData);

    // Obtener el negocio actualizado con la información del usuario
    const updatedBusiness = await Business.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'role']
      }]
    });

    res.json({
      success: true,
      message: 'Negocio actualizado exitosamente',
      data: updatedBusiness
    });
  } catch (error) {
    console.error('Error al actualizar negocio:', error);
    
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

// DELETE /api/businesses/:id - Eliminar negocio
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el ID sea un número
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

    // Verificar permisos: admin puede eliminar cualquier negocio, user solo los suyos
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
    console.error('Error al eliminar negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;