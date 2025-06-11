// Script para probar la API de login directamente
const https = require('https');
const http = require('http');

// Configurar la URL de tu API
const API_URL = 'https://business-map-app-production.up.railway.app'; // Cambiar por tu URL
// const API_URL = 'http://localhost:5000'; // Para desarrollo local

async function testLogin(username, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      username: username,
      password: password
    });

    const url = new URL('/api/auth/login', API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const protocol = url.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData,
            error: 'No es JSON válido'
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Función principal
async function runTests() {
  console.log('🔍 Probando API de login...\n');
  
  // Test 1: Health check
  console.log('1. Verificando health check...');
  try {
    const healthResponse = await testHealthCheck();
    console.log('✅ Health check:', healthResponse.status, healthResponse.data);
  } catch (error) {
    console.error('❌ Health check falló:', error.message);
  }
  
  console.log('\n2. Probando login con credenciales válidas...');
  
  // Test 2: Login con credenciales comunes
  const testCredentials = [
    { username: 'admin', password: 'admin123' },
    { username: 'admin', password: 'admin' },
    { username: 'user', password: 'user123' },
    { username: 'test', password: 'test123' }
  ];
  
  for (const creds of testCredentials) {
    try {
      console.log(`\nProbando: ${creds.username} / ${creds.password}`);
      const response = await testLogin(creds.username, creds.password);
      
      console.log(`Status: ${response.status}`);
      console.log(`Response:`, JSON.stringify(response.data, null, 2));
      
      if (response.status === 200 && response.data.success) {
        console.log('✅ Login exitoso!');
        console.log('🔑 Token recibido:', response.data.data?.token ? 'SÍ' : 'NO');
        break;
      } else {
        console.log('❌ Login falló');
      }
    } catch (error) {
      console.error(`❌ Error probando ${creds.username}:`, error.message);
    }
  }
  
  console.log('\n3. Probando login con credenciales inválidas...');
  try {
    const response = await testLogin('invalid', 'invalid');
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Helper para health check
async function testHealthCheck() {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/health', API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET'
    };

    const protocol = url.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Ejecutar tests
runTests().catch(console.error);