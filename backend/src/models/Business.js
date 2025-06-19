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
  // ✅ CAMPOS DE UBICACIÓN - Organizados juntos
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

  // ✅ NUEVOS CAMPOS - SERVICIOS Y FECHAS DE VENCIMIENTO
  defensa_civil_expiry: {
    type: DataTypes.DATEONLY, // Solo fecha, sin hora
    allowNull: true,
    validate: {
      isDate: {
        msg: 'La fecha de vencimiento de Defensa Civil debe ser una fecha válida'
      },
      isAfter: {
        args: '1900-01-01',
        msg: 'La fecha de vencimiento de Defensa Civil debe ser posterior a 1900'
      }
    },
    comment: 'Fecha de vencimiento del certificado de Defensa Civil'
  },
  extintores_expiry: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: {
        msg: 'La fecha de vencimiento de Extintores debe ser una fecha válida'
      },
      isAfter: {
        args: '1900-01-01',
        msg: 'La fecha de vencimiento de Extintores debe ser posterior a 1900'
      }
    },
    comment: 'Fecha de vencimiento del mantenimiento de extintores'
  },
  fumigacion_expiry: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: {
        msg: 'La fecha de vencimiento de Fumigación debe ser una fecha válida'
      },
      isAfter: {
        args: '1900-01-01',
        msg: 'La fecha de vencimiento de Fumigación debe ser posterior a 1900'
      }
    },
    comment: 'Fecha de vencimiento del certificado de fumigación'
  },
  pozo_tierra_expiry: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: {
        msg: 'La fecha de vencimiento de Pozo a Tierra debe ser una fecha válida'
      },
      isAfter: {
        args: '1900-01-01',
        msg: 'La fecha de vencimiento de Pozo a Tierra debe ser posterior a 1900'
      }
    },
    comment: 'Fecha de vencimiento del certificado de pozo a tierra'
  },
  publicidad_expiry: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: {
        msg: 'La fecha de vencimiento de Publicidad debe ser una fecha válida'
      },
      isAfter: {
        args: '1900-01-01',
        msg: 'La fecha de vencimiento de Publicidad debe ser posterior a 1900'
      }
    },
    comment: 'Fecha de vencimiento del permiso de publicidad'
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
    // Índices para campos de ubicación
    {
      fields: ['distrito']
    },
    {
      fields: ['sector']
    },
    // ✅ NUEVOS ÍNDICES PARA SERVICIOS - Para búsquedas eficientes de vencimientos
    {
      fields: ['defensa_civil_expiry'],
      name: 'idx_businesses_defensa_civil_expiry'
    },
    {
      fields: ['extintores_expiry'],
      name: 'idx_businesses_extintores_expiry'
    },
    {
      fields: ['fumigacion_expiry'],
      name: 'idx_businesses_fumigacion_expiry'
    },
    {
      fields: ['pozo_tierra_expiry'],
      name: 'idx_businesses_pozo_tierra_expiry'
    },
    {
      fields: ['publicidad_expiry'],
      name: 'idx_businesses_publicidad_expiry'
    }
  ],
  hooks: {
    beforeUpdate: (business) => {
      business.updated_at = new Date();
    },
    
    beforeValidate: (business, options) => {
      // Limpiar espacios en blanco de campos de texto
      if (business.name) business.name = business.name.trim();
      if (business.address) business.address = business.address.trim();
      if (business.business_type) business.business_type = business.business_type.trim();
      if (business.phone) business.phone = business.phone.trim();
      if (business.email) business.email = business.email.trim();
      if (business.description) business.description = business.description.trim();
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

      // ✅ LIMPIAR FECHAS DE SERVICIOS - Convertir strings vacíos a null
      const serviceFields = ['defensa_civil_expiry', 'extintores_expiry', 'fumigacion_expiry', 'pozo_tierra_expiry', 'publicidad_expiry'];
      serviceFields.forEach(field => {
        if (business[field] === '') business[field] = null;
      });
    }
  }
});

// ✅ MÉTODOS HELPER EXISTENTES
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

// ✅ NUEVOS MÉTODOS HELPER PARA SERVICIOS
Business.prototype.getServicesStatus = function() {
  const { Op } = require('sequelize');
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
  
  const services = [
    { name: 'Defensa Civil', field: 'defensa_civil_expiry', icon: '🚨' },
    { name: 'Extintores', field: 'extintores_expiry', icon: '🧯' },
    { name: 'Fumigación', field: 'fumigacion_expiry', icon: '🦟' },
    { name: 'Pozo a Tierra', field: 'pozo_tierra_expiry', icon: '⚡' },
    { name: 'Publicidad', field: 'publicidad_expiry', icon: '📢' }
  ];
  
  return services.map(service => {
    const expiryDate = this[service.field];
    let status = 'no-date';
    
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      if (expiry < today) {
        status = 'expired';
      } else if (expiry <= thirtyDaysFromNow) {
        status = 'expiring-soon';
      } else {
        status = 'valid';
      }
    }
    
    return {
      name: service.name,
      field: service.field,
      icon: service.icon,
      expiryDate: expiryDate,
      status: status
    };
  });
};

Business.prototype.hasServiceIssues = function() {
  const servicesStatus = this.getServicesStatus();
  return servicesStatus.some(service => 
    service.status === 'expired' || service.status === 'expiring-soon'
  );
};

Business.prototype.getExpiredServices = function() {
  const servicesStatus = this.getServicesStatus();
  return servicesStatus.filter(service => service.status === 'expired');
};

Business.prototype.getExpiringSoonServices = function() {
  const servicesStatus = this.getServicesStatus();
  return servicesStatus.filter(service => service.status === 'expiring-soon');
};

// ✅ MÉTODOS ESTÁTICOS EXISTENTES
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

// ✅ NUEVOS MÉTODOS ESTÁTICOS PARA SERVICIOS
Business.getWithServiceIssues = async function() {
  const { Op } = require('sequelize');
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
  
  return await this.findAll({
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
    },
    order: [['name', 'ASC']]
  });
};

Business.getExpiredServices = async function() {
  const { Op } = require('sequelize');
  const today = new Date();
  
  return await this.findAll({
    where: {
      [Op.or]: [
        { defensa_civil_expiry: { [Op.lt]: today } },
        { extintores_expiry: { [Op.lt]: today } },
        { fumigacion_expiry: { [Op.lt]: today } },
        { pozo_tierra_expiry: { [Op.lt]: today } },
        { publicidad_expiry: { [Op.lt]: today } }
      ]
    },
    order: [['name', 'ASC']]
  });
};

Business.getServicesExpiringSoon = async function(days = 30) {
  const { Op } = require('sequelize');
  const today = new Date();
  const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return await this.findAll({
    where: {
      [Op.or]: [
        { defensa_civil_expiry: { [Op.between]: [today, futureDate] } },
        { extintores_expiry: { [Op.between]: [today, futureDate] } },
        { fumigacion_expiry: { [Op.between]: [today, futureDate] } },
        { pozo_tierra_expiry: { [Op.between]: [today, futureDate] } },
        { publicidad_expiry: { [Op.between]: [today, futureDate] } }
      ]
    },
    order: [['name', 'ASC']]
  });
};

module.exports = Business;