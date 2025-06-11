const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// ✅ IMPORTAR CONFIGURACIÓN MEJORADA DE BASE DE DATOS
const { 
  sequelize, 
  initializeDatabase, 
  closeConnection, 
  environment 
} = require('./src/config/database');

// Importar modelos
const User = require('./src/models/User');
const Business = require('./src/models/Business');

// Importar rutas
const authRoutes = require('./src/routes/auth');
const businessRoutes = require('./src/routes/businesses');
const userRoutes = require('./src/routes/users');
const adminUserRoutes = require('./src/routes/admin/users');

// Importar middleware
const { auth } = require('./src/middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================================
// MIDDLEWARE GLOBAL
// ===============================================
app.use(cors({
  origin: environment.isProduction 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ MIDDLEWARE DE LOGGING MEJORADO
if (!environment.isProduction) {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method.padEnd(6);
    const url = req.path;
    const userAgent = req.get('User-Agent')?.substring(0, 50) || 'Unknown';
    
    console.log(`${timestamp} - ${method} ${url} - ${userAgent}`);
    next();
  });
}

// ✅ MIDDLEWARE DE SALUD DE LA APLICACIÓN
app.use((req, res, next) => {
  req.appInfo = {
    environment: environment,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
  next();
});

// ===============================================
// CONFIGURAR ASOCIACIONES DE MODELOS
// ===============================================
const setupAssociations = () => {
  try {
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

    console.log('✅ Asociaciones de modelos configuradas');
  } catch (error) {
    console.error('❌ Error configurando asociaciones:', error);
  }
};

// ===============================================
// RUTAS DE API
// ===============================================

// ✅ RUTA DE SALUD MEJORADA
app.get('/api/health', async (req, res) => {
  try {
    // Probar conexión a la base de datos
    await sequelize.authenticate();
    
    // Contar registros básicos
    const [userCount, businessCount] = await Promise.all([
      User.count().catch(() => 0),
      Business.count().catch(() => 0)
    ]);

    res.json({ 
      status: 'OK',
      timestamp: req.appInfo.timestamp,
      environment: environment.isProduction ? 'production' : 'development',
      database: {
        status: 'Connected',
        host: environment.host,
        database: environment.database
      },
      uptime: `${Math.floor(req.appInfo.uptime)}s`,
      counts: {
        users: userCount,
        businesses: businessCount
      },
      features: {
        userManagement: true,
        permissions: true,
        businessLocation: true,
        maps: true
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: req.appInfo.timestamp,
      database: {
        status: 'Disconnected',
        error: error.message
      },
      uptime: `${Math.floor(req.appInfo.uptime)}s`
    });
  }
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de negocios (protegidas)
app.use('/api/businesses', auth, businessRoutes);

// Rutas de usuarios (protegidas)
app.use('/api/users', auth, userRoutes);

// ✅ RUTAS DE ADMINISTRACIÓN (solo admins)
app.use('/api/admin/users', adminUserRoutes);

// ===============================================
// SERVIR ARCHIVOS ESTÁTICOS EN PRODUCCIÓN
// ===============================================
if (environment.isProduction) {
  // Servir archivos estáticos del frontend
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  // Manejar rutas del frontend (SPA)
  app.get('*', (req, res) => {
    // Excluir rutas de API
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
        error: 'NOT_FOUND',
        path: req.path
      });
    }
    
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
} else {
  // ✅ PÁGINA DE BIENVENIDA MEJORADA PARA DESARROLLO
  app.get('/', (req, res) => {
    res.json({
      message: '🚀 Business Map API Server',
      version: '2.0.0',
      status: 'Development Mode',
      timestamp: req.appInfo.timestamp,
      uptime: `${Math.floor(req.appInfo.uptime)}s`,
      links: {
        frontend: 'http://localhost:5173',
        health: `http://localhost:${PORT}/api/health`,
        docs: 'https://github.com/tu-usuario/business-map'
      },
      available_endpoints: {
        auth: {
          login: 'POST /api/auth/login',
          register: 'POST /api/auth/register',
          me: 'GET /api/auth/me'
        },
        businesses: {
          list: 'GET /api/businesses',
          create: 'POST /api/businesses',
          update: 'PUT /api/businesses/:id',
          delete: 'DELETE /api/businesses/:id'
        },
        admin: {
          users: 'GET /api/admin/users',
          createUser: 'POST /api/admin/users',
          updateUser: 'PUT /api/admin/users/:id',
          deleteUser: 'DELETE /api/admin/users/:id'
        }
      },
      features: {
        userManagement: '✅ Gestión completa de usuarios',
        permissions: '✅ Sistema de permisos granulares',
        businessLocation: '✅ Campos de ubicación expandidos',
        maps: '✅ Mapas interactivos con Google Maps'
      }
    });
  });
}

// ===============================================
// MIDDLEWARE DE MANEJO DE ERRORES MEJORADO
// ===============================================
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const errorId = Math.random().toString(36).substr(2, 9);
  
  console.error(`❌ [${errorId}] ${timestamp} - Error del servidor:`, err);
  
  // Error de validación de Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      error: 'VALIDATION_ERROR',
      errorId,
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      }))
    });
  }
  
  // Error de restricción única
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Recurso ya existe',
      error: 'DUPLICATE_RESOURCE',
      errorId,
      field: err.errors[0]?.path
    });
  }
  
  // Error de conexión a la base de datos
  if (err.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      success: false,
      message: 'Error de conexión a la base de datos',
      error: 'DATABASE_CONNECTION_ERROR',
      errorId
    });
  }
  
  // Error de autenticación
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido',
      error: 'INVALID_TOKEN',
      errorId
    });
  }
  
  // Error genérico
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: 'INTERNAL_ERROR',
    errorId,
    timestamp,
    ...(environment.isProduction ? {} : { 
      stack: err.stack,
      details: err.message 
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
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// INICIALIZACIÓN DEL SERVIDOR
// ===============================================
const startServer = async () => {
  try {
    console.log('🚀 Iniciando Business Map Server v2.0.0...');
    console.log(`🌍 Entorno: ${environment.isProduction ? 'Producción' : 'Desarrollo'}`);
    console.log(`🏠 Base de datos: ${environment.database} en ${environment.host}`);
    
    // ✅ USAR FUNCIÓN MEJORADA DE INICIALIZACIÓN
    const dbReady = await initializeDatabase();
    if (!dbReady && environment.isProduction) {
      console.error('❌ No se pudo inicializar la base de datos en producción');
      process.exit(1);
    }
    
    // Configurar asociaciones
    setupAssociations();
    
    // Sincronizar modelos (solo en desarrollo)
    if (!environment.isProduction) {
      try {
        await sequelize.sync({ alter: false });
        console.log('✅ Modelos sincronizados con la base de datos');
      } catch (syncError) {
        console.warn('⚠️ No se pudieron sincronizar todos los modelos:', syncError.message);
      }
    }
    
    // ✅ VERIFICACIONES ADICIONALES
    try {
      const userCount = await User.count();
      const businessCount = await Business.count();
      
      console.log(`📊 Estado de la base de datos:`);
      console.log(`   👥 Usuarios: ${userCount}`);
      console.log(`   🏢 Negocios: ${businessCount}`);
      
      if (userCount === 0 && !environment.isProduction) {
        console.log('⚠️ No hay usuarios en la base de datos');
        console.log('💡 Ejecuta el script SQL de inicialización para crear usuarios por defecto');
      }
    } catch (countError) {
      console.warn('⚠️ No se pudieron contar registros:', countError.message);
    }
    
    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log(`🌟 Servidor corriendo en puerto ${PORT}`);
      
      if (!environment.isProduction) {
        console.log(`📱 Frontend: http://localhost:5173`);
        console.log(`🔧 API: http://localhost:${PORT}/api`);
        console.log(`💊 Health Check: http://localhost:${PORT}/api/health`);
        console.log(`👥 Admin Panel: http://localhost:5173/admin`);
      }
      
      console.log('==========================================');
      console.log('✅ Business Map Server v2.0.0 listo');
      console.log('🎉 Gestión de usuarios habilitada');
      console.log('==========================================');
    });

    // ✅ CONFIGURAR CIERRE GRACEFUL DEL SERVIDOR
    const gracefulShutdown = async (signal) => {
      console.log(`\n📴 Recibida señal ${signal}, iniciando cierre graceful...`);
      
      server.close(async () => {
        console.log('🚪 Servidor HTTP cerrado');
        await closeConnection();
        console.log('👋 Proceso terminado correctamente');
        process.exit(0);
      });
      
      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error('⏰ Forzando cierre después de 10 segundos');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('💡 Verifica:');
      console.error('   - Que PostgreSQL esté corriendo');
      console.error('   - Las credenciales en .env');
      console.error('   - Que la base de datos exista');
      console.error('   - Los permisos de usuario');
    }
    
    await closeConnection();
    process.exit(1);
  }
};

// Iniciar servidor
startServer();

module.exports = app;