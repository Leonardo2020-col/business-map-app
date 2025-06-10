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
  // ✅ NUEVOS CAMPOS DE UBICACIÓN - Organizados juntos
  sector: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: {
        args: [0, 100],
        msg: 'El sector no puede exceder 100 caracteres'
      }
    }
  },
  anexo: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: {
        args: [0, 100],
        msg: 'El anexo no puede exceder 100 caracteres'
      }
    }
  },
  distrito: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: {
        args: [0, 100],
        msg: 'El distrito no puede exceder 100 caracteres'
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
  // ✅ EMAIL YA ESTABA OPCIONAL - Perfecto
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
    },
    // ✅ NUEVOS ÍNDICES para los campos de ubicación
    {
      fields: ['distrito']
    },
    {
      fields: ['sector']
    }
  ],
  hooks: {
    // ✅ HOOK MEJORADO - Mantener tu estilo pero agregar limpieza de datos
    beforeUpdate: (business) => {
      business.updated_at = new Date();
    },
    
    // ✅ NUEVO HOOK - Limpiar datos antes de validar
    beforeValidate: (business, options) => {
      // Limpiar espacios en blanco de campos de texto
      if (business.name) business.name = business.name.trim();
      if (business.address) business.address = business.address.trim();
      if (business.business_type) business.business_type = business.business_type.trim();
      if (business.phone) business.phone = business.phone.trim();
      if (business.email) business.email = business.email.trim();
      if (business.description) business.description = business.description.trim();
      
      // ✅ Limpiar nuevos campos
      if (business.sector) business.sector = business.sector.trim();
      if (business.anexo) business.anexo = business.anexo.trim();
      if (business.distrito) business.distrito = business.distrito.trim();
      
      // Convertir strings vacíos a null para campos opcionales
      if (business.email === '') business.email = null;
      if (business.phone === '') business.phone = null;
      if (business.description === '') business.description = null;
      if (business.sector === '') business.sector = null;
      if (business.anexo === '') business.anexo = null;
      if (business.distrito === '') business.distrito = null;
      
      // Convertir coordenadas vacías a null
      if (business.latitude === '' || business.latitude === 0) business.latitude = null;
      if (business.longitude === '' || business.longitude === 0) business.longitude = null;
    }
  }
});

// ✅ MÉTODOS HELPER - Útiles para el frontend
Business.prototype.getFullAddress = function() {
  let fullAddress = this.address;
  
  if (this.sector) fullAddress += `, Sector: ${this.sector}`;
  if (this.anexo) fullAddress += `, Anexo: ${this.anexo}`;
  if (this.distrito) fullAddress += `, Distrito: ${this.distrito}`;
  
  return fullAddress;
};

Business.prototype.hasCoordinates = function() {
  return this.latitude && this.longitude;
};

Business.prototype.getCoordinates = function() {
  if (this.hasCoordinates()) {
    return {
      lat: parseFloat(this.latitude),
      lng: parseFloat(this.longitude)
    };
  }
  return null;
};

// ✅ MÉTODOS ESTÁTICOS - Para búsquedas especiales
Business.getByDistrict = async function(distrito) {
  return await this.findAll({
    where: {
      distrito: distrito
    },
    order: [['name', 'ASC']]
  });
};

Business.getWithCoordinates = async function() {
  return await this.findAll({
    where: {
      latitude: {
        [require('sequelize').Op.not]: null
      },
      longitude: {
        [require('sequelize').Op.not]: null
      }
    }
  });
};

module.exports = Business;