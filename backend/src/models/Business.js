const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Business = sequelize.define('Business', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: {
        args: [2, 100],
        msg: 'El nombre del negocio debe tener entre 2 y 100 caracteres'
      },
      notEmpty: {
        msg: 'El nombre del negocio no puede estar vacío'
      }
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: {
        args: [5, 500],
        msg: 'La dirección debe tener entre 5 y 500 caracteres'
      },
      notEmpty: {
        msg: 'La dirección no puede estar vacía'
      }
    }
  },
  business_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: {
        args: [2, 100],
        msg: 'El tipo de negocio debe tener entre 2 y 100 caracteres'
      },
      notEmpty: {
        msg: 'El tipo de negocio no puede estar vacío'
      }
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: {
        args: [0, 20],
        msg: 'El teléfono no puede tener más de 20 caracteres'
      }
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: {
        msg: 'Debe ser un email válido'
      },
      len: {
        args: [0, 100],
        msg: 'El email no puede tener más de 100 caracteres'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 1000],
        msg: 'La descripción no puede tener más de 1000 caracteres'
      }
    }
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    validate: {
      min: {
        args: [-90],
        msg: 'La latitud debe estar entre -90 y 90'
      },
      max: {
        args: [90],
        msg: 'La latitud debe estar entre -90 y 90'
      }
    }
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    validate: {
      min: {
        args: [-180],
        msg: 'La longitud debe estar entre -180 y 180'
      },
      max: {
        args: [180],
        msg: 'La longitud debe estar entre -180 y 180'
      }
    }
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'businesses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['created_by']
    },
    {
      fields: ['business_type']
    },
    {
      fields: ['created_at']
    }
  ],
  hooks: {
    beforeUpdate: (business) => {
      business.updated_at = new Date();
    }
  }
});

module.exports = Business;