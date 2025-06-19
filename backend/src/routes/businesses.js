const express = require('express');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Business = require('../models/Business');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// IMPORTANTE: Rutas específicas DEBEN ir ANTES que las rutas con parámetros dinámicos
// Esto evita que Express confunda /stats/summary con /:id donde id="stats"

// ============================================================================
// NUEVOS ENDPOINTS PARA SERVICIOS
// ============================================================================

// GET /api/businesses/services/status - Estadísticas de servicios
router.get('/services/status', auth, async (req, res) => {
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
      })
    );

    // Estadísticas generales
    const totalBusinesses = await Business.count();
    const businessesWithIssues = await Business.count({
      where: {
        [Op.or]: [
          // Servicios vencidos
          { defensa_civil_expiry: { [Op.lt]: today } },
          { extintores_expiry: { [Op.lt]: today } },
          { fumigacion_expiry: { [Op.lt]: today } },
          { pozo_tierra_expiry: { [Op.lt]: today } },
          { publicidad_expiry: { [Op.lt]: today } },
          // Servicios que vencen pronto
          { defensa_civil_expiry: { [Op.between]: [today, thirtyDaysFromNow] } },
          { extintores_expiry: { [Op.between]: [today, thirtyDaysFromNow] } },
          { fumigacion_expiry: { [Op.between]: [today, thirtyDaysFromNow] } },
          { pozo_tierra_expiry: { [Op.between]: [today, thirtyDaysFromNow] } },
          { publicidad_expiry: { [Op.between]: [today, thirtyDaysFromNow] } }
        ]
      }
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalBusinesses,
          businessesWithIssues,
          businessesOk: totalBusinesses - businessesWithIssues
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

// PUT /api/businesses/:id - Actualizar negocio (ACTUALIZADO)
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

    // VALIDAR FECHAS DE SERVICIOS
    const serviceFields = ['defensa_civil_expiry', 'extintores_expiry', 'fumigacion_expiry', 'pozo_tierra_expiry', 'publicidad_expiry'];
    for (const field of serviceFields) {
      if (updateData[field] && updateData[field] !== null) {
        const date = new Date(updateData[field]);
        if (isNaN(date.getTime())) {
          return res.status(400).json({
            success: false,
            message: `Fecha inválida para ${field}`,
            error: 'INVALID_SERVICE_DATE'
          });
        }
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

    // AGREGAR INFORMACIÓN DE SERVICIOS
    const businessWithServices = updatedBusiness.toJSON();
    businessWithServices.servicesStatus = updatedBusiness.getServicesStatus();
    businessWithServices.hasServiceIssues = updatedBusiness.hasServiceIssues();

    res.json({
      success: true,
      message: 'Negocio actualizado exitosamente',
      data: businessWithServices
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
    