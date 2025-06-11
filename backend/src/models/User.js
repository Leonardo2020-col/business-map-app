const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: {
      name: 'unique_username',
      msg: 'El nombre de usuario ya existe'
    },
    validate: {
      len: {
        args: [3, 50],
        msg: 'El nombre de usuario debe tener entre 3 y 50 caracteres'
      },
      notEmpty: {
        msg: 'El nombre de usuario no puede estar vacío'
      }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: {
        args: [6, 255],
        msg: 'La contraseña debe tener al menos 6 caracteres'
      },
      notEmpty: {
        msg: 'La contraseña no puede estar vacía'
      }
    }
  },
  // ✅ NUEVOS CAMPOS PARA GESTIÓN DE USUARIOS
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Debe ser un email válido'
      }
    }
  },
  full_name: {
    type: DataTypes.STRING(200),
    allowNull: true,
    validate: {
      len: {
        args: [0, 200],
        msg: 'El nombre completo no puede exceder 200 caracteres'
      }
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'user',
    validate: {
      isIn: {
        args: [['admin', 'user']],
        msg: 'El rol debe ser admin o user'
      }
    }
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['username'],
      name: 'idx_users_username'
    },
    {
      unique: true,
      fields: ['email'],
      name: 'idx_users_email',
      where: {
        email: {
          [DataTypes.Op.ne]: null
        }
      }
    },
    {
      fields: ['role'],
      name: 'idx_users_role'
    },
    {
      fields: ['is_active'],
      name: 'idx_users_active'
    }
  ],
  // ✅ HOOKS PARA GESTIÓN AUTOMÁTICA
  hooks: {
    beforeCreate: (user) => {
      // Limpiar datos antes de crear
      if (user.username) user.username = user.username.toLowerCase().trim();
      if (user.email) user.email = user.email.toLowerCase().trim();
      if (user.full_name) user.full_name = user.full_name.trim();
      
      // Convertir email vacío a null
      if (user.email === '') user.email = null;
      if (user.full_name === '') user.full_name = null;
    },
    beforeUpdate: (user) => {
      // Limpiar datos antes de actualizar
      if (user.username) user.username = user.username.toLowerCase().trim();
      if (user.email) user.email = user.email.toLowerCase().trim();
      if (user.full_name) user.full_name = user.full_name.trim();
      
      // Convertir email vacío a null
      if (user.email === '') user.email = null;
      if (user.full_name === '') user.full_name = null;
      
      // Actualizar timestamp
      user.updated_at = new Date();
    },
    beforeFind: (options) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 User.beforeFind:', options.where);
      }
    },
    afterFind: (result, options) => {
      if (process.env.NODE_ENV !== 'production') {
        if (result) {
          console.log('✅ User.afterFind:', Array.isArray(result) ? `${result.length} users found` : 'User found');
        } else {
          console.log('❌ User.afterFind: No user found');
        }
      }
    }
  }
});

// ===============================================
// MÉTODOS DE INSTANCIA
// ===============================================

/**
 * Verificar si el usuario es administrador
 */
User.prototype.isAdmin = function() {
  return this.role === 'admin';
};

/**
 * Obtener datos del usuario sin contraseña
 */
User.prototype.toSafeJSON = function() {
  const userData = this.toJSON();
  delete userData.password;
  return userData;
};

/**
 * Verificar si el usuario está activo
 */
User.prototype.isActiveUser = function() {
  return this.is_active === true;
};

/**
 * Obtener nombre para mostrar (full_name o username)
 */
User.prototype.getDisplayName = function() {
  return this.full_name || this.username;
};

/**
 * Actualizar último login
 */
User.prototype.updateLastLogin = async function() {
  this.last_login = new Date();
  await this.save({ fields: ['last_login'] });
};

// ===============================================
// MÉTODOS ESTÁTICOS
// ===============================================

/**
 * Buscar usuario por username
 */
User.findByUsername = async function(username) {
  console.log(`🔍 Buscando usuario: ${username}`);
  try {
    const user = await this.findOne({ 
      where: { 
        username: username.toLowerCase().trim() 
      }
    });
    
    if (user) {
      console.log(`✅ Usuario encontrado: ${user.username} (${user.role})`);
    } else {
      console.log(`❌ Usuario no encontrado: ${username}`);
    }
    
    return user;
  } catch (error) {
    console.error(`❌ Error buscando usuario ${username}:`, error);
    throw error;
  }
};

/**
 * Buscar usuario por email
 */
User.findByEmail = async function(email) {
  if (!email) return null;
  
  try {
    const user = await this.findOne({ 
      where: { 
        email: email.toLowerCase().trim() 
      }
    });
    
    return user;
  } catch (error) {
    console.error(`❌ Error buscando usuario por email ${email}:`, error);
    throw error;
  }
};

/**
 * Listar todos los usuarios (para debugging)
 */
User.listAll = async function() {
  try {
    const users = await this.findAll({
      attributes: ['id', 'username', 'email', 'full_name', 'role', 'is_active', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    
    console.log('📋 Usuarios en base de datos:');
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Active: ${user.is_active}`);
    });
    
    return users;
  } catch (error) {
    console.error('❌ Error listando usuarios:', error);
    throw error;
  }
};

/**
 * Contar usuarios por rol
 */
User.countByRole = async function() {
  try {
    const [adminCount, userCount] = await Promise.all([
      this.count({ where: { role: 'admin', is_active: true } }),
      this.count({ where: { role: 'user', is_active: true } })
    ]);
    
    return {
      admin: adminCount,
      user: userCount,
      total: adminCount + userCount
    };
  } catch (error) {
    console.error('❌ Error contando usuarios por rol:', error);
    throw error;
  }
};

/**
 * Buscar usuarios con paginación y filtros
 */
User.findWithFilters = async function(options = {}) {
  const {
    page = 1,
    limit = 10,
    search = '',
    role = null,
    isActive = null,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = options;

  const where = {};
  
  // Filtro de búsqueda
  if (search) {
    where[sequelize.Sequelize.Op.or] = [
      { username: { [sequelize.Sequelize.Op.iLike]: `%${search}%` } },
      { full_name: { [sequelize.Sequelize.Op.iLike]: `%${search}%` } },
      { email: { [sequelize.Sequelize.Op.iLike]: `%${search}%` } }
    ];
  }
  
  // Filtro de rol
  if (role) {
    where.role = role;
  }
  
  // Filtro de estado activo
  if (isActive !== null) {
    where.is_active = isActive;
  }

  try {
    const { count, rows } = await this.findAndCountAll({
      where,
      attributes: ['id', 'username', 'email', 'full_name', 'role', 'is_active', 'last_login', 'created_at', 'updated_at'],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    return {
      users: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    console.error('❌ Error en búsqueda con filtros:', error);
    throw error;
  }
};

/**
 * Verificar si existe otro usuario con el mismo username o email
 */
User.checkUnique = async function(username, email, excludeId = null) {
  const where = {
    [sequelize.Sequelize.Op.or]: [
      { username: username.toLowerCase().trim() }
    ]
  };
  
  if (email && email.trim()) {
    where[sequelize.Sequelize.Op.or].push({ email: email.toLowerCase().trim() });
  }
  
  if (excludeId) {
    where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
  }
  
  const existingUser = await this.findOne({ where });
  
  if (existingUser) {
    if (existingUser.username === username.toLowerCase().trim()) {
      throw new Error('El nombre de usuario ya existe');
    }
    if (existingUser.email === email?.toLowerCase().trim()) {
      throw new Error('El email ya está registrado');
    }
  }
  
  return true;
};

module.exports = User;