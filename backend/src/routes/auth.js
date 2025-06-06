const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Función para generar JWT
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Función para sanitizar datos del usuario
const sanitizeUser = (user) => {
  const { password, ...userWithoutPassword } = user.toJSON();
  return userWithoutPassword;
};

// Función para validar formato de username
const isValidUsername = (username) => {
  // Solo letras, números y guiones bajos, 3-20 caracteres
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// GET /api/auth/debug - Endpoint para debugging (SOLO DESARROLLO)
router.get('/debug', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: 'Not found' });
    }

    console.log('🐛 Debug endpoint called');
    
    // Listar todos los usuarios
    const users = await User.findAll({
      attributes: ['id', 'username', 'role', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    
    console.log('📋 Usuarios encontrados en base de datos:');
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Username: ${user.username}, Role: ${user.role}`);
    });
    
    // Información de la base de datos
    const userCount = await User.count();
    
    // Verificar estructura de tabla
    const sequelize = require('../config/database');
    const tableInfo = await sequelize.query(
      "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position",
      { type: sequelize.QueryTypes.SELECT }
    );

    res.json({
      success: true,
      debug: {
        totalUsers: userCount,
        users: users.map(u => ({
          id: u.id,
          username: u.username,
          role: u.role,
          created_at: u.created_at
        })),
        tableStructure: tableInfo,
        sequelizeModel: {
          tableName: User.tableName,
          timestamps: User.options.timestamps,
          attributes: Object.keys(User.rawAttributes)
        },
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET'
        }
      }
    });
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

// POST /api/auth/test-password - Endpoint para probar passwords (SOLO DESARROLLO)
router.post('/test-password', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: 'Not found' });
    }

    const { username, password } = req.body;
    
    console.log('🧪 Testing password for:', username);
    
    // Buscar el usuario
    const user = await User.findOne({ 
      where: { username: username.toLowerCase() } 
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Mostrar información del usuario
    console.log('👤 User info:', {
      id: user.id,
      username: user.username,
      role: user.role,
      passwordLength: user.password?.length,
      passwordStart: user.password?.substring(0, 10) + '...'
    });
    
    // Generar nuevo hash con la password proporcionada
    const newHash = await bcrypt.hash(password, 12);
    console.log('🔑 Generated hash:', newHash);
    
    // Comparar password con hash actual
    const isCurrentMatch = await bcrypt.compare(password, user.password);
    console.log('🔍 Current password match:', isCurrentMatch);
    
    // Comparar password con hash conocido de admin123
    const knownAdminHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewJDMzOMzQlCLZ/y';
    const isKnownHashMatch = await bcrypt.compare(password, knownAdminHash);
    console.log('🔍 Known hash match:', isKnownHashMatch);
    
    // Probar diferentes contraseñas comunes
    const testPasswords = ['admin123', 'admin', 'password', '123456', 'user123'];
    const testResults = {};
    
    for (const testPass of testPasswords) {
      const match = await bcrypt.compare(testPass, user.password);
      testResults[testPass] = match;
      if (match) {
        console.log(`✅ MATCH FOUND: "${testPass}" works for user ${username}`);
      }
    }
    
    res.json({
      success: true,
      debug: {
        username: user.username,
        role: user.role,
        passwordInDB: {
          length: user.password.length,
          start: user.password.substring(0, 10) + '...',
          full: user.password // SOLO para debugging
        },
        testedPassword: password,
        newGeneratedHash: newHash,
        currentPasswordMatch: isCurrentMatch,
        knownHashMatch: isKnownHashMatch,
        testResults: testResults,
        workingPasswords: Object.entries(testResults)
          .filter(([pass, works]) => works)
          .map(([pass, works]) => pass)
      }
    });
    
  } catch (error) {
    console.error('❌ Test password error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/auth/reset-password - Endpoint para resetear password (SOLO DESARROLLO)  
router.post('/reset-password', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: 'Not found' });
    }

    const { username, newPassword } = req.body;
    
    console.log('🔄 Resetting password for:', username);
    
    // Buscar el usuario
    const user = await User.findOne({ 
      where: { username: username.toLowerCase() } 
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Generar nuevo hash
    const newHash = await bcrypt.hash(newPassword, 12);
    console.log('🔑 New hash generated:', newHash);
    
    // Actualizar en base de datos
    await user.update({ password: newHash });
    
    console.log('✅ Password updated in database');
    
    // Verificar que funciona
    const testMatch = await bcrypt.compare(newPassword, newHash);
    
    res.json({
      success: true,
      message: `Password actualizado para ${username}`,
      debug: {
        username: user.username,
        newPassword: newPassword,
        newHash: newHash,
        testMatch: testMatch
      }
    });
    
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/auth/emergency-setup - Crear usuarios de emergencia (SOLO DESARROLLO)
router.post('/emergency-setup', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: 'Not found' });
    }

    console.log('🚨 Emergency setup initiated');
    
    const emergencyUsers = [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'user', password: 'user123', role: 'user' },
      { username: 'test_admin', password: 'test123', role: 'admin' },
      { username: 'test_user', password: 'test123', role: 'user' }
    ];

    const results = [];

    for (const userData of emergencyUsers) {
      try {
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ 
          where: { username: userData.username } 
        });

        if (existingUser) {
          // Si existe, actualizar su password
          const hashedPassword = await bcrypt.hash(userData.password, 12);
          await existingUser.update({ password: hashedPassword, role: userData.role });
          
          console.log(`🔄 Updated existing user: ${userData.username}`);
          results.push({
            username: userData.username,
            action: 'updated',
            success: true
          });
        } else {
          // Si no existe, crearlo
          const hashedPassword = await bcrypt.hash(userData.password, 12);
          const newUser = await User.create({
            username: userData.username,
            password: hashedPassword,
            role: userData.role
          });
          
          console.log(`➕ Created new user: ${userData.username}`);
          results.push({
            username: userData.username,
            action: 'created',
            success: true,
            id: newUser.id
          });
        }
        
        // Verificar que la password funciona
        const user = await User.findOne({ where: { username: userData.username } });
        const passwordWorks = await bcrypt.compare(userData.password, user.password);
        results[results.length - 1].passwordVerified = passwordWorks;
        
      } catch (error) {
        console.error(`❌ Error with user ${userData.username}:`, error);
        results.push({
          username: userData.username,
          action: 'failed',
          success: false,
          error: error.message
        });
      }
    }

    // Verificar el estado final
    const finalUsers = await User.findAll({
      attributes: ['id', 'username', 'role', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      message: 'Emergency setup completed',
      results: results,
      finalUsers: finalUsers.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role
      })),
      credentials: [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'user', password: 'user123', role: 'user' },
        { username: 'test_admin', password: 'test123', role: 'admin' },
        { username: 'test_user', password: 'test123', role: 'user' }
      ]
    });

  } catch (error) {
    console.error('❌ Emergency setup error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

// GET /api/auth/verify-all-users - Verificar que todos los usuarios pueden hacer login
router.get('/verify-all-users', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: 'Not found' });
    }

    console.log('🔍 Verifying all users can login');
    
    const users = await User.findAll({
      attributes: ['id', 'username', 'role']
    });

    const testCredentials = [
      { username: 'admin', password: 'admin123' },
      { username: 'user', password: 'user123' },
      { username: 'test_admin', password: 'test123' },
      { username: 'test_user', password: 'test123' }
    ];

    const verificationResults = [];

    for (const user of users) {
      const credential = testCredentials.find(c => c.username === user.username);
      
      if (credential) {
        try {
          const dbUser = await User.findOne({ where: { username: user.username } });
          const passwordWorks = await bcrypt.compare(credential.password, dbUser.password);
          
          verificationResults.push({
            username: user.username,
            role: user.role,
            expectedPassword: credential.password,
            passwordWorks: passwordWorks,
            status: passwordWorks ? 'OK' : 'FAILED'
          });
          
          console.log(`${passwordWorks ? '✅' : '❌'} ${user.username}: ${passwordWorks ? 'OK' : 'FAILED'}`);
        } catch (error) {
          verificationResults.push({
            username: user.username,
            role: user.role,
            expectedPassword: credential.password,
            passwordWorks: false,
            status: 'ERROR',
            error: error.message
          });
        }
      } else {
        verificationResults.push({
          username: user.username,
          role: user.role,
          expectedPassword: 'UNKNOWN',
          passwordWorks: false,
          status: 'NO_TEST_CREDENTIAL'
        });
      }
    }

    const workingUsers = verificationResults.filter(r => r.passwordWorks);
    const failedUsers = verificationResults.filter(r => !r.passwordWorks);

    res.json({
      success: true,
      summary: {
        total: verificationResults.length,
        working: workingUsers.length,
        failed: failedUsers.length
      },
      workingUsers: workingUsers,
      failedUsers: failedUsers,
      allResults: verificationResults
    });

  } catch (error) {
    console.error('❌ Verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/auth/register - Registro de usuarios (solo para desarrollo)
router.post('/register', async (req, res) => {
  try {
    const { username, password, role = 'user' } = req.body;

    console.log('📝 Register attempt:', { 
      username, 
      role,
      hasPassword: !!password 
    });

    // Validaciones básicas
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username y password son requeridos',
        error: 'MISSING_FIELDS'
      });
    }

    // Validar formato de username
    if (!isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        message: 'El username debe tener entre 3-20 caracteres y solo contener letras, números y guiones bajos',
        error: 'INVALID_USERNAME_FORMAT'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres',
        error: 'PASSWORD_TOO_SHORT'
      });
    }

    // Validar rol
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido. Debe ser "user" o "admin"',
        error: 'INVALID_ROLE'
      });
    }

    // Verificar si el usuario ya existe (case insensitive)
    const existingUser = await User.findOne({ 
      where: { 
        username: username.toLowerCase() 
      } 
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe',
        error: 'USER_EXISTS'
      });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear el usuario
    const user = await User.create({
      username: username.toLowerCase(),
      password: hashedPassword,
      role
    });

    console.log('✅ Usuario creado exitosamente:', user.username);

    // Generar token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('❌ Error en registro:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        error: 'VALIDATION_ERROR',
        details: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe',
        error: 'USER_EXISTS'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/auth/login - Inicio de sesión
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('🔐 Login attempt:', { 
      username, 
      hasPassword: !!password,
      passwordLength: password?.length,
      timestamp: new Date().toISOString()
    });

    // Validaciones básicas
    if (!username || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Username y password son requeridos',
        error: 'MISSING_CREDENTIALS'
      });
    }

    // Buscar el usuario (case insensitive)
    console.log(`🔍 Searching for user: "${username}" (lowercase: "${username.toLowerCase()}")`);
    
    const user = await User.findOne({ 
      where: { 
        username: username.toLowerCase() 
      } 
    });
    
    if (!user) {
      console.log(`❌ User not found: ${username}`);
      
      // Para debugging, mostrar qué usuarios existen
      const allUsers = await User.findAll({
        attributes: ['id', 'username', 'role']
      });
      
      console.log('👥 Available users in database:');
      allUsers.forEach(u => {
        console.log(`  - ${u.username} (${u.role})`);
      });
      
      return res.status(400).json({
        success: false,
        message: 'Credenciales inválidas',
        error: 'INVALID_CREDENTIALS'
      });
    }

    console.log(`✅ User found: ${user.username} (ID: ${user.id}, Role: ${user.role})`);

    // Verificar la contraseña
    console.log('🔑 Checking password...');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log(`❌ Password mismatch for user: ${username}`);
      return res.status(400).json({
        success: false,
        message: 'Credenciales inválidas',
        error: 'INVALID_CREDENTIALS'
      });
    }

    console.log(`✅ Password correct for user: ${username}`);

    // Generar token
    console.log('🎫 Generating JWT token...');
    const token = generateToken(user);

    console.log(`🎉 Login successful for user: ${username}`);

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/auth/verify - Verificar token
router.get('/verify', auth, async (req, res) => {
  try {
    console.log('🔍 Token verification for user:', req.user.username);
    // El middleware auth ya verificó el token y añadió req.user
    res.json({
      success: true,
      message: 'Token válido',
      user: sanitizeUser(req.user)
    });
  } catch (error) {
    console.error('❌ Error en verificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/auth/profile - Obtener perfil del usuario
router.get('/profile', auth, async (req, res) => {
  try {
    console.log('👤 Profile request for user:', req.user.username);
    
    // Obtener datos frescos del usuario desde la DB
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Perfil obtenido exitosamente',
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('❌ Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/auth/profile - Actualizar perfil del usuario
router.put('/profile', auth, async (req, res) => {
  try {
    const { username } = req.body;

    console.log('✏️ Profile update for user:', req.user.username, 'new username:', username);

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username es requerido',
        error: 'MISSING_USERNAME'
      });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        message: 'El username debe tener entre 3-20 caracteres y solo contener letras, números y guiones bajos',
        error: 'INVALID_USERNAME_FORMAT'
      });
    }

    // Verificar si el username ya existe (excluyendo el usuario actual)
    const existingUser = await User.findOne({
      where: {
        username: username.toLowerCase(),
        id: { [require('sequelize').Op.ne]: req.user.id }
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El username ya está en uso',
        error: 'USERNAME_TAKEN'
      });
    }

    // Actualizar el usuario
    await req.user.update({ 
      username: username.toLowerCase() 
    });

    // Obtener datos actualizados
    const updatedUser = await User.findByPk(req.user.id);

    console.log('✅ Profile updated successfully for user:', updatedUser.username);

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: sanitizeUser(updatedUser)
    });
  } catch (error) {
    console.error('❌ Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/auth/change-password - Cambiar contraseña
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    console.log('🔒 Password change request for user:', req.user.username);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva contraseña son requeridas',
        error: 'MISSING_PASSWORDS'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres',
        error: 'PASSWORD_TOO_SHORT'
      });
    }

    // Verificar que la nueva contraseña sea diferente
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe ser diferente a la actual',
        error: 'SAME_PASSWORD'
      });
    }

    // Verificar contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, req.user.password);
    if (!isMatch) {
      console.log('❌ Current password incorrect for user:', req.user.username);
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual incorrecta',
        error: 'WRONG_CURRENT_PASSWORD'
      });
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña
    await req.user.update({ password: hashedPassword });

    console.log('✅ Password updated successfully for user:', req.user.username);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/auth/logout - Cerrar sesión (opcional, para logs)
router.post('/logout', auth, async (req, res) => {
  try {
    // En un sistema stateless con JWT, el logout es principalmente del lado del cliente
    // Aquí puedes agregar lógica adicional como logging o blacklist de tokens
    
    console.log(`👋 Usuario ${req.user.username} cerró sesión`);
    
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;