// backend/src/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const sequelize = require('./config/database');
const User = require('./models/User');
const Business = require('./models/Business');
const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/businesses');

const app = express();

// Configuración de CORS actualizada para Railway
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL,
        /\.railway\.app$/,  // Permite todos los subdominios de Railway
        /\.up\.railway\.app$/
      ]
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  next();
});

// IMPORTANTE: Definir las relaciones SOLO UNA VEZ aquí
console.log('🔗 Configurando relaciones de base de datos...');

try {
  // Verificar que los modelos estén definidos
  if (!User || !Business) {
    throw new Error('Los modelos User o Business no están definidos correctamente');
  }

  // Definir relaciones entre modelos (SOLO UNA VEZ)
  User.hasMany(Business, { 
    foreignKey: 'created_by', 
    as: 'businesses',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  Business.belongsTo(User, { 
    foreignKey: 'created_by', 
    as: 'creator',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  console.log('✅ Relaciones de base de datos configuradas correctamente');

} catch (error) {
  console.error('❌ Error al configurar relaciones:', error.message);
  process.exit(1);
}

// Rutas de la API
console.log('🛣️ Registrando rutas de la API...');
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
console.log('✅ Rutas de la API registradas');

// Ruta de prueba
console.log('🛣️ Registrando ruta raíz...');
app.get('/', (req, res) => {
  res.json({ 
    message: 'Business Map API funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      businesses: '/api/businesses',
      health: '/api/health'
    }
  });
});
console.log('✅ Ruta raíz registrada');

// Ruta para verificar el estado de la base de datos
console.log('🛣️ Registrando ruta de health check...');
app.get('/api/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    await sequelize.authenticate();
    
    // Contar registros
    const businessCount = await Business.count();
    const userCount = await User.count();
    
    // Verificar relaciones
    const testUser = await User.findOne({
      include: [{
        model: Business,
        as: 'businesses'
      }]
    });
    
    res.json({
      status: 'OK',
      database: 'Connected',
      users: userCount,
      businesses: businessCount,
      relations: 'Working',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      sequelize_version: require('sequelize/package.json').version
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      database: 'Disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
console.log('✅ Ruta de health check registrada');

// Servir frontend React en producción
if (process.env.NODE_ENV === 'production') {
  console.log('🌐 Configurando servicio de archivos estáticos...');
  
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  console.log('📁 Ruta del frontend:', frontendPath);
  
  // Verificar que el directorio existe
  if (fs.existsSync(frontendPath)) {
    console.log('✅ Directorio frontend/dist encontrado');
    
    // Servir archivos estáticos
    app.use(express.static(frontendPath));
    console.log('✅ Archivos estáticos configurados');
    
  } else {
    console.error('❌ No se encontró frontend/dist');
    console.error('💡 Verifica que npm run build se ejecutó correctamente');
    
    // Listar contenido del directorio para debug
    const frontendDir = path.join(__dirname, '../../frontend');
    if (fs.existsSync(frontendDir)) {
      console.log('📂 Contenido de frontend/:', fs.readdirSync(frontendDir));
    }
  }
}

// En producción, servir el SPA para rutas no-API
if (process.env.NODE_ENV === 'production') {
  console.log('🛣️ Registrando SPA fallback...');
  
  // Middleware para servir el SPA
  app.use((req, res, next) => {
    // Solo para rutas que NO empiecen con /api
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    const frontendPath = path.join(__dirname, '../../frontend/dist');
    const indexPath = path.join(frontendPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
      console.log(`🌐 Serving React app for: ${req.path}`);
      return res.sendFile(indexPath);
    } else {
      console.error('❌ index.html no encontrado en:', indexPath);
      return res.status(404).json({
        success: false,
        message: 'Frontend no disponible',
        error: 'FRONTEND_NOT_BUILT',
        suggestion: 'Ejecuta npm run build para construir el frontend'
      });
    }
  });
  
  console.log('✅ SPA fallback registrado');
}

// Middleware de manejo de errores 404 - Solo para APIs que no existen
console.log('🛣️ Registrando middleware 404 para APIs...');
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta de API no encontrada',
    error: 'API_ROUTE_NOT_FOUND',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/verify',
      'GET /api/businesses',
      'POST /api/businesses',
      'PUT /api/businesses/:id',
      'DELETE /api/businesses/:id'
    ]
  });
});

console.log('✅ Middleware 404 registrado');

// Middleware global de manejo de errores
console.log('🛣️ Registrando middleware de errores...');
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  
  // Errores de path-to-regexp
  if (error.message && error.message.includes('Missing parameter name')) {
    return res.status(500).json({
      success: false,
      message: 'Error en la definición de rutas',
      error: 'ROUTE_PARAMETER_ERROR',
      details: 'Hay un problema con los parámetros de las rutas. Revisa que no tengas rutas con ":" sin nombre de parámetro.',
      solution: 'Cambia rutas como "/users/:" por "/users/:id"'
    });
  }
  
  // Errores de Sequelize
  if (error.name && error.name.includes('Sequelize')) {
    return res.status(400).json({
      success: false,
      message: 'Error de base de datos',
      error: 'DATABASE_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  // Errores de validación
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      error: 'VALIDATION_ERROR',
      details: error.errors || error.message
    });
  }
  
  // Error genérico
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor',
    error: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      details: error 
    })
  });
});
console.log('✅ Middleware de errores registrado');

