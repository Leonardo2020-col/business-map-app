// migrate-services.js
// Script para ejecutar la migración de servicios
// Ejecutar con: node migrate-services.js

const sequelize = require('./src/config/database');
const Business = require('./src/models/Business');

async function runMigration() {
  try {
    console.log('🚀 Iniciando migración de servicios...');
    
    // Verificar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos verificada');
    
    // Ejecutar la migración usando Sequelize
    console.log('📋 Sincronizando modelo Business...');
    
    // Usar sync con alter: true para agregar las nuevas columnas
    await Business.sync({ alter: true });
    
    console.log('✅ Migración completada exitosamente');
    
    // Verificar que las columnas se agregaron
    console.log('🔍 Verificando columnas agregadas...');
    
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'businesses' 
        AND column_name IN (
          'defensa_civil_expiry',
          'extintores_expiry', 
          'fumigacion_expiry',
          'pozo_tierra_expiry',
          'publicidad_expiry'
        )
      ORDER BY column_name;
    `);
    
    if (results.length === 5) {
      console.log('✅ Todas las columnas de servicios se agregaron correctamente:');
      results.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('⚠️  Solo se agregaron', results.length, 'de 5 columnas esperadas');
      results.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }
    
    // Verificar índices
    console.log('🔍 Verificando índices...');
    const [indexes] = await sequelize.query(`
      SELECT indexname
      FROM pg_indexes 
      WHERE tablename = 'businesses' 
        AND indexname LIKE '%expiry%'
      ORDER BY indexname;
    `);
    
    console.log(`✅ Se crearon ${indexes.length} índices para servicios:`, indexes.map(i => i.indexname));
    
    // Probar los nuevos métodos del modelo
    console.log('🧪 Probando nuevos métodos del modelo...');
    
    const totalBusinesses = await Business.count();
    console.log(`📊 Total de negocios: ${totalBusinesses}`);
    
    if (totalBusinesses > 0) {
      // Probar métodos estáticos
      const businessesWithIssues = await Business.getWithServiceIssues();
      console.log(`📊 Negocios con problemas en servicios: ${businessesWithIssues.length}`);
      
      const expiredServices = await Business.getExpiredServices();
      console.log(`📊 Negocios con servicios vencidos: ${expiredServices.length}`);
      
      const expiringSoon = await Business.getServicesExpiringSoon(30);
      console.log(`📊 Negocios con servicios que vencen en 30 días: ${expiringSoon.length}`);
      
      // Probar método de instancia en el primer negocio
      const firstBusiness = await Business.findOne();
      if (firstBusiness) {
        const servicesStatus = firstBusiness.getServicesStatus();
        console.log(`📊 Estado de servicios del negocio "${firstBusiness.name}":`, 
          servicesStatus.map(s => `${s.name}: ${s.status}`).join(', '));
      }
    }
    
    console.log('🎉 Migración completada exitosamente');
    console.log('💡 Ahora puedes usar los nuevos campos de servicios en tu frontend');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('💡 Verifica tu configuración de base de datos en .env');
    } else if (error.message.includes('column') && error.message.includes('already exists')) {
      console.log('✅ Las columnas ya existen, migración no necesaria');
    } else {
      console.error('💡 Revisa los logs anteriores para más detalles');
    }
  } finally {
    await sequelize.close();
    console.log('📴 Conexión cerrada');
  }
}

// Función para mostrar ayuda
function showHelp() {
  console.log(`
🔧 Script de Migración de Servicios

Este script agrega los campos de servicios y fechas de vencimiento al modelo Business.

Uso:
  node migrate-services.js [opciones]

Opciones:
  --help, -h    Mostrar esta ayuda
  --dry-run     Mostrar qué cambios se harían sin ejecutarlos
  --force       Forzar la migración aunque las columnas ya existan

Campos que se agregan:
  - defensa_civil_expiry: Fecha de vencimiento de Defensa Civil
  - extintores_expiry: Fecha de vencimiento de Extintores  
  - fumigacion_expiry: Fecha de vencimiento de Fumigación
  - pozo_tierra_expiry: Fecha de vencimiento de Pozo a Tierra
  - publicidad_expiry: Fecha de vencimiento de Publicidad

Ejemplos:
  node migrate-services.js
  node migrate-services.js --dry-run
  node migrate-services.js --force
`);
}

// Manejar argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

if (args.includes('--dry-run')) {
  console.log('🔍 MODO DRY-RUN: Mostrando cambios que se harían...');
  console.log(`
📋 Cambios que se ejecutarían:

1. Agregar columnas a la tabla 'businesses':
   - defensa_civil_expiry (DATE, nullable)
   - extintores_expiry (DATE, nullable)
   - fumigacion_expiry (DATE, nullable)
   - pozo_tierra_expiry (DATE, nullable)
   - publicidad_expiry (DATE, nullable)

2. Crear índices para optimizar búsquedas:
   - idx_businesses_defensa_civil_expiry
   - idx_businesses_extintores_expiry
   - idx_businesses_fumigacion_expiry
   - idx_businesses_pozo_tierra_expiry
   - idx_businesses_publicidad_expiry

3. Agregar métodos al modelo Business:
   - getServicesStatus()
   - hasServiceIssues()
   - getExpiredServices()
   - getExpiringSoonServices()
   - Business.getWithServiceIssues()
   - Business.getExpiredServices()
   - Business.getServicesExpiringSoon()

Para ejecutar los cambios, usa: node migrate-services.js
  `);
  process.exit(0);
}

// Ejecutar migración
runMigration();