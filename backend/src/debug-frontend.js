const path = require('path');
const fs = require('fs');

console.log('🔍 Verificando archivos del frontend...\n');

// Directorio actual
console.log('📁 Directorio actual:', __dirname);

// Posibles ubicaciones del frontend
const possiblePaths = [
  path.join(__dirname, '../frontend/dist'),
  path.join(__dirname, '../../frontend/dist'),
  path.join(__dirname, './frontend/dist'),
  path.join(__dirname, './dist'),
  path.join(__dirname, '../dist'),
  path.join(__dirname, './public'),
  path.join(__dirname, '../public')
];

console.log('🔍 Verificando posibles ubicaciones...\n');

possiblePaths.forEach((testPath, index) => {
  console.log(`${index + 1}. ${testPath}`);
  
  if (fs.existsSync(testPath)) {
    console.log('   ✅ EXISTE');
    
    // Listar contenido
    try {
      const files = fs.readdirSync(testPath);
      console.log('   📋 Archivos:', files.slice(0, 5).join(', ') + (files.length > 5 ? '...' : ''));
      
      // Verificar index.html
      const indexPath = path.join(testPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        console.log('   ✅ index.html encontrado');
      } else {
        console.log('   ❌ index.html NO encontrado');
      }
    } catch (error) {
      console.log('   ❌ Error leyendo directorio:', error.message);
    }
  } else {
    console.log('   ❌ No existe');
  }
  
  console.log('');
});

// Verificar estructura del proyecto
console.log('📁 Estructura del proyecto:');
try {
  const rootFiles = fs.readdirSync(__dirname);
  console.log('Archivos en backend/src:', rootFiles);
  
  const parentDir = path.join(__dirname, '..');
  if (fs.existsSync(parentDir)) {
    const parentFiles = fs.readdirSync(parentDir);
    console.log('Archivos en backend:', parentFiles);
    
    const projectRoot = path.join(__dirname, '../..');
    if (fs.existsSync(projectRoot)) {
      const projectFiles = fs.readdirSync(projectRoot);
      console.log('Archivos en raíz del proyecto:', projectFiles);
    }
  }
} catch (error) {
  console.error('Error explorando estructura:', error.message);
}

console.log('\n🏁 Verificación completada');