const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// Configuración para Railway (producción) vs desarrollo local
if (process.env.DATABASE_URL) {
  // Configuración para Railway/producción usando DATABASE_URL
  console.log('🚀 Configurando base de datos para Railway/producción...');
  
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Necesario para Railway
      }
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // Configuraciones adicionales para Railway
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ENOTFOUND/,
        /EAI_AGAIN/
      ],
      max: 3
    }
  });
  
} else {
  // Configuración para desarrollo local usando variables individuales
  console.log('🏠 Configurando base de datos para desarrollo local...');
  
  // Verificar que las variables necesarias estén definidas
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
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

// Función para probar la conexión
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    
    // Mostrar información de la conexión (sin credenciales sensibles)
    const config = sequelize.config;
    if (process.env.DATABASE_URL) {
      console.log('📍 Conectado a Railway PostgreSQL');
    } else {
      console.log(`📍 Conectado a: ${config.host}:${config.port}/${config.database}`);
    }
    
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message);
    
    // Mensajes de error específicos con soluciones
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Solución: PostgreSQL no está ejecutándose');
      if (!process.env.DATABASE_URL) {
        console.error('   - Windows: services.msc → Iniciar PostgreSQL');
        console.error('   - Linux: sudo service postgresql start');
        console.error('   - macOS: brew services start postgresql');
      }
    }
    
    if (error.message.includes('password authentication failed')) {
      console.error('💡 Solución: Credenciales incorrectas');
      if (process.env.DATABASE_URL) {
        console.error('   - Verifica DATABASE_URL en Railway');
      } else {
        console.error('   - Verifica DB_USER y DB_PASSWORD en .env');
      }
    }
    
    if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.error('💡 Solución: Base de datos no existe');
      if (!process.env.DATABASE_URL) {
        console.error('   - Ejecuta: npm run setup-db');
        console.error(`   - O manualmente: CREATE DATABASE ${process.env.DB_NAME};`);
      }
    }
    
    if (error.message.includes('ssl')) {
      console.error('💡 Solución: Problema con SSL');
      console.error('   - Verifica la configuración SSL para Railway');
    }
    
    throw error;
  }
};

// Solo probar conexión si no estamos en modo test
if (process.env.NODE_ENV !== 'test') {
  // Probar conexión después de un pequeño delay para dar tiempo a que se carguen las variables
  setTimeout(() => {
    testConnection().catch(() => {
      console.error('🚨 No se pudo establecer conexión con la base de datos');
      console.error('🔧 Revisa la configuración y vuelve a intentar');
    });
  }, 1000);
}

module.exports = sequelize;