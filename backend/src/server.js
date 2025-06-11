const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================================
// DETECTAR ENTORNO PRIMERO
// ===============================================
const isRailway = !!(process.env.DATABASE_URL || process.env.RAILWAY_STATIC_URL);
const isProduction = process.env.NODE_ENV === 'production';

console.log('🚀 Iniciando Business Map Server v2.0.0...');
console.log(`🌍 Entorno: ${isProduction ? 'Producción' : 'Desarrollo'}`);
console.log(`🚂 Plataforma: ${isRailway ? 'Railway' : 'Local'}`);

// ===============================================
// MIDDLEWARE GLOBAL (ANTES DE IMPORTAR RUTAS)
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

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  if (!isProduction) {
    console.log(`${timestamp} - ${req.method} ${req.path}`);
  }
  
  res.set({
    'X-Powered-By': 'Business Map v2.0.0',
    'X-Timestamp': timestamp
  });
  
  next();
});

// ===============================================
// IMPORTACIONES SEGURAS
// ===============================================
let sequelize, User, Business;

try {
  console.log('📡 Importando configuración de base de datos...');
  sequelize = require('./config/database');
  console.log('✅ Base de datos importada');
} catch (error) {
  console.error('❌ Error importando database:', error.message);
  sequelize = null;
}

try {
  console.log('📊 Importando modelos...');
  User = require('./models/User');
  Business = require('./models/Business');
  console.log('✅ Modelos importados');
} catch (error) {
  console.error('❌ Error importando modelos:', error.message);
  User = null;
  Business = null;
}

// ===============================================
// RUTAS BÁSICAS SEGURAS (SIN DEPENDENCIAS)
// ===============================================

// Ruta de salud - SIEMPRE disponible
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

  // Verificar base de datos si está disponible
  if (sequelize) {
    try {
      await sequelize.authenticate();
      healthData.database = {
        status: 'Connected',
        host: isRailway ? 'Railway PostgreSQL' : (process.env.DB_HOST || 'localhost')
      };

      // Contar registros si los modelos están disponibles
      if (User && Business) {
        try {
          const [userCount, businessCount] = await Promise.all([
            User.count(),
            Business.count()
          ]);
          healthData.counts = { users: userCount, businesses: businessCount };
        } catch (countError) {
          healthData.counts = { error: 'No se pudieron contar registros' };
        }
      }
    } catch (dbError) {
      healthData.database = { status: 'Disconnected', error: dbError.message };
      healthData.status = 'WARNING';
    }
  } else {
    healthData.database = { status: 'Not configured' };
    healthData.status = 'WARNING';
  }

  healthData.features = {
    database: !!sequelize,
    models: !!(User && Business),
    routes: 'Loaded'
  };

  res.status(healthData.status === 'OK' ? 200 : 503).json(healthData);
});

// Información de la API
app.get('/api', (req, res) => {
  res.json({
    name: '🚀 Business Map API',
    version: '2.0.0',
    description: 'API para gestión de negocios con sistema de usuarios',
    timestamp: new Date().toISOString(),
    status: 'Running',
    endpoints: {
      health: 'GET /api/health',
      info: 'GET /api',
      auth: 'POST /api/auth/login',
      businesses: 'GET /api/businesses',
      admin: 'GET /api/admin/users'
    }
  });
});

// ===============================================
// REGISTRAR RUTAS EN ORDEN CORRECTO
// ===============================================

// Función para registrar rutas de manera segura
const safeRouteRegistration = (path, routeFile, description) => {
  try {
    console.log(`🛣️ Cargando rutas ${description}...`);
    const routes = require(routeFile);
    app.use(path, routes);
    console.log(`✅ Rutas ${description} registradas en ${path}`);
    return true;
  } catch (error) {
    console.error(`❌ Error cargando rutas ${description}:`, error.message);
    return false;
  }
};

// ORDEN CORRECTO: Rutas específicas primero, luego las generales
console.log('🛣️ Registrando rutas...');

// 1. Rutas de autenticación (sin middleware adicional)
safeRouteRegistration('/api/auth', './routes/auth', 'de autenticación');

// 2. Rutas de usuarios (nivel básico)
safeRouteRegistration('/api/users', './routes/users', 'de usuarios');

// 3. Rutas de negocios (con middleware interno)
safeRouteRegistration('/api/businesses', './routes/businesses', 'de negocios');

// 4. Rutas de administración (MÁS ESPECÍFICAS PRIMERO)
safeRouteRegistration('/api/admin/users', './routes/admin/users', 'de administración de usuarios');

// ===============================================
// CONFIGURAR ASOCIACIONES DE MODELOS
// ===============================================
const setupAssociations = () => {
  if (!User || !Business) {
    console.warn('⚠️ No se pueden configurar asociaciones - modelos no disponibles');
    return false;
  }

  try {
    Business.belongsTo(User, { 
      foreignKey: 'created_by', 
      as: 'creator' 
    });
    
    User.hasMany(Business, { 
      foreignKey: 'created_by', 
      as: 'businesses' 
    });

    console.log('✅ Asociaciones de modelos configuradas');
    return true;
  } catch (error) {
    console.error('❌ Error configurando asociaciones:', error.message);
    return false;
  }
};

