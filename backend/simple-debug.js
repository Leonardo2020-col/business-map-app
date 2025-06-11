// Test simple para encontrar el archivo problemático
console.log('🔍 Testing route files individually...\n');

const testFile = (filepath, description) => {
  try {
    console.log(`Testing ${description}...`);
    require(filepath);
    console.log(`✅ ${description} - OK\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} - FAILED`);
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}\n`);
    return false;
  }
};

// Test cada archivo de rutas
testFile('./src/routes/auth.js', 'Auth routes');
testFile('./src/routes/businesses.js', 'Business routes');  
testFile('./src/routes/users.js', 'User routes');
testFile('./src/routes/admin/users.js', 'Admin routes');

console.log('🏁 Done');