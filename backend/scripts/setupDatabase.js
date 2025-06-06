const sequelize = require('../src/config/database');
const User = require('../src/models/User');
const Business = require('../src/models/Business');

const setupDatabase = async () => {
  try {
    console.log('🔄 Configurando base de datos...');
    
    // Verificar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión establecida con PostgreSQL');

    // Sincronizar modelos (crear tablas si no existen)
    await sequelize.sync({ force: false });
    console.log('✅ Tablas sincronizadas correctamente');

    // Establecer relaciones
    User.hasMany(Business, { foreignKey: 'created_by', as: 'businesses' });
    Business.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
    console.log('✅ Relaciones establecidas entre modelos');

    // Verificar estructura de tablas
    const userCount = await User.count();
    const businessCount = await Business.count();
    
    console.log(`📊 Estado actual:`);
    console.log(`   - Usuarios: ${userCount}`);
    console.log(`   - Negocios: ${businessCount}`);
    
    console.log('🎉 Base de datos configurada correctamente');

  } catch (error) {
    console.error('❌ Error en configuración de base de datos:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;