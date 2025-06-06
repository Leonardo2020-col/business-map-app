const sequelize = require('../src/config/database');
const User = require('../src/models/User');
const Business = require('../src/models/Business');
const bcrypt = require('bcryptjs');

const resetDatabase = async () => {
  try {
    console.log('🔄 Reiniciando base de datos...');
    console.log('⚠️  ADVERTENCIA: Esto eliminará TODOS los datos existentes');
    
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL');

    // Recrear todas las tablas (elimina datos existentes)
    await sequelize.sync({ force: true });
    console.log('✅ Tablas recreadas (datos anteriores eliminados)');

    // Establecer relaciones
    User.hasMany(Business, { foreignKey: 'created_by', as: 'businesses' });
    Business.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

    // Crear usuarios iniciales
    console.log('👤 Creando usuarios...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    const userPassword = await bcrypt.hash('user123', 12);

    const [adminUser, normalUser] = await User.bulkCreate([
      {
        username: 'admin',
        password: adminPassword,
        role: 'admin'
      },
      {
        username: 'user',
        password: userPassword,
        role: 'user'
      }
    ]);

    console.log('✅ Usuarios creados');

    // Crear negocios de ejemplo
    console.log('🏢 Creando negocios de ejemplo...');
    
    const sampleBusinesses = [
      {
        name: 'Restaurante El Dorado',
        address: 'Av. Larco 345, Miraflores, Lima',
        business_type: 'Restaurante',
        phone: '01-445-6789',
        email: 'contacto@eldorado.com',
        description: 'Comida peruana tradicional con vista al mar. Especialidad en ceviche y anticuchos.',
        latitude: -12.1196,
        longitude: -77.0267,
        created_by: adminUser.id
      },
      {
        name: 'Farmacia SaludTotal',
        address: 'Jr. de la Unión 456, Lima Centro',
        business_type: 'Farmacia',
        phone: '01-567-8901',
        email: 'info@saludtotal.pe',
        description: 'Farmacia 24 horas con atención médica especializada y delivery.',
        latitude: -12.0464,
        longitude: -77.0428,
        created_by: normalUser.id
      },
      {
        name: 'Gimnasio FitZone',
        address: 'Av. Javier Prado 789, San Isidro',
        business_type: 'Gimnasio',
        phone: '01-234-5678',
        email: 'contacto@fitzone.pe',
        description: 'Gimnasio moderno con equipos de última generación y entrenadores certificados.',
        latitude: -12.0975,
        longitude: -77.0368,
        created_by: adminUser.id
      },
      {
        name: 'Supermercado Plaza Vea Express',
        address: 'Av. Brasil 1234, Pueblo Libre',
        business_type: 'Supermercado',
        phone: '01-789-0123',
        email: 'info@plazavea.com.pe',
        description: 'Supermercado con productos frescos, panadería y sección de comidas preparadas.',
        latitude: -12.0732,
        longitude: -77.0661,
        created_by: normalUser.id
      },
      {
        name: 'Banco de Crédito BCP',
        address: 'Av. República de Panamá 567, Barranco',
        business_type: 'Banco',
        phone: '01-311-9000',
        email: 'atencion@viabcp.com',
        description: 'Agencia bancaria con servicios completos, cajero automático y asesoría financiera.',
        latitude: -12.1453,
        longitude: -77.0187,
        created_by: adminUser.id
      },
      {
        name: 'Taller Mecánico AutoFix',
        address: 'Av. Colonial 890, Callao',
        business_type: 'Taller',
        phone: '01-456-7890',
        email: 'servicios@autofix.pe',
        description: 'Taller especializado en mantenimiento y reparación de vehículos. Servicio express.',
        latitude: -12.0621,
        longitude: -77.1286,
        created_by: normalUser.id
      },
      {
        name: 'Clínica Dental Sonrisa',
        address: 'Av. Arequipa 1122, Lince',
        business_type: 'Hospital',
        phone: '01-332-4455',
        email: 'citas@clinicasonrisa.pe',
        description: 'Clínica dental con tecnología moderna. Especialistas en ortodoncia y implantes.',
        latitude: -12.0899,
        longitude: -77.0366,
        created_by: adminUser.id
      },
      {
        name: 'Colegio San Martín',
        address: 'Jr. Huancavelica 234, Lima',
        business_type: 'Escuela',
        phone: '01-567-1234',
        email: 'informes@sanmartin.edu.pe',
        description: 'Institución educativa con 50 años de experiencia. Niveles inicial, primaria y secundaria.',
        latitude: -12.0582,
        longitude: -77.0364,
        created_by: normalUser.id
      }
    ];

    await Business.bulkCreate(sampleBusinesses);
    console.log(`✅ ${sampleBusinesses.length} negocios de ejemplo creados`);

    // Estadísticas finales
    const finalUserCount = await User.count();
    const finalBusinessCount = await Business.count();

    console.log('');
    console.log('📊 Base de datos reiniciada exitosamente:');
    console.log(`   👥 Usuarios: ${finalUserCount}`);
    console.log(`   🏢 Negocios: ${finalBusinessCount}`);
    console.log('');
    console.log('🔑 Credenciales de acceso:');
    console.log('   📱 Admin: admin / admin123');
    console.log('   👤 Usuario: user / user123');
    console.log('');
    console.log('🎉 ¡Sistema listo para usar!');

  } catch (error) {
    console.error('❌ Error al reiniciar base de datos:', error);
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('💡 Verifica que PostgreSQL esté corriendo y las credenciales sean correctas');
    }
  } finally {
    await sequelize.close();
  }
};

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  resetDatabase();
}

module.exports = resetDatabase;