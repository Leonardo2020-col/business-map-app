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
    ? [
        process.env.FRONTEND_URL,
        process.env.RAILWAY_STATIC_URL,
        /\.railway\.app$/
      ].filter(Boolean) // Eliminar valores undefined
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
// CONFIGURAR MODELOS PRIMERO
// ===============================================
const setupModels = async () => {
  try {
    console.log('📊 Configurando modelos...');
    
    // ✅ RUTAS CORREGIDAS
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
    console.error('Stack:', error.stack);
    if (isProduction) {
      console.warn('⚠️ Continuando sin BD...');
    }
    return false;
  }
};

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
    console.error(`   Ruta intentada: ${routePath}`);
    
    // Crear ruta de fallback
    app.use(mountPath, (req, res) => {
      res.status(503).json({
        success: false,
        message: `${description} no disponibles`,
        error: 'ROUTES_NOT_LOADED',
        details: error.message
      });
    });
    return false;
  }
};

// ===============================================
// INICIALIZAR SERVIDOR
// ===============================================
const startServer = async () => {
  try {
    // ✅ CONFIGURAR MODELOS PRIMERO
    const modelsConfigured = await setupModels();
    
    // ✅ CARGAR RUTAS CON RUTAS CORREGIDAS
    console.log('🛣️ Registrando rutas...');
    
    loadRoutes('./routes/auth', '/api/auth', 'rutas de autenticación');
    loadRoutes('./routes/users', '/api/users', 'rutas de usuarios');
    loadRoutes('./routes/businesses', '/api/businesses', 'rutas de negocios');
    loadRoutes('./routes/admin/users', '/api/admin/users', 'rutas de administración de usuarios');
    
    // ===============================================
    // ARCHIVOS ESTÁTICOS Y SPA FALLBACK
    // ===============================================
    if (isProduction) {
      console.log('📁 Configurando archivos estáticos...');
      
      // Rutas posibles para el frontend
      const possiblePaths = [
        path.join(__dirname, '../../frontend/dist'),
        path.join(__dirname, '../frontend/dist'),
        path.join(__dirname, './dist'),
        path.join(process.cwd(), 'dist'),
        path.join(process.cwd(), 'frontend/dist')
      ];
      
      const fs = require('fs');
      let staticPath = null;
      
      // Buscar el directorio correcto
      for (const testPath of possiblePaths) {
        console.log(`🔍 Verificando: ${testPath}`);
        if (fs.existsSync(testPath)) {
          const indexPath = path.join(testPath, 'index.html');
          if (fs.existsSync(indexPath)) {
            staticPath = testPath;
            console.log(`✅ Frontend encontrado en: ${staticPath}`);
            break;
          }
        }
      }
      
      if (staticPath) {
        // Servir archivos estáticos
        app.use(express.static(staticPath));
        console.log('✅ Archivos estáticos configurados');
        
        // SPA fallback
        app.get('*', (req, res) => {
          if (req.path.startsWith('/api/')) {
            return res.status(404).json({
              success: false,
              message: 'Endpoint de API no encontrado',
              error: 'NOT_FOUND',
              path: req.path
            });
          }
          
          const indexPath = path.join(staticPath, 'index.html');
          res.sendFile(indexPath);
        });
      } else {
        console.warn('⚠️ Frontend no encontrado en ninguna ubicación');
        
        // Fallback sin frontend
        app.get('*', (req, res) => {
          if (req.path.startsWith('/api/')) {
            return res.status(404).json({
              success: false,
              message: 'Endpoint de API no encontrado',
              error: 'NOT_FOUND'
            });
          }
          
          res.status(503).json({
            success: false,
            message: 'Frontend no disponible',
            error: 'FRONTEND_NOT_DEPLOYED',
            searchedPaths: possiblePaths
          });
        });
      }
    } else {
      // Página de desarrollo
      app.get('/', (req, res) => {
        res.json({
          message: '🚀 Business Map API Server',
          version: '2.1.0',
          status: 'Development Mode',
          modelsConfigured,
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
    
    // Iniciar servidor
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🌟 Servidor corriendo en puerto ${PORT}`);
      console.log('==========================================');
      console.log('✅ Business Map Server v2.1.0 LISTO');
      console.log(`📊 Modelos configurados: ${modelsConfigured ? 'SÍ' : 'NO'}`);
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