const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importar base de datos y modelos
const sequelize = require('./src/config/database');
const User = require('./src/models/User');
const Business = require('./src/models/Business');

// Importar rutas
const authRoutes = require('./src/routes/auth');
const businessRoutes = require('./src/routes/businesses');
const userRoutes = require('./src/routes/users');
// ✅ NUEVAS RUTAS DE ADMINISTRACIÓN
const adminUserRoutes = require('./src/routes/admin/users');

// Importar middleware
const { auth } = require('./src/middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================================
// MIDDLEWARE GLOBAL
// ===============================================
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

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

// Ruta de salud del servidor
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'Connected'
  });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de negocios (protegidas)
app.use('/api/businesses', auth, businessRoutes);

// Rutas de usuarios (protegidas)
app.use('/api/users', auth, userRoutes);

// ✅ NUEVAS RUTAS DE ADMINISTRACIÓN (solo admins)
app.use('/api/admin/users', adminUserRoutes);

// ===============================================
// SERVIR ARCHIVOS ESTÁTICOS EN PRODUCCIÓN
// ===============================================
if (process.env.NODE_ENV === 'production') {
  // Servir archivos estáticos del frontend
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  // Manejar rutas del frontend (SPA)
  app.get('*', (req, res) => {
    // Excluir rutas de API
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
        error: 'NOT_FOUND'
      });
    }
    
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
} else {
  // Mensaje para desarrollo
  app.get('/', (req, res) => {
    res.json({
      message: '🚀 Business Map API Server',
      status: 'Development Mode',
      frontend: 'http://localhost:5173',
      api_docs: '/api/health',
      available_endpoints: {
        auth: '/api/auth',
        businesses: '/api/businesses',
        users: '/api/users',
        admin: '/api/admin/*'
      }
    });
  });
}

// ===============================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ===============================================
app.use((err, req, res, next) => {
  console.error('❌ Error del servidor:', err);
  
  // Error de validación de Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      error: 'VALIDATION_ERROR',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }
  
  // Error de restricción única
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Recurso ya existe',
      error: 'DUPLICATE_RESOURCE'
    });
  }
  
  // Error de conexión a la base de datos
  if (err.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      success: false,
      message: 'Error de conexión a la base de datos',
      error: 'DATABASE_CONNECTION_ERROR'
    });
  }
  
  // Error genérico
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    error: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// ===============================================
// INICIALIZACIÓN DEL SERVIDOR
// ===============================================
const startServer = async () => {
  try {
    console.log('🚀 Iniciando Business Map Server...');
    
    // Configurar asociaciones
    setupAssociations();
    
    // Probar conexión a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida');
    
    // Sincronizar modelos (solo en desarrollo)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: false }); // No alterar en producción
      console.log('✅ Modelos sincronizados con la base de datos');
    }
    
    // Verificar que existan usuarios
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('⚠️ No hay usuarios en la base de datos');
      console.log('💡 Ejecuta el script SQL de inicialización para crear usuarios por defecto');
    } else {
      console.log(`✅ Base de datos lista con ${userCount} usuarios`);
    }
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🌟 Servidor corriendo en puerto ${PORT}`);
      console.log(`🔗 Entorno: ${process.env.NODE_ENV || 'development'}`);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`📱 Frontend: http://localhost:5173`);
        console.log(`🔧 API: http://localhost:${PORT}/api`);
        console.log(`💊 Health Check: http://localhost:${PORT}/api/health`);
      }
      
      console.log('==========================================');
      console.log('✅ Business Map Server listo para usar');
      console.log('==========================================');
    });
    
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('💡 Verifica:');
      console.error('   - Que PostgreSQL esté corriendo');
      console.error('   - Las credenciales en .env');
      console.error('   - La base de datos existe');
    }
    
    process.exit(1);
  }
};

// Manejar cierre graceful
process.on('SIGTERM', async () => {
  console.log('📴 Cerrando servidor...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📴 Cerrando servidor...');
  await sequelize.close();
  process.exit(0);
});

// Iniciar servidor
startServer();

module.exports = app;