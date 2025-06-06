const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// FORZAR DETECCIÓN DE RAILWAY
const isRailway = process.env.DATABASE_URL || process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_ENVIRONMENT_NAME;

if (isRailway) {
  // Configuración para Railway (producción)
  console.log('🚂 Configurando base de datos para Railway/producción...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL no encontrada en Railway');
    console.error('💡 Asegúrate de haber agregado PostgreSQL en Railway');
    process.exit(1);
  }
  
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
  
} else {
  // Configuración para desarrollo local
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
    process.exit(1);
  }
  
  sequelize = new Sequelize({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

module.exports = sequelize;