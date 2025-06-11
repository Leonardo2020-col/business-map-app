const fs = require('fs');
const path = require('path');

console.log('🔍 Buscando todos los usos de useAuth...\n');

// Probar múltiples rutas posibles
const possiblePaths = [
  path.join(__dirname, '../business-map-app/frontend/src'),
  path.join(__dirname, '../../frontend/src'),
  path.join(__dirname, '../frontend/src'),
  path.join(__dirname, './src')
];

let frontendPath = null;

for (const testPath of possiblePaths) {
  console.log(`🔍 Probando: ${testPath}`);
  if (fs.existsSync(testPath)) {
    frontendPath = testPath;
    console.log(`✅ Encontrado en: ${testPath}\n`);
    break;
  } else {
    console.log(`❌ No existe\n`);
  }
}

function searchInFile(filePath, fileName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('useAuth')) {
      console.log(`📄 ${fileName}:`);
      
      // Buscar imports de useAuth
      const importMatches = content.match(/import.*useAuth.*from.*['"`].*['"`]/g);
      if (importMatches) {
        importMatches.forEach(match => {
          console.log(`   📥 Import: ${match}`);
        });
      }
      
      // Buscar usos de useAuth
      const useMatches = content.match(/const.*=.*useAuth\(\)/g);
      if (useMatches) {
        useMatches.forEach(match => {
          console.log(`   🔧 Uso: ${match}`);
        });
      }
      
      // Mostrar líneas donde aparece useAuth
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('useAuth') && !line.trim().startsWith('//')) {
          console.log(`   ${index + 1}: ${line.trim()}`);
        }
      });
      
      console.log('');
    }
  } catch (error) {
    // Ignorar errores de lectura
  }
}

function searchInDirectory(dir, level = 0) {
  if (level > 5) return; // Evitar recursión infinita
  
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
        searchInDirectory(filePath, level + 1);
      } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
        const relativePath = path.relative(frontendPath, filePath);
        searchInFile(filePath, relativePath);
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
}

console.log(`Buscando en: ${frontendPath}\n`);

if (frontendPath && fs.existsSync(frontendPath)) {
  searchInDirectory(frontendPath);
} else {
  console.error('❌ Directorio frontend/src no encontrado');
}

console.log('🏁 Búsqueda completada');
console.log('\n💡 Acción necesaria:');
console.log('- Verificar que todos los archivos que usan useAuth lo importen correctamente');
console.log('- El import correcto es: import { useAuth } from "../../contexts/AuthContext"');