// ===============================================
// SERVIR ARCHIVOS ESTÁTICOS EN PRODUCCIÓN
// ===============================================
if (isProduction) {
  console.log('📁 Configurando archivos estáticos...');
  
  const staticPath = path.join(__dirname, '../frontend/dist');
  const fs = require('fs');
  
  if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));
    console.log('✅ Archivos estáticos configurados');
    
    // SPA fallback - DEBE IR AL FINAL
    app.get('*', (req, res) => {
      // No interferir con rutas de API
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({
          success: false,
          message: 'Endpoint de API no encontrado',
          error: 'NOT_FOUND',
          path: req.path
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
    console.warn('⚠️ Directorio de archivos estáticos no encontrado');
  }
} else {
  // Página de inicio para desarrollo
  app.get('/', (req, res) => {
    res.json({
      message: '🚀 Business Map API Server',
      version: '2.0.0',
      status: 'Development Mode',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      environment: {
        node: process.version,
        platform: process.platform
      },
      links: {
        frontend: 'http://localhost:5173',
        api: `http://localhost:${PORT}/api`,
        health: `http://localhost:${PORT}/api/health`
      },
      credentials: {
        admin: 'admin / admin123',
        user: 'user / user123'
      }
    });
  });
}

// ===============================================
// MANEJO DE ERRORES (AL FINAL)
// ===============================================
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const errorId = Math.random().toString(36).substr(2, 9);
  
  console.error(`❌ [${errorId}] ${timestamp} - Error:`, {
    message: err.message,
    stack: isProduction ? 'Hidden' : err.stack,
    url: req.url,
    method: req.method
  });

  const errorResponse = {
    success: false,
    errorId,
    timestamp,
    path: req.path,
    method: req.method
  };

  // Errores específicos
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      ...errorResponse,
      message: 'Error de validación',
      error: 'VALIDATION_ERROR'
    });
  }

  if (err.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      ...errorResponse,
      message: 'Error de conexión a la base de datos',
      error: 'DATABASE_CONNECTION_ERROR'
    });
  }

  // Error genérico
  res.status(500).json({
    ...errorResponse,
    message: 'Error interno del servidor',
    error: 'INTERNAL_ERROR'
  });
});

// Rutas no encontradas (MUY AL FINAL)
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
// INICIALIZACIÓN ASYNC
// ===============================================
const initializeServer = async () => {
  try {
    console.log('🔧 Inicializando componentes...');
    
    // Probar conexión a BD si está disponible
    if (sequelize) {
      try {
        await sequelize.authenticate();
        console.log('✅ Conexión a base de datos verificada');
        
        // Configurar asociaciones
        setupAssociations();
        
        // Solo en desarrollo: sincronizar y verificar datos
        if (!isProduction) {
          try {
            await sequelize.sync({ alter: false });
            console.log('✅ Modelos sincronizados');
            
            if (User) {
              const userCount = await User.count();
              console.log(`📊 ${userCount} usuarios en la base de datos`);
            }
          } catch (syncError) {
            console.warn('⚠️ Advertencia en sincronización:', syncError.message);
          }
        }
      } catch (dbError) {
        console.error('❌ Error de conexión a BD:', dbError.message);
        if (isProduction) {
          console.warn('⚠️ Continuando sin BD en producción...');
        }
      }
    }
    
    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log(`🌟 Servidor iniciado en puerto ${PORT}`);
      
      if (!isProduction) {
        console.log('🔗 URLs de desarrollo:');
        console.log(`   📱 Frontend: http://localhost:5173`);
        console.log(`   🔧 API: http://localhost:${PORT}/api`);
        console.log(`   💊 Health: http://localhost:${PORT}/api/health`);
      }
      
      console.log('==========================================');
      console.log('✅ Business Map Server v2.0.0 LISTO');
      console.log('==========================================');
    });

    // Cierre graceful
    const gracefulShutdown = async (signal) => {
      console.log(`\n📴 ${signal} recibido, cerrando servidor...`);
      
      server.close(async () => {
        console.log('🚪 Servidor HTTP cerrado');
        
        if (sequelize) {
          try {
            await sequelize.close();
            console.log('📡 Conexión BD cerrada');
          } catch (closeError) {
            console.error('❌ Error cerrando BD:', closeError.message);
          }
        }
        
        console.log('👋 Proceso terminado');
        process.exit(0);
      });
      
      setTimeout(() => {
        console.error('⏰ Timeout - forzando cierre');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Error crítico en inicialización:', error);
    process.exit(1);
  }
};

// Iniciar servidor
initializeServer();

module.exports = app;