const bcrypt = require('bcryptjs');
const sequelize = require('../src/config/database');
const User = require('../src/models/User');

const createInitialUsers = async () => {
  try {
    console.log('🔄 Creando usuarios iniciales...');
    
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');

    // Verificar si ya existen usuarios
    const existingUsers = await User.findAll();
    if (existingUsers.length > 0) {
      console.log('⚠️ Ya existen usuarios en la base de datos');
      console.log('📋 Usuarios existentes:');
      existingUsers.forEach(user => {
        console.log(`   - ${user.username} (${user.role})`);
      });
      return;
    }

    // Crear usuario administrador
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await User.create({
      username: 'admin',
      password: adminPassword,
      role: 'admin'
    });

    // Crear usuario normal
    const userPassword = await bcrypt.hash('user123', 12);
    const normalUser = await User.create({
      username: 'user',
      password: userPassword,
      role: 'user'
    });

    console.log('✅ Usuarios creados exitosamente:');
    console.log(`   - admin / admin123 (Administrador) - ID: ${adminUser.id}`);
    console.log(`   - user / user123 (Usuario normal) - ID: ${normalUser.id}`);
    console.log('');
    console.log('🔑 Usa estas credenciales para acceder al sistema');

  } catch (error) {
    console.error('❌ Error al crear usuarios:', error);
    
    if (error.name === 'SequelizeValidationError') {
      console.error('Errores de validación:');
      error.errors.forEach(err => {
        console.error(`   - ${err.message}`);
      });
    }
  } finally {
    await sequelize.close();
  }
};

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  createInitialUsers();
}

module.exports = createInitialUsers;