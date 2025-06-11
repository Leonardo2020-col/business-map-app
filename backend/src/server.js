const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================================
// DETECTAR ENTORNO
// ===============================================
const isRailway = !!(process.env.DATABASE_URL || process.env.RAILWAY_STATIC_URL);
const isProduction = process.env.NODE_ENV === 'production';

console.log('🚀 Iniciando Business Map Server v2.1.0...');
console.log(`🌍 Entorno: ${isProduction ? 'Producción' : 'Desarrollo'}`);
console.log(`🚂 Plataforma: ${isRailway ? 'Railway' : 'Local'}`);

// ===============================================
// MIDDLEWARE BÁSICO
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

// Logging middleware
app.use((req, res, next) => {
  if (!isProduction) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

// ===============================================
// RUTAS BÁSICAS SIN DEPENDENCIAS
// ===============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: isProduction ? 'production' : 'development',
    platform: isRailway ? 'Railway' : 'Local',
    uptime: `${Math.floor(process.uptime())}s`,
    version: '2.1.0',
    nodeVersion: process.version
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: '🚀 Business Map API',
    version: '2.1.0',
    description: 'API para gestión de negocios con sistema de usuarios',
    timestamp: new Date().toISOString(),
    status: 'Running'
  });
});

// ===============================================
// IMPORTAR RUTAS DE FORMA SEGURA
// ===============================================

// Función helper para cargar rutas
const loadRoutes = (routePath, mountPath, description) => {
  try {
    console.log(`🛣️ Cargando ${description}...`);
    const routes = require(routePath);
    app.use(mountPath, routes);
    console.log(`✅ ${description} cargadas en ${mountPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error cargando ${description}:`, error.message);
    
    // Crear ruta de fallback
    app.use(mountPath, (req, res) => {
      res.status(503).json({
        success: false,
        message: `${description} no disponibles`,
        error: 'ROUTES_NOT_LOADED'
      });
    });
    return false;
  }
};

// Cargar rutas en orden específico
console.log('🛣️ Registrando rutas...');

// 1. Autenticación (sin middleware adicional)
loadRoutes('./routes/auth', '/api/auth', 'rutas de autenticación');

// 2. Usuarios básicos
loadRoutes('./routes/users', '/api/users', 'rutas de usuarios');

// 3. Negocios
loadRoutes('./routes/businesses', '/api/businesses', 'rutas de negocios');

// 4. Administración (más específico al final)
loadRoutes('./routes/admin/users', '/api/admin/users', 'rutas de administración');

// ===============================================
// CONFIGURAR MODELOS (DESPUÉS DE RUTAS)
// ===============================================
const setupModels = async () => {
  try {
    console.log('📊 Configurando modelos...');
    
    const sequelize = require('./config/database');
    const User = require('./models/User');
    const Business = require('./models/Business');
    
    // Configurar asociaciones
    Business.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
    User.hasMany(Business, { foreignKey: 'created_by', as: 'businesses' });
    
    // Probar conexión
    await sequelize.authenticate();
    console.log('✅ Base de datos conectada');
    
    // Solo en desarrollo: sincronizar
    if (!isProduction) {
      await sequelize.sync({ alter: false });
      console.log('✅ Modelos sincronizados');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error configurando modelos:', error.message);
    if (isProduction) {
      console.warn('⚠️ Continuando sin BD...');
    }
    return false;
  }
};

// ===============================================
// ARCHIVOS ESTÁTICOS (SOLO EN PRODUCCIÓN)
// ===============================================
if (isProduction) {
  console.log('📁 Configurando archivos estáticos...');
  
  const staticPath = path.join(__dirname, '../frontend/dist');
  
  if (require('fs').existsSync(staticPath)) {
    app.use(express.static(staticPath));
    console.log('✅ Archivos estáticos configurados');
    
    // SPA fallback (DEBE IR AL FINAL)
    app.get('*', (req, res) => {
      // No capturar rutas de API
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({
          success: false,
          message: 'Endpoint no encontrado',
          error: 'NOT_FOUND'
        });
      }
      
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  } else {
    console.warn('⚠️ Archivos estáticos no encontrados');
  }
} else {
  // Página de desarrollo
  app.get('/', (req, res) => {
    res.json({
      message: '🚀 Business Map API Server',
      version: '2.1.0',
      status: 'Development Mode',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth/login',
        businesses: '/api/businesses',
        admin: '/api/admin/users'
      }
    });
  });
}

// ===============================================
// MANEJO DE ERRORES
// ===============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: isProduction ? 'INTERNAL_ERROR' : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    error: 'NOT_FOUND',
    path: req.path
  });
});

// ===============================================
// INICIALIZAR SERVIDOR
// ===============================================
const startServer = async () => {
  try {
    // Configurar modelos
    await setupModels();
    
    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log(`🌟 Servidor corriendo en puerto ${PORT}`);
      console.log('==========================================');
      console.log('✅ Business Map Server v2.1.0 LISTO');
      console.log('==========================================');
    });

    // Manejo de cierre graceful
    process.on('SIGTERM', () => {
      console.log('📴 Cerrando servidor...');
      server.close(() => {
        console.log('👋 Servidor cerrado');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Error crítico:', error);
    process.exit(1);
  }
};

// Iniciar
startServer();

module.exports = app;