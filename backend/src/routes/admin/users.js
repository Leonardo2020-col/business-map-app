const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

const router = express.Router();

// ✅ IMPORTACIONES SEGURAS
let User, auth, adminAuth;

try {
  User = require('../../models/User');
  console.log('✅ Modelo User importado en admin/users routes');
} catch (error) {
  console.error('❌ Error importando User en admin/users routes:', error.message);
  User = null;
}

try {
  const authMiddleware = require('../../middleware/auth');
  auth = authMiddleware.auth;
  adminAuth = authMiddleware.adminAuth;
  console.log('✅ Middleware auth importado en admin/users routes');
} catch (error) {
  console.error('❌ Error importando middleware auth en admin/users routes:', error.message);
  // Middleware de fallback para desarrollo
  auth = (req, res, next) => {
    req.user = { id: 1, role: 'admin', username: 'admin' };
    next();
  };
  adminAuth = (req, res, next) => next();
}

// ✅ MIDDLEWARE DE VERIFICACIÓN DE MODELOS
const checkModels = (req, res, next) => {
  if (!User) {
    return res.status(503).json({
      success: false,
      message: 'Servicio de usuarios no disponible',
      error: 'USER_MODEL_NOT_AVAILABLE'
    });
  }
  next();
};

// ✅ ORDEN CORRECTO DE MIDDLEWARES
router.use(auth);        // Primero verificar autenticación
router.use(adminAuth);   // Luego verificar que sea admin
router.use(checkModels); // Finalmente verificar modelos

// ✅ RUTA DE PRUEBA
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Rutas de administración de usuarios funcionando correctamente',
    user: req.user ? {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    } : null,
    timestamp: new Date().toISOString(),
    modelAvailable: !!User
  });
});

// ===============================================
// RUTAS ESPECÍFICAS PRIMERO (ANTES DE /:id)
// ===============================================

// GET /api/admin/users/stats/summary - Estadísticas de usuarios
router.get('/stats/summary', async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas de usuarios...');
    
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

    console.log(`✅ Estadísticas calculadas: ${totalUsers} usuarios totales`);

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
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// ===============================================
// RUTAS CON PARÁMETROS DESPUÉS
// ===============================================

// GET /api/admin/users - Obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    console.log('👥 Obteniendo lista de usuarios...');
    
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

    // ✅ OBTENER USUARIOS CON PERMISSIONS
    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: [
        'id', 'username', 'email', 'full_name', 'role', 
        'is_active', 'permissions', 'last_login', 'created_at', 'updated_at'
      ],
      order: [[sortField, sortDirection]],
      limit: limitNum,
      offset: offset
    });

    // ✅ USAR PERMISOS REALES DE LA BD
    const usersWithPermissions = users.map(user => {
      const userObj = user.toJSON();
      
      if (user.role === 'admin') {
        userObj.permissions = ['ALL'];
        userObj.permissions_count = 'ALL';
      } else {
        userObj.permissions = user.permissions || [];
        userObj.permissions_count = (user.permissions || []).length;
      }
      
      return userObj;
    });

    console.log(`✅ ${users.length} usuarios obtenidos de ${count} totales`);

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
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR',
      details: error.message
    });
  }
});

// GET /api/admin/users/:id - Obtener usuario específico
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

    // ✅ INCLUIR PERMISSIONS EN LA CONSULTA
    const user = await User.findByPk(id, {
      attributes: [
        'id', 'username', 'email', 'full_name', 'role', 
        'is_active', 'permissions', 'last_login', 'created_at', 'updated_at'
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

    // ✅ USAR PERMISOS REALES DE LA BD
    if (user.role === 'admin') {
      userObj.permissions = ['ALL'];
    } else {
      userObj.permissions = user.permissions || [];
      userObj.detailed_permissions = (user.permissions || []).map(perm => ({
        permission: perm,
        granted_at: user.created_at
      }));
    }

    console.log(`📋 Usuario ${user.username} cargado con permisos:`, userObj.permissions);

    res.json({
      success: true,
      data: userObj
    });

  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/admin/users - Crear nuevo usuario
router.post('/', async (req, res) => {
  try {
    console.log('➕ Creando nuevo usuario...');
    
    const { 
      username, 
      email, 
      full_name, 
      password, 
      role = 'user', 
      is_active = true,
      permissions = []
    } = req.body;

    console.log('📝 Datos de creación:', { username, email, full_name, role, is_active, permissions });

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

    // ✅ CREAR USUARIO CON PERMISOS
    const newUser = await User.create({
      username,
      email: email || null,
      full_name: full_name || null,
      password: hashedPassword,
      role,
      is_active,
      permissions: permissions
    });

    // ✅ OBTENER USUARIO CREADO CON PERMISOS
    const createdUser = await User.findByPk(newUser.id, {
      attributes: [
        'id', 'username', 'email', 'full_name', 'role', 
        'is_active', 'permissions', 'created_at'
      ]
    });

    console.log(`✅ Usuario creado: ${username} (ID: ${newUser.id}) con permisos:`, permissions);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: createdUser
    });

  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    
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

// PUT /api/admin/users/:id - Actualizar usuario - ✅ COMPLETAMENTE CORREGIDO
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

    // ✅ DEBUG COMPLETO
    console.log('=== DEBUG BACKEND ===');
    console.log('ID usuario:', id);
    console.log('Body completo:', req.body);
    console.log('Permisos recibidos:', permissions);
    console.log('Tipo de permisos:', typeof permissions);

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
      if (is_active === false) {
        return res.status(400).json({
          success: false,
          message: 'No puedes desactivarte a ti mismo',
          error: 'CANNOT_DEACTIVATE_SELF'
        });
      }
      
      if (role && role !== user.role) {
        return res.status(400).json({
          success: false,
          message: 'No puedes cambiar tu propio rol',
          error: 'CANNOT_CHANGE_OWN_ROLE'
        });
      }
    }

    // ✅ PREPARAR DATOS DE ACTUALIZACIÓN CON PERMISOS
    const updateData = {};
    
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email || null;
    if (full_name !== undefined) updateData.full_name = full_name || null;
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    // ✅ AQUÍ ESTÁ LA LÍNEA CRÍTICA QUE FALTABA
    if (permissions !== undefined) {
      updateData.permissions = permissions;
      console.log('✅ Permisos incluidos en updateData:', permissions);
    }

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

    console.log('📝 UpdateData completo:', updateData);

    // ✅ ACTUALIZAR USUARIO
    await user.update(updateData);

    console.log('✅ Usuario actualizado en BD');

    // ✅ OBTENER USUARIO ACTUALIZADO CON PERMISOS
    const updatedUser = await User.findByPk(id, {
      attributes: [
        'id', 'username', 'email', 'full_name', 'role', 
        'is_active', 'permissions', 'last_login', 'updated_at'
      ]
    });

    console.log('📋 Usuario después de actualizar:', {
      id: updatedUser.id,
      username: updatedUser.username,
      permissions: updatedUser.permissions
    });

    console.log('=== FIN DEBUG ===');

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: updatedUser
    });

  } catch (error) {
    console.error('❌ Error actualizando usuario:', error);
    
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

// DELETE /api/admin/users/:id - Eliminar usuario
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

    const username = user.username;
    
    // Eliminar usuario
    await user.destroy();

    console.log(`✅ Usuario eliminado: ${username} (ID: ${id})`);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;