const PORT = process.env.PORT || 5000;

// Función para inicializar el servidor
const startServer = async () => {
  try {
    console.log('🚀 Iniciando Business Map Backend...');
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    
    // Variables de entorno requeridas según el entorno
    const requiredEnvVars = process.env.DATABASE_URL || process.env.RAILWAY_ENVIRONMENT
      ? ['DATABASE_URL', 'JWT_SECRET'] // Railway/producción
      : ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET']; // Desarrollo local
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
    }
    
    // Verificar conexión a la base de datos
    console.log('🔌 Conectando a PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    
    // Sincronizar modelos con la base de datos
    console.log('🔄 Sincronizando modelos con la base de datos...');
    await sequelize.sync({ 
      alter: false, // Cambiar a false para evitar problemas con vistas
      force: false // NUNCA usar force: true en producción
    });
    console.log('✅ Modelos sincronizados con la base de datos');
    
    // Verificar que las tablas existen
    const [usersCount, businessesCount] = await Promise.all([
      User.count(),
      Business.count()
    ]);
    
    console.log(`📊 Estado de la base de datos:`);
    console.log(`   👥 Usuarios: ${usersCount}`);
    console.log(`   🏢 Negocios: ${businessesCount}`);
    
    // Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('🎉 ¡Servidor iniciado exitosamente!');
      console.log(`📍 Puerto: ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      
      if (process.env.NODE_ENV === 'production') {
        console.log(`🚀 Railway URL: https://business-map-app-production.up.railway.app`);
      } else {
        console.log(`🏠 Local URL: http://localhost:${PORT}`);
        console.log(`🔗 Frontend: http://localhost:5173`);
      }
      
      console.log(`🕐 Hora: ${new Date().toLocaleString('es-PE')}`);
      console.log('');
      console.log('📋 Endpoints disponibles:');
      console.log('   - GET  / (info del API)');
      console.log('   - GET  /api/health (estado del sistema)');
      console.log('   - POST /api/auth/login (iniciar sesión)');
      console.log('   - POST /api/auth/register (registrar usuario)');
      console.log('   - GET  /api/auth/verify (verificar token)');
      console.log('   - GET  /api/businesses (listar negocios)');
      console.log('   - POST /api/businesses (crear negocio)');
      console.log('   - PUT  /api/businesses/:id (actualizar negocio)');
      console.log('   - DELETE /api/businesses/:id (eliminar negocio)');
      
      if (process.env.NODE_ENV === 'production') {
        console.log('   - GET  /* (frontend React SPA)');
      }
      
      console.log('');
      console.log('✅ Backend listo para recibir peticiones');
      console.log('');
    });

    // Configurar cierre graceful del servidor
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️ Recibida señal ${signal}, cerrando servidor...`);
      
      // Cerrar servidor HTTP
      server.close(async () => {
        console.log('🔌 Servidor HTTP cerrado');
        
        try {
          // Cerrar conexión a la base de datos
          await sequelize.close();
          console.log('🗄️ Conexión a base de datos cerrada');
          
          console.log('✅ Cierre graceful completado');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error durante el cierre:', error);
          process.exit(1);
        }
      });
    };

    // Manejar señales del sistema
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Manejar errores no capturados
    process.on('uncaughtException', (error) => {
      console.error('❌ Excepción no capturada:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promesa rechazada no manejada:', reason);
      console.error('En promesa:', promise);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    console.error('❌ Error al inicializar el servidor:', error);
    
    // Errores específicos con soluciones
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Solución: Verifica que PostgreSQL esté ejecutándose');
      if (process.env.NODE_ENV !== 'production') {
        console.error('   - Windows: services.msc → PostgreSQL');
        console.error('   - Linux: sudo service postgresql start');
        console.error('   - macOS: brew services start postgresql');
      }
    }
    
    if (error.message.includes('authentication failed')) {
      console.error('💡 Solución: Verifica las credenciales');
      if (process.env.NODE_ENV === 'production') {
        console.error('   - Verifica DATABASE_URL en Railway');
      } else {
        console.error('   - DB_USER y DB_PASSWORD correctos en .env');
        console.error('   - Usuario tiene permisos en la base de datos');
      }
    }
    
    if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.error('💡 Solución: Crea la base de datos');
      if (process.env.NODE_ENV === 'production') {
        console.error('   - Verifica que PostgreSQL esté agregado en Railway');
      } else {
        console.error('   - Ejecuta: npm run setup-db');
        console.error('   - O crea la DB: CREATE DATABASE business_map_db;');
      }
    }
    
    console.error('');
    console.error('🔧 Para solucionar problemas:');
    if (process.env.NODE_ENV === 'production') {
      console.error('   1. Verifica variables de entorno en Railway');
      console.error('   2. Asegúrate de que PostgreSQL esté agregado');
      console.error('   3. Revisa los logs de Railway');
    } else {
      console.error('   1. Verifica que PostgreSQL esté ejecutándose');
      console.error('   2. Revisa las variables en .env');
      console.error('   3. Ejecuta: npm run setup-db');
      console.error('   4. Ejecuta: npm run create-users');
    }
    console.error('');
    
    process.exit(1);
  }
};

// Solo iniciar el servidor si no estamos en modo test
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// Exportar app para tests
module.exports = app;