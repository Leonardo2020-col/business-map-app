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
  role: {
    // Cambiar a STRING para que coincida con la base de datos
    type: DataTypes.STRING(20),
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
    defaultValue: DataTypes.NOW,
    field: 'created_at' // Mapear explícitamente al nombre de columna en DB
  }
}, {
  tableName: 'users',
  timestamps: false, // CAMBIO CRÍTICO: Desactivar timestamps automáticos
  // Como tu tabla no tiene updated_at, es mejor manejar created_at manualmente
  indexes: [
    {
      unique: true,
      fields: ['username'],
      name: 'idx_users_username' // Nombre explícito para el índice
    }
  ],
  // Configuración adicional para debugging
  logging: console.log, // Ver las queries SQL en consola
  
  // Hooks para debugging
  hooks: {
    beforeFind: (options) => {
      console.log('🔍 User.beforeFind:', options.where);
    },
    afterFind: (result, options) => {
      if (result) {
        console.log('✅ User.afterFind:', Array.isArray(result) ? `${result.length} users found` : 'User found');
      } else {
        console.log('❌ User.afterFind: No user found');
      }
    }
  }
});

// Método de instancia para verificar si es admin
User.prototype.isAdmin = function() {
  return this.role === 'admin';
};

// Método de instancia para obtener datos sin password
User.prototype.toSafeJSON = function() {
  const userData = this.toJSON();
  delete userData.password;
  return userData;
};

// Método estático para buscar por username
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

// Método estático para listar todos los usuarios (debugging)
User.listAll = async function() {
  try {
    const users = await this.findAll({
      attributes: ['id', 'username', 'role', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    
    console.log('📋 Usuarios en base de datos:');
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Username: ${user.username}, Role: ${user.role}`);
    });
    
    return users;
  } catch (error) {
    console.error('❌ Error listando usuarios:', error);
    throw error;
  }
};

module.exports = User;