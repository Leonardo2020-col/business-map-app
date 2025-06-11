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
// ARCHIVOS ESTÁTICOS Y SPA FALLBACK
// ===============================================
if (isProduction) {
  console.log('📁 Configurando archivos estáticos...');
  
  // La ruta correcta basada en tu estructura
  const staticPath = path.join(__dirname, '../../frontend/dist');
  const fs = require('fs');
  
  console.log(`🔍 Buscando frontend en: ${staticPath}`);
  
  if (fs.existsSync(staticPath)) {
    console.log('✅ Frontend encontrado');
    
    // Servir archivos estáticos
    app.use(express.static(staticPath));
    console.log('✅ Archivos estáticos configurados');
    
    // Verificar que index.html existe
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log('✅ index.html encontrado');
    } else {
      console.warn('⚠️ index.html NO encontrado');
    }
    
    // SPA fallback - DEBE IR DESPUÉS DE LAS RUTAS DE API
    app.get('*', (req, res) => {
      // Si es una ruta de API que no existe, devolver 404 JSON
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({
          success: false,
          message: 'Endpoint de API no encontrado',
          error: 'NOT_FOUND',
          path: req.path
        });
      }
      
      // Para cualquier otra ruta, servir index.html (SPA)
      const indexPath = path.join(staticPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        console.log(`📄 Sirviendo SPA para: ${req.path}`);
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Frontend no disponible - index.html no encontrado');
      }
    });
  } else {
    console.warn(`⚠️ Directorio de archivos estáticos no encontrado: ${staticPath}`);
    
    // Intentar rutas alternativas
    const alternativePaths = [
      path.join(__dirname, '../frontend/dist'),
      path.join(__dirname, './dist'),
      path.join(__dirname, '../dist')
    ];
    
    let foundPath = null;
    for (const altPath of alternativePaths) {
      console.log(`🔍 Intentando: ${altPath}`);
      if (fs.existsSync(altPath)) {
        foundPath = altPath;
        console.log(`✅ Frontend encontrado en: ${altPath}`);
        break;
      }
    }
    
    if (foundPath) {
      app.use(express.static(foundPath));
      app.get('*', (req, res) => {
        if (req.path.startsWith('/api/')) {
          return res.status(404).json({
            success: false,
            message: 'Endpoint de API no encontrado',
            error: 'NOT_FOUND'
          });
        }
        res.sendFile(path.join(foundPath, 'index.html'));
      });
    } else {
      // Fallback si no hay archivos estáticos
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
          searchedPaths: [staticPath, ...alternativePaths]
        });
      });
    }
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

// 404 handler SOLO para rutas de API (el SPA fallback maneja el resto)
// NO INCLUIR 404 GENERAL AQUÍ porque interfiere con el SPA fallback

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