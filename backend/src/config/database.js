const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// ===============================================
// DETECTAR ENTORNO DE EJECUCIÓN
// ===============================================
const isRailway = process.env.DATABASE_URL || 
                  process.env.RAILWAY_STATIC_URL || 
                  process.env.RAILWAY_ENVIRONMENT_NAME;

const isProduction = process.env.NODE_ENV === 'production';

// ===============================================
// CONFIGURACIÓN PARA RAILWAY/PRODUCCIÓN
// ===============================================
if (isRailway) {
  console.log('🚂 Configurando base de datos para Railway/producción...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL no encontrada en Railway');
    console.error('💡 Asegúrate de haber agregado PostgreSQL en Railway');
    console.error('🔗 Guía: https://docs.railway.app/databases/postgresql');
    process.exit(1);
  }
  
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      // ✅ NUEVO: Configuración específica para Railway
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000
    },
    logging: isProduction ? false : console.log,
    pool: {
      max: 10,        // ✅ Aumentado para mejor rendimiento
      min: 0,
      acquire: 30000,
      idle: 10000,
      evict: 1000,    // ✅ NUEVO: Tiempo para cerrar conexiones inactivas
      handleDisconnects: true  // ✅ NUEVO: Manejar desconexiones automáticamente
    },
    // ✅ NUEVO: Configuraciones adicionales para producción
    retry: {
      max: 3,
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /TimeoutError/
      ]
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  });
  
} else {
  // ===============================================
  // CONFIGURACIÓN PARA DESARROLLO LOCAL
  // ===============================================
  console.log('🏠 Configurando base de datos para desarrollo local...');
  
  const requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes para la base de datos:', missingVars.join(', '));
    console.error('💡 Asegúrate de tener un archivo .env con:');
    console.error('   DB_HOST=localhost');
    console.error('   DB_PORT=5432');
    console.error('   DB_NAME=business_map_db');
    console.error('   DB_USER=tu_usuario');
    console.error('   DB_PASSWORD=tu_password');
    console.error('');
    console.error('🔧 Para crear la base de datos en PostgreSQL:');
    console.error('   createdb business_map_db');
    console.error('   psql -d business_map_db -f database/migration.sql');
    process.exit(1);
  }
  
  sequelize = new Sequelize({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: 'postgres',
    logging: process.env.DB_LOGGING === 'false' ? false : console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
      evict: 1000,
      handleDisconnects: true
    },
    // ✅ NUEVO: Configuraciones mejoradas para desarrollo
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    },
    // ✅ NUEVO: Configuración para mejor debugging
    benchmark: true,
    timezone: process.env.TZ || 'America/Lima'
  });
}

// ===============================================
// FUNCIONES HELPER PARA GESTIÓN DE CONEXIÓN
// ===============================================

/**
 * Probar conexión a la base de datos
 * @returns {Promise<boolean>} - True si la conexión es exitosa
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    
    // ✅ NUEVO: Mensajes de error específicos
    if (error.original?.code === 'ECONNREFUSED') {
      console.error('💡 PostgreSQL no está corriendo o no es accesible');
      console.error('🔧 Verifica que PostgreSQL esté iniciado');
    } else if (error.original?.code === '3D000') {
      console.error('💡 La base de datos no existe');
      console.error('🔧 Crea la base de datos: createdb', process.env.DB_NAME);
    } else if (error.original?.code === '28P01') {
      console.error('💡 Credenciales incorrectas');
      console.error('🔧 Verifica DB_USER y DB_PASSWORD en .env');
    }
    
    return false;
  }
};

/**
 * Verificar y crear extensiones necesarias
 */
const setupExtensions = async () => {
  try {
    // ✅ NUEVO: Crear extensiones útiles para el sistema de usuarios
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "unaccent";');
    console.log('✅ Extensiones PostgreSQL verificadas');
  } catch (error) {
    console.warn('⚠️ No se pudieron crear algunas extensiones:', error.message);
  }
};

/**
 * Verificar tablas esenciales
 */
const verifyTables = async () => {
  try {
    const [users] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name IN ('users', 'businesses', 'user_permissions')
    `);
    
    const tableCount = parseInt(users[0].count);
    
    if (tableCount < 2) {
      console.warn('⚠️ Faltan tablas esenciales en la base de datos');
      console.warn('💡 Ejecuta el script de migración:');
      console.warn('   psql -d', process.env.DB_NAME, '-f database/migration.sql');
      return false;
    }
    
    console.log(`✅ Tablas esenciales verificadas (${tableCount} encontradas)`);
    return true;
  } catch (error) {
    console.error('❌ Error verificando tablas:', error.message);
    return false;
  }
};

/**
 * Verificar datos iniciales
 */
const verifyInitialData = async () => {
  try {
    const [users] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(users[0].count);
    
    if (userCount === 0) {
      console.warn('⚠️ No hay usuarios en la base de datos');
      console.warn('💡 Ejecuta el script de datos iniciales o crea un usuario admin');
      return false;
    }
    
    console.log(`✅ Datos iniciales verificados (${userCount} usuarios)`);
    return true;
  } catch (error) {
    console.warn('⚠️ No se pudieron verificar datos iniciales:', error.message);
    return false;
  }
};

/**
 * Inicialización completa de la base de datos
 */
const initializeDatabase = async () => {
  console.log('🔄 Inicializando conexión a la base de datos...');
  
  // Probar conexión
  const connectionOk = await testConnection();
  if (!connectionOk) {
    return false;
  }
  
  // Configurar extensiones
  await setupExtensions();
  
  // Verificar estructura
  const tablesOk = await verifyTables();
  if (!tablesOk && !isProduction) {
    console.warn('⚠️ Continuando sin todas las tablas (modo desarrollo)');
  }
  
  // Verificar datos iniciales
  if (!isProduction) {
    await verifyInitialData();
  }
  
  console.log('🎉 Base de datos inicializada correctamente');
  return true;
};

/**
 * Cerrar conexión gracefully
 */
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('📴 Conexión a PostgreSQL cerrada');
  } catch (error) {
    console.error('❌ Error cerrando conexión:', error.message);
  }
};

// ===============================================
// MANEJO DE EVENTOS DE PROCESO
// ===============================================
process.on('SIGINT', async () => {
  console.log('\n🛑 Recibida señal SIGINT, cerrando conexión...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recibida señal SIGTERM, cerrando conexión...');
  await closeConnection();
  process.exit(0);
});

// ✅ NUEVO: Manejar errores de conexión perdida
sequelize.addHook('afterConnect', async (connection) => {
  console.log('🔗 Nueva conexión establecida');
});

sequelize.addHook('beforeDisconnect', async (connection) => {
  console.log('📡 Cerrando conexión a la base de datos');
});

// ===============================================
// EXPORTACIONES
// ===============================================
module.exports = {
  sequelize,           // Instancia principal de Sequelize
  testConnection,      // ✅ NUEVO: Función para probar conexión
  initializeDatabase,  // ✅ NUEVO: Inicialización completa
  closeConnection,     // ✅ NUEVO: Cerrar conexión
  setupExtensions,     // ✅ NUEVO: Configurar extensiones
  verifyTables,        // ✅ NUEVO: Verificar estructura
  verifyInitialData,   // ✅ NUEVO: Verificar datos
  
  // ✅ NUEVO: Información del entorno
  environment: {
    isProduction,
    isRailway,
    database: process.env.DB_NAME || 'railway',
    host: process.env.DB_HOST || 'railway'
  }
};