const express = require('express');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const User = require('../../models/User');
const { auth, adminAuth } = require('../../middleware/auth');
const { validateUserPermissions } = require('../../middleware/permissions');

const router = express.Router();

// Middleware: Solo administradores pueden acceder a estas rutas
router.use(adminAuth);

// ===============================================
// GET /api/admin/users - Obtener todos los usuarios
// ===============================================
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      role, 
      status,
      sortBy = 'created_at', 
      sortOrder = 'DESC' 
    } = req.query;

    // Construir condiciones de búsqueda
    const where = {};

    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { full_name: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (role && role !== 'all') {
      where.role = role;
    }

    if (status && status !== 'all') {
      where.is_active = status === 'active';
    }

    // Validar campos de ordenamiento
    const allowedSortFields = ['username', 'email', 'full_name', 'role', 'is_active', 'created_at', 'last_login'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Configurar paginación
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Obtener usuarios con permisos
    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: [
        'id', 'username', 'email', 'full_name', 'role', 
        'is_active', 'last_login', 'created_at', 'updated_at'
      ],
      order: [[sortField, sortDirection]],
      limit: limitNum,
      offset: offset
    });

    // Para cada usuario, obtener sus permisos
    const usersWithPermissions = await Promise.all(
      users.map(async (user) => {
        const userObj = user.toJSON();
        
        if (user.role === 'admin') {
          // Los administradores tienen todos los permisos
          userObj.permissions = ['ALL'];
          userObj.permissions_count = 'ALL';
        } else {
          // Obtener permisos específicos del usuario
          const permissions = await user.sequelize.query(
            `SELECT permission FROM user_permissions 
             WHERE user_id = :userId AND is_active = true 
             AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
            {
              replacements: { userId: user.id },
              type: user.sequelize.QueryTypes.SELECT
            }
          );
          
          userObj.permissions = permissions.map(p => p.permission);
          userObj.permissions_count = permissions.length;
        }
        
        return userObj;
      })
    );

    res.json({
      success: true,
      data: usersWithPermissions,
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
        role: role || null,
        status: status || null,
        sortBy: sortField,
        sortOrder: sortDirection
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// ===============================================
// GET /api/admin/users/:id - Obtener usuario específico
// ===============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido',
        error: 'INVALID_USER_ID'
      });
    }

    const user = await User.findByPk(id, {
      attributes: [
        'id', 'username', 'email', 'full_name', 'role', 
        'is_active', 'last_login', 'created_at', 'updated_at'
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    const userObj = user.toJSON();

    // Obtener permisos del usuario
    if (user.role === 'admin') {
      userObj.permissions = ['ALL'];
    } else {
      const permissions = await user.sequelize.query(
        `SELECT permission, granted_at, expires_at 
         FROM user_permissions 
         WHERE user_id = :userId AND is_active = true 
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
        {
          replacements: { userId: user.id },
          type: user.sequelize.QueryTypes.SELECT
        }
      );
      
      userObj.permissions = permissions.map(p => p.permission);
      userObj.detailed_permissions = permissions;
    }

    res.json({
      success: true,
      data: userObj
    });

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// ===============================================
// POST /api/admin/users - Crear nuevo usuario
// ===============================================
router.post('/', async (req, res) => {
  try {
    const { 
      username, 
      email, 
      full_name, 
      password, 
      role = 'user', 
      is_active = true,
      permissions = []
    } = req.body;

    // Validaciones básicas
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de usuario y contraseña son requeridos',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario debe tener al menos 3 caracteres',
        error: 'INVALID_USERNAME'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres',
        error: 'INVALID_PASSWORD'
      });
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido',
        error: 'INVALID_ROLE'
      });
    }

    // Verificar que el usuario no exista
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          ...(email ? [{ email }] : [])
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario o email ya existe',
        error: 'USER_ALREADY_EXISTS'
      });
    }

    // Hashear contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const newUser = await User.create({
      username,
      email: email || null,
      full_name: full_name || null,
      password: hashedPassword,
      role,
      is_active
    });

    // Asignar permisos específicos (solo para usuarios no admin)
    if (role !== 'admin' && permissions.length > 0) {
      for (const permission of permissions) {
        await newUser.sequelize.query(
          `SELECT assign_permission(:userId, :permission, :grantedBy)`,
          {
            replacements: {
              userId: newUser.id,
              permission,
              grantedBy: req.user.id
            }
          }
        );
      }
    }

    // Obtener el usuario creado con permisos
    const createdUser = await User.findByPk(newUser.id, {
      attributes: [
        'id', 'username', 'email', 'full_name', 'role', 
        'is_active', 'created_at'
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: createdUser
    });

  } catch (error) {
    console.error('Error creando usuario:', error);
    
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
        message: 'El nombre de usuario o email ya existe',
        error: 'DUPLICATE_USER'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// ===============================================
// PUT /api/admin/users/:id - Actualizar usuario
// ===============================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      username, 
      email, 
      full_name, 
      password, 
      role, 
      is_active,
      permissions = []
    } = req.body;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido',
        error: 'INVALID_USER_ID'
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    // Validaciones de seguridad
    if (parseInt(id) === req.user.id) {
      // No permitir que el usuario se desactive a sí mismo
      if (is_active === false) {
        return res.status(400).json({
          success: false,
          message: 'No puedes desactivarte a ti mismo',
          error: 'CANNOT_DEACTIVATE_SELF'
        });
      }
      
      // No permitir que el usuario cambie su propio rol
      if (role && role !== user.role) {
        return res.status(400).json({
          success: false,
          message: 'No puedes cambiar tu propio rol',
          error: 'CANNOT_CHANGE_OWN_ROLE'
        });
      }
    }

    // Preparar datos de actualización
    const updateData = {};
    
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email || null;
    if (full_name !== undefined) updateData.full_name = full_name || null;
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Actualizar contraseña si se proporciona
    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres',
          error: 'INVALID_PASSWORD'
        });
      }
      
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    // Actualizar usuario
    await user.update(updateData);

    // Actualizar permisos (solo para usuarios no admin)
    if (role !== 'admin') {
      // Revocar todos los permisos existentes
      await user.sequelize.query(
        `UPDATE user_permissions SET is_active = false WHERE user_id = :userId`,
        {
          replacements: { userId: user.id }
        }
      );

      // Asignar nuevos permisos
      for (const permission of permissions) {
        await user.sequelize.query(
          `SELECT assign_permission(:userId, :permission, :grantedBy)`,
          {
            replacements: {
              userId: user.id,
              permission,
              grantedBy: req.user.id
            }
          }
        );
      }
    }

    // Obtener usuario actualizado
    const updatedUser = await User.findByPk(id, {
      attributes: [
        'id', 'username', 'email', 'full_name', 'role', 
        'is_active', 'last_login', 'updated_at'
      ]
    });

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    
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
        message: 'El nombre de usuario o email ya existe',
        error: 'DUPLICATE_USER'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// ===============================================
