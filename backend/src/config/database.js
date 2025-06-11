const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// DETECTAR ENTORNO DE EJECUCIÓN
const isRailway = process.env.DATABASE_URL || 
                  process.env.RAILWAY_STATIC_URL || 
                  process.env.RAILWAY_ENVIRONMENT_NAME;
const isProduction = process.env.NODE_ENV === 'production';

console.log('🔧 Configurando conexión a la base de datos...');
console.log(`🌍 Entorno: ${isProduction ? 'Producción' : 'Desarrollo'}`);
console.log(`🚂 Railway: ${isRailway ? 'Sí' : 'No'}`);

// ===============================================
// CONFIGURACIÓN PARA RAILWAY/PRODUCCIÓN
// ===============================================
if (isRailway) {
  console.log('🚂 Configurando base de datos para Railway/producción...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL no encontrada en Railway');
    console.error('💡 Asegúrate de haber agregado PostgreSQL en Railway');
    process.exit(1);
  }
  
  console.log('📡 Conectando a PostgreSQL en Railway...');
  
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000
    },
    logging: isProduction ? false : console.log,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
      evict: 1000,
      handleDisconnects: true
    },
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
    console.error('❌ Variables de entorno faltantes:', missingVars.join(', '));
    console.error('💡 Asegúrate de tener un archivo .env con:');
    console.error('   DB_HOST=localhost');
    console.error('   DB_PORT=5432');
    console.error('   DB_NAME=business_map_db');
    console.error('   DB_USER=tu_usuario');
    console.error('   DB_PASSWORD=tu_password');
    process.exit(1);
  }
  
  console.log(`📡 Conectando a PostgreSQL local: ${process.env.DB_HOST}:${process.env.DB_PORT || 5432}`);
  
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
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    },
    timezone: '+00:00'
  });
}

// ===============================================
// VERIFICAR QUE SEQUELIZE SE CREÓ CORRECTAMENTE
// ===============================================
if (!sequelize) {
  console.error('❌ Error crítico: No se pudo crear la instancia de Sequelize');
  process.exit(1);
}

console.log('✅ Instancia de Sequelize creada correctamente');

// ===============================================
// MANEJO DE EVENTOS DE CONEXIÓN
// ===============================================
sequelize.addHook('afterConnect', async (connection) => {
  console.log('🔗 Nueva conexión establecida a PostgreSQL');
});

sequelize.addHook('beforeDisconnect', async (connection) => {
  console.log('📡 Cerrando conexión a PostgreSQL');
});

// ===============================================
// FUNCIONES HELPER
// ===============================================

/**
 * Probar conexión a la base de datos
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL verificada');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a PostgreSQL:', error.message);
    return false;
  }
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
// MANEJO DE CIERRE GRACEFUL
// ===============================================
process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT recibido, cerrando conexión...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM recibido, cerrando conexión...');
  await closeConnection();
  process.exit(0);
});

// ===============================================
// VERIFICACIÓN FINAL ANTES DE EXPORTAR
// ===============================================
if (typeof sequelize.define !== 'function') {
  console.error('❌ Error crítico: sequelize.define no es una función');
  console.error('💡 Problema con la configuración de Sequelize');
  process.exit(1);
}

console.log('✅ Sequelize configurado y listo para exportar');

// ===============================================
// EXPORTACIÓN
// ===============================================
module.exports = sequelize;