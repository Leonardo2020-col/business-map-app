const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// ✅ IMPORTAR SEQUELIZE Y Op PARA EVITAR PROBLEMAS
const { Op } = require('sequelize');

// Importar base de datos
const sequelize = require('./config/database');

// Importar modelos  
const User = require('./models/User');
const Business = require('./models/Business');

// Importar rutas
const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/businesses');
const userRoutes = require('./routes/users');

// ✅ IMPORTACIÓN CONDICIONAL DE RUTAS DE ADMIN
let adminUserRoutes;
try {
  adminUserRoutes = require('./routes/admin/users');
  console.log('✅ Rutas de administración cargadas');
} catch (error) {
  console.warn('⚠️ Rutas de administración no encontradas, continuando sin ellas');
  adminUserRoutes = null;
}

// Importar middleware
const { auth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================================
// FUNCIONES HELPER PARA BASE DE DATOS
// ===============================================

/**
 * Probar conexión a la base de datos
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    
    // Mensajes de error específicos
    if (error.original?.code === 'ECONNREFUSED') {
      console.error('💡 PostgreSQL no está corriendo o no es accesible');
    } else if (error.original?.code === '3D000') {
      console.error('💡 La base de datos no existe');
    } else if (error.original?.code === '28P01') {
      console.error('💡 Credenciales incorrectas');
    } else if (error.original?.code === 'ENOTFOUND') {
      console.error('💡 Host de base de datos no encontrado');
    }
    
    return false;
  }
};

/**
 * Verificar tablas esenciales
 */
const verifyTables = async () => {
  try {
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'businesses')
    `);
    
    const tableNames = tables.map(t => t.table_name);
    console.log(`✅ Tablas encontradas: ${tableNames.join(', ')}`);
    
    if (tableNames.includes('users') && tableNames.includes('businesses')) {
      return true;
    } else {
      console.warn('⚠️ Faltan tablas esenciales');
      return false;
    }
  } catch (error) {
    console.warn('⚠️ No se pudieron verificar tablas:', error.message);
    return false;
  }
};

/**
 * Verificar datos iniciales
 */
const verifyInitialData = async () => {
  try {
    const userCount = await User.count();
    if (userCount === 0) {
      console.warn('⚠️ No hay usuarios en la base de datos');
      console.warn('💡 Para crear usuarios iniciales:');
      console.warn('   1. Ejecuta el script SQL de inicialización');
      console.warn('   2. O usa la ruta POST /api/auth/register');
      return false;
    }
    console.log(`✅ ${userCount} usuarios encontrados en la base de datos`);
    return true;
  } catch (error) {
    console.warn('⚠️ No se pudieron contar usuarios:', error.message);
    return false;
  }
};

// ===============================================
// DETECTAR ENTORNO
// ===============================================
const isRailway = !!(process.env.DATABASE_URL || process.env.RAILWAY_STATIC_URL);
const isProduction = process.env.NODE_ENV === 'production';

console.log(`🌍 Entorno: ${isProduction ? 'Producción' : 'Desarrollo'}`);
console.log(`🚂 Plataforma: ${isRailway ? 'Railway' : 'Local'}`);
console.log(`📁 Directorio: ${process.cwd()}`);

// ===============================================
// MIDDLEWARE GLOBAL
// ===============================================
app.use(cors({
  origin: isProduction 
    ? (process.env.FRONTEND_URL || process.env.RAILWAY_STATIC_URL || '*') 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging mejorado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method.padEnd(6);
  const url = req.path;
  
  if (!isProduction) {
    console.log(`${timestamp} - ${method} ${url}`);
  }
  
  // Agregar headers de respuesta útiles
  res.set({
    'X-Powered-By': 'Business Map v2.0.0',
    'X-Timestamp': timestamp
  });
  
  next();
});

// ===============================================
// CONFIGURAR ASOCIACIONES DE MODELOS
// ===============================================
const setupAssociations = () => {
  try {
    // Verificar que los modelos existen
    if (!User || !Business) {
      throw new Error('Modelos User o Business no están disponibles');
    }
    
    // Relación: Business pertenece a User (creador)
    Business.belongsTo(User, { 
      foreignKey: 'created_by', 
      as: 'creator' 
    });
    
    // Relación: User tiene muchos Business
    User.hasMany(Business, { 
      foreignKey: 'created_by', 
      as: 'businesses' 
    });

    console.log('✅ Asociaciones de modelos configuradas correctamente');
  } catch (error) {
    console.error('❌ Error configurando asociaciones:', error.message);
    throw error;
  }
};

// ===============================================
// RUTAS DE API
// ===============================================

// Ruta de salud detallada
app.get('/api/health', async (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: isProduction ? 'production' : 'development',
    platform: isRailway ? 'Railway' : 'Local',
    uptime: `${Math.floor(process.uptime())}s`,
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    },
    version: '2.0.0',
    nodeVersion: process.version
  };

  try {
    // Probar conexión a BD
    await sequelize.authenticate();
    healthData.database = {
      status: 'Connected',
      host: isRailway ? 'Railway PostgreSQL' : (process.env.DB_HOST || 'localhost'),
      name: process.env.DB_NAME || 'railway'
    };

    // Contar registros si es posible
    try {
      const [userCount, businessCount] = await Promise.all([
        User.count(),
        Business.count()
      ]);
      
      healthData.counts = {
        users: userCount,
        businesses: businessCount
      };
    } catch (countError) {
      healthData.counts = { error: 'No se pudieron contar registros' };
    }

    healthData.features = {
      userManagement: !!adminUserRoutes,
      permissions: true,
      businessLocation: true,
      maps: true,
      auth: true
    };

    res.json(healthData);
  } catch (dbError) {
    healthData.status = 'WARNING';
    healthData.database = {
      status: 'Disconnected',
      error: dbError.message
    };
    
    res.status(503).json(healthData);
  }
});

// ✅ RUTA DE INFORMACIÓN DE LA API
app.get('/api', (req, res) => {
  res.json({
    name: '🚀 Business Map API',
    version: '2.0.0',
    description: 'API para gestión de negocios con sistema de usuarios y permisos granulares',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /api/health',
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        me: 'GET /api/auth/me'
      },
      businesses: {
        list: 'GET /api/businesses',
        create: 'POST /api/businesses',
        get: 'GET /api/businesses/:id',
        update: 'PUT /api/businesses/:id',
        delete: 'DELETE /api/businesses/:id'
      },
      admin: adminUserRoutes ? {
        users: 'GET /api/admin/users',
        createUser: 'POST /api/admin/users',
        getUser: 'GET /api/admin/users/:id',
        updateUser: 'PUT /api/admin/users/:id',
        deleteUser: 'DELETE /api/admin/users/:id'
      } : 'Not available'
    },
    features: {
      '✅ Gestión de usuarios': 'CRUD completo con permisos granulares',
      '✅ Gestión de negocios': 'Con campos de ubicación expandidos',
      '✅ Autenticación JWT': 'Sistema seguro de tokens',
      '✅ Roles y permisos': 'Admin vs Usuario con permisos específicos',
      '✅ Base de datos': 'PostgreSQL con Sequelize ORM'
    }
  });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de negocios (protegidas)
app.use('/api/businesses', auth, businessRoutes);

// Rutas de usuarios (protegidas)
app.use('/api/users', auth, userRoutes);

// Rutas de administración (solo si están disponibles)
if (adminUserRoutes) {
  app.use('/api/admin/users', adminUserRoutes);
} else {
  // Ruta de fallback para admin
  app.use('/api/admin/*', (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Funcionalidad de administración no disponible',
      error: 'ADMIN_NOT_IMPLEMENTED',
      suggestion: 'Verifica que el archivo /routes/admin/users.js exista'
    });
  });
}

// ===============================================
// SERVIR ARCHIVOS ESTÁTICOS EN PRODUCCIÓN
// ===============================================
if (isProduction) {
  console.log('📁 Configurando archivos estáticos para producción...');
  
  const staticPath = path.join(__dirname, '../frontend/dist');
  console.log(`📂 Ruta estática: ${staticPath}`);
  
  // Verificar que el directorio existe
  const fs = require('fs');
  if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));
    console.log('✅ Archivos estáticos configurados');
  } else {
    console.warn('⚠️ Directorio de archivos estáticos no encontrado');
  }
  
  // SPA - Manejar todas las rutas del frontend
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint de API no encontrado',
        error: 'NOT_FOUND',
        path: req.path,
        availableEndpoints: [
          '/api/health',
          '/api/auth/*',
          '/api/businesses/*',
          '/api/users/*',
          '/api/admin/*'
        ]
      });
    }
    
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({
        success: false,
        message: 'Frontend no disponible',
        error: 'FRONTEND_NOT_FOUND'
      });
    }
  });
} else {
  // Página de bienvenida para desarrollo
  app.get('/', (req, res) => {
    res.json({
      message: '🚀 Business Map API Server',
      version: '2.0.0',
      status: 'Development Mode',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      },
      links: {
        frontend: 'http://localhost:5173',
        api: `http://localhost:${PORT}/api`,
        health: `http://localhost:${PORT}/api/health`,
        adminPanel: 'http://localhost:5173/admin'
      },
      defaultCredentials: {
        admin: { username: 'admin', password: 'admin123' },
        user: { username: 'user', password: 'user123' }
      }
    });
  });
}

