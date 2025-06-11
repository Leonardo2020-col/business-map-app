// Script para probar importaciones una por una
console.log('🔍 Probando importaciones...');

// Test 1: Database config
try {
  console.log('1. Testing database config...');
  const database = require('./src/config/database');
  console.log('✅ Database config: OK');
} catch (error) {
  console.error('❌ Database config failed:', error.message);
}

// Test 2: User model
try {
  console.log('2. Testing User model...');
  const User = require('./src/models/User');
  console.log('✅ User model: OK');
} catch (error) {
  console.error('❌ User model failed:', error.message);
}

// Test 3: Business model
try {
  console.log('3. Testing Business model...');
  const Business = require('./src/models/Business');
  console.log('✅ Business model: OK');
} catch (error) {
  console.error('❌ Business model failed:', error.message);
}

// Test 4: Auth middleware
try {
  console.log('4. Testing auth middleware...');
  const auth = require('./src/middleware/auth');
  console.log('✅ Auth middleware: OK');
} catch (error) {
  console.error('❌ Auth middleware failed:', error.message);
}

// Test 5: Permissions middleware
try {
  console.log('5. Testing permissions middleware...');
  const permissions = require('./src/middleware/permissions');
  console.log('✅ Permissions middleware: OK');
} catch (error) {
  console.error('❌ Permissions middleware failed:', error.message);
}

// Test 6: Auth routes
try {
  console.log('6. Testing auth routes...');
  const authRoutes = require('./src/routes/auth');
  console.log('✅ Auth routes: OK');
} catch (error) {
  console.error('❌ Auth routes failed:', error.message);
  console.error('Stack:', error.stack);
}

// Test 7: Business routes
try {
  console.log('7. Testing business routes...');
  const businessRoutes = require('./src/routes/businesses');
  console.log('✅ Business routes: OK');
} catch (error) {
  console.error('❌ Business routes failed:', error.message);
  console.error('Stack:', error.stack);
}

// Test 8: User routes
try {
  console.log('8. Testing user routes...');
  const userRoutes = require('./src/routes/users');
  console.log('✅ User routes: OK');
} catch (error) {
  console.error('❌ User routes failed:', error.message);
  console.error('Stack:', error.stack);
}

// Test 9: Admin routes
try {
  console.log('9. Testing admin routes...');
  const adminRoutes = require('./src/routes/admin/users');
  console.log('✅ Admin routes: OK');
} catch (error) {
  console.error('❌ Admin routes failed:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\n🏁 Test completado');