// DELETE /api/admin/users/:id - Eliminar usuario
// ===============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido',
        error: 'INVALID_USER_ID'
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    // No permitir eliminar el usuario actual
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminarte a ti mismo',
        error: 'CANNOT_DELETE_SELF'
      });
    }

    // Verificar si es el último administrador
    if (user.role === 'admin') {
      const adminCount = await User.count({
        where: { 
          role: 'admin',
          is_active: true,
          id: { [Op.ne]: id }
        }
      });

      if (adminCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'No puedes eliminar el último administrador del sistema',
          error: 'CANNOT_DELETE_LAST_ADMIN'
        });
      }
    }

    // Eliminar usuario (esto también eliminará sus permisos por CASCADE)
    await user.destroy();

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// ===============================================
// GET /api/admin/users/stats - Estadísticas de usuarios
// ===============================================
router.get('/stats/summary', async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { is_active: true } });
    const adminUsers = await User.count({ where: { role: 'admin' } });
    const regularUsers = await User.count({ where: { role: 'user' } });

    // Usuarios creados en los últimos 30 días
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.count({
      where: {
        created_at: { [Op.gte]: thirtyDaysAgo }
      }
    });

    // Usuarios que han iniciado sesión en los últimos 7 días
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeLastWeek = await User.count({
      where: {
        last_login: { [Op.gte]: sevenDaysAgo }
      }
    });

    res.json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        admins: adminUsers,
        regular: regularUsers,
        recentSignups: recentUsers,
        activeLastWeek
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;