// ===============================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ===============================================
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const errorId = Math.random().toString(36).substr(2, 9);
  
  // Log detallado del error
  console.error(`❌ [${errorId}] ${timestamp} - Error:`, {
    message: err.message,
    stack: isProduction ? 'Hidden in production' : err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Respuesta base del error
  const errorResponse = {
    success: false,
    errorId,
    timestamp,
    path: req.path,
    method: req.method
  };

  // Errores específicos de Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      ...errorResponse,
      message: 'Error de validación de datos',
      error: 'VALIDATION_ERROR',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message,
        value: isProduction ? 'Hidden' : e.value
      }))
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      ...errorResponse,
      message: 'El recurso ya existe',
      error: 'DUPLICATE_RESOURCE',
      field: err.errors[0]?.path
    });
  }

  if (err.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      ...errorResponse,
      message: 'Error de conexión a la base de datos',
      error: 'DATABASE_CONNECTION_ERROR'
    });
  }

  // Errores de autenticación
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      ...errorResponse,
      message: 'Token de autenticación inválido',
      error: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      ...errorResponse,
      message: 'Token de autenticación expirado',
      error: 'TOKEN_EXPIRED'
    });
  }

  // Error genérico
  res.status(500).json({
    ...errorResponse,
    message: 'Error interno del servidor',
    error: 'INTERNAL_ERROR',
    ...(isProduction ? {} : { 
      details: err.message,
      stack: err.stack 
    })
  });
});

// Manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    error: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /api',
      'GET /api/health',
      'POST /api/auth/login',
      'GET /api/businesses',
      'GET /api/admin/users'
    ]
  });
});

// ===============================================
// INICIALIZACIÓN DEL SERVIDOR
// ===============================================
const startServer = async () => {
  try {
    console.log('🚀 Iniciando Business Map Server v2.0.0...');
    console.log(`📦 Node.js: ${process.version}`);
    console.log(`🖥️ Plataforma: ${process.platform} ${process.arch}`);
    
    // Probar conexión a BD
    const connectionOk = await testConnection();
    if (!connectionOk) {
      if (isProduction) {
        console.error('❌ Error crítico: No se pudo conectar a la base de datos en producción');
        process.exit(1);
      } else {
        console.warn('⚠️ Continuando sin conexión a BD (modo desarrollo)');
      }
    }
    
    // Configurar asociaciones de modelos
    if (connectionOk) {
      setupAssociations();
    }
    
    // Verificaciones en desarrollo
    if (!isProduction && connectionOk) {
      try {
        // Sincronizar modelos sin alterar estructura
        await sequelize.sync({ alter: false });
        console.log('✅ Modelos sincronizados con la base de datos');
        
        // Verificar estructura de tablas
        const tablesOk = await verifyTables();
        if (!tablesOk) {
          console.warn('⚠️ Algunas tablas pueden estar faltando');
        }
        
        // Verificar datos iniciales
        await verifyInitialData();
        
      } catch (syncError) {
        console.warn('⚠️ Advertencias durante la sincronización:', syncError.message);
      }
    }
    
    // Verificar estado en producción
    if (isProduction && connectionOk) {
      try {
        const userCount = await User.count();
        const businessCount = await Business.count();
        console.log(`📊 Estado BD: ${userCount} usuarios, ${businessCount} negocios`);
        
        if (userCount === 0) {
          console.warn('⚠️ No hay usuarios en producción - verificar migración');
        }
      } catch (countError) {
        console.warn('⚠️ No se pudieron obtener estadísticas:', countError.message);
      }
    }
    
    // Mostrar información de rutas disponibles
    console.log('🛣️ Rutas configuradas:');
    console.log('   📡 /api/health - Estado del servidor');
    console.log('   🔐 /api/auth/* - Autenticación');
    console.log('   🏢 /api/businesses/* - Gestión de negocios');
    console.log('   👤 /api/users/* - Perfil de usuario');
    console.log(`   👥 /api/admin/* - Administración ${adminUserRoutes ? '✅' : '❌'}`);
    
    // Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      console.log(`🌟 Servidor HTTP iniciado en puerto ${PORT}`);
      
      if (!isProduction) {
        console.log('🔗 URLs de desarrollo:');
        console.log(`   📱 Frontend: http://localhost:5173`);
        console.log(`   🔧 API: http://localhost:${PORT}/api`);
        console.log(`   💊 Health: http://localhost:${PORT}/api/health`);
        console.log(`   👥 Admin: http://localhost:5173/admin`);
        console.log('');
        console.log('👤 Credenciales por defecto:');
        console.log('   Admin: admin / admin123');
        console.log('   User:  user / user123');
      } else {
        const baseUrl = process.env.RAILWAY_STATIC_URL || 'railway-app-url';
        console.log(`🌐 Aplicación en producción: ${baseUrl}`);
        console.log(`💊 Health check: ${baseUrl}/api/health`);
      }
      
      console.log('==========================================');
      console.log('✅ Business Map Server v2.0.0 listo');
      console.log('🎉 Características habilitadas:');
      console.log('   🔐 Sistema de autenticación JWT');
      console.log('   👥 Gestión de usuarios y permisos');
      console.log('   🏢 Gestión de negocios con ubicación');
      console.log('   📍 Campos expandidos: distrito, sector, anexo');
      console.log('   📧 Email opcional en formularios');
      console.log('   🗺️ Integración con Google Maps');
      console.log('==========================================');
    });

    // Configurar cierre graceful del servidor
    const gracefulShutdown = async (signal) => {
      console.log(`\n📴 Señal ${signal} recibida, iniciando cierre graceful...`);
      
      // Dar tiempo para que las conexiones actuales terminen
      server.close(async () => {
        console.log('🚪 Servidor HTTP cerrado correctamente');
        
        // Cerrar conexión a la base de datos
        try {
          await sequelize.close();
          console.log('📡 Conexión a base de datos cerrada');
        } catch (closeError) {
          console.error('❌ Error cerrando conexión BD:', closeError.message);
        }
        
        console.log('👋 Proceso terminado correctamente');
        process.exit(0);
      });
      
      // Timeout de seguridad - forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error('⏰ Timeout alcanzado, forzando cierre del proceso');
        process.exit(1);
      }, 10000);
    };

    // Registrar manejadores de señales del sistema
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Manejar errores no capturados
    process.on('uncaughtException', (error) => {
      console.error('❌ Excepción no capturada:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promesa rechazada no manejada:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
    
  } catch (error) {
    console.error('❌ Error crítico iniciando el servidor:', error);
    console.error(`📍 Detalles del error:`, {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Sugerencias específicas según el tipo de error
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('💡 Posibles causas:');
      console.error('   - Archivo faltante en la estructura del proyecto');
      console.error('   - Error en las rutas de importación');
      console.error('   - Dependencia no instalada');
      console.error('');
      console.error('🔧 Verificar que existan estos archivos:');
      console.error('   - ./config/database.js');
      console.error('   - ./models/User.js');
      console.error('   - ./models/Business.js');
      console.error('   - ./routes/auth.js');
      console.error('   - ./middleware/auth.js');
    } else if (error.name === 'SequelizeConnectionError') {
      console.error('💡 Problema de base de datos:');
      console.error('   - Verificar variables de entorno');
      console.error('   - Confirmar que PostgreSQL esté corriendo');
      console.error('   - Validar credenciales de conexión');
    }
    
    process.exit(1);
  }
};

// Iniciar el servidor
startServer().catch((error) => {
  console.error('❌ Error fatal en startServer:', error);
  process.exit(1);
});

module.exports = app;