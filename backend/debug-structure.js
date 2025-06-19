const fs = require('fs');
const path = require('path');

console.log('=== DEBUG ESTRUCTURA BUSINESS MAP ===');
console.log('Working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('');

// Verificar archivos en raíz
console.log('📂 Archivos en raíz:');
try {
  const rootFiles = fs.readdirSync('.');
  rootFiles.forEach(file => {
    const stats = fs.statSync(file);
    console.log(`${stats.isDirectory() ? '📁' : '📄'} ${file}`);
  });
} catch (error) {
  console.log('❌ Error leyendo raíz:', error.message);
}

console.log('');

// Verificar src
console.log('📂 Contenido de src/:');
if (fs.existsSync('./src')) {
  try {
    const srcFiles = fs.readdirSync('./src');
    srcFiles.forEach(file => {
      const fullPath = path.join('./src', file);
      const stats = fs.statSync(fullPath);
      console.log(`${stats.isDirectory() ? '📁' : '📄'} src/${file}`);
      
      // Si es directorio, mostrar contenido
      if (stats.isDirectory()) {
        try {
          const subFiles = fs.readdirSync(fullPath);
          subFiles.forEach(subFile => {
            console.log(`   📄 src/${file}/${subFile}`);
          });
        } catch (err) {
          console.log(`   ❌ Error leyendo src/${file}:`, err.message);
        }
      }
    });
  } catch (error) {
    console.log('❌ Error leyendo src:', error.message);
  }
} else {
  console.log('❌ Carpeta src NO existe');
}

console.log('');

// Verificar archivos críticos
console.log('🔍 Verificando archivos críticos:');
const criticalFiles = [
  'server.js',
  'src/server.js',
  'src/config/database.js',
  'src/models/User.js',
  'src/models/Business.js',
  'src/routes/auth.js',
  'src/routes/users.js',
  'src/routes/businesses.js',
  'package.json'
];

criticalFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

console.log('');
console.log('=== FIN DEBUG ===');