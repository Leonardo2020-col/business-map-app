const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración del frontend...\n');

// Rutas del frontend - ajustar según tu estructura
const frontendPath = path.join(__dirname, '../../../business-map-app/frontend');
const distPath = path.join(frontendPath, 'dist');

// Si no existe, probar rutas alternativas
let actualFrontendPath = frontendPath;
const alternativePaths = [
  path.join(__dirname, '../../frontend'),
  path.join(__dirname, '../frontend'),
  path.join(__dirname, '../../../../business-map-app/frontend')
];

if (!fs.existsSync(frontendPath)) {
  console.log('❌ Ruta principal no encontrada, probando alternativas...');
  
  for (const altPath of alternativePaths) {
    console.log(`🔍 Probando: ${altPath}`);
    if (fs.existsSync(altPath)) {
      actualFrontendPath = altPath;
      console.log(`✅ Frontend encontrado en: ${altPath}`);
      break;
    }
  }
}

const frontendPathToUse = actualFrontendPath;
const distPathToUse = path.join(frontendPathToUse, 'dist');

console.log(`📁 Frontend path: ${frontendPathToUse}`);
console.log(`📁 Dist path: ${distPathToUse}`);

// Verificar archivos de configuración del frontend
const configFiles = [
  'package.json',
  '.env',
  '.env.local',
  '.env.production',
  'vite.config.js',
  'vite.config.ts',
  'src/config/api.js',
  'src/config/config.js',
  'src/services/api.js',
  'src/utils/api.js'
];

console.log('\n🔍 Buscando archivos de configuración...\n');

configFiles.forEach(file => {
  const filePath = path.join(frontendPathToUse, file);
  console.log(`📄 ${file}:`);
  
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ Existe`);
    
    // Leer contenido relevante
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Buscar URLs o configuraciones de API
      const apiUrls = content.match(/(https?:\/\/[^\s"']+|localhost:\d+|127\.0\.0\.1:\d+)/g);
      if (apiUrls) {
        console.log(`   🔗 URLs encontradas:`, apiUrls);
      }
      
      // Buscar variables de entorno
      const envVars = content.match(/(VITE_|REACT_APP_|NEXT_PUBLIC_)[A-Z_]+/g);
      if (envVars) {
        console.log(`   🔧 Variables de entorno:`, [...new Set(envVars)]);
      }
      
      // Si es package.json, mostrar scripts
      if (file === 'package.json') {
        try {
          const pkg = JSON.parse(content);
          console.log(`   📦 Scripts:`, Object.keys(pkg.scripts || {}));
          if (pkg.dependencies) {
            const apiLibs = Object.keys(pkg.dependencies).filter(dep => 
              dep.includes('axios') || dep.includes('fetch') || dep.includes('api')
            );
            if (apiLibs.length > 0) {
              console.log(`   📚 Librerías de API:`, apiLibs);
            }
          }
        } catch (e) {
          console.log(`   ⚠️ Error parseando JSON`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error leyendo archivo: ${error.message}`);
    }
  } else {
    console.log(`   ❌ No existe`);
  }
  
  console.log('');
});

// Verificar estructura del src
const srcPath = path.join(frontendPathToUse, 'src');
if (fs.existsSync(srcPath)) {
  console.log('\n📁 Estructura de src:');
  try {
    const srcFiles = fs.readdirSync(srcPath);
    srcFiles.forEach(file => {
      const filePath = path.join(srcPath, file);
      const stat = fs.statSync(filePath);
      console.log(`   ${stat.isDirectory() ? '📁' : '📄'} ${file}`);
    });
  } catch (error) {
    console.log(`   ❌ Error leyendo src: ${error.message}`);
  }
}

// Verificar si hay archivos que hagan requests HTTP
console.log('\n🔍 Buscando archivos que hagan peticiones HTTP...\n');

function searchForApiCalls(dir, level = 0) {
  if (level > 2) return; // Limitar profundidad
  
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
        searchForApiCalls(filePath, level + 1);
      } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.tsx')) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Buscar patrones de peticiones HTTP
          const patterns = [
            /fetch\s*\(/g,
            /axios\./g,
            /\/api\//g,
            /login|auth/gi
          ];
          
          let hasApiCalls = false;
          patterns.forEach(pattern => {
            if (pattern.test(content)) {
              hasApiCalls = true;
            }
          });
          
          if (hasApiCalls) {
            console.log(`📄 ${filePath.replace(frontendPathToUse, '')}`);
            
            // Extraer URLs específicas
            const urls = content.match(/(https?:\/\/[^\s"'`]+|\/api\/[^\s"'`]+)/g);
            if (urls) {
              console.log(`   🔗 URLs:`, [...new Set(urls)]);
            }
          }
          
        } catch (error) {
          // Ignorar errores de lectura
        }
      }
    });
  } catch (error) {
    // Ignorar errores de directorio
  }
}

searchForApiCalls(srcPath);

console.log('\n🏁 Verificación completada');
console.log('\n💡 Para resolver el problema:');
console.log('1. Verifica que el frontend esté usando la URL correcta para el backend');
console.log('2. Asegúrate de que las variables de entorno estén configuradas');
console.log('3. Revisa la consola del navegador para ver errores específicos');