const http = require('http');

function checkServer() {
  console.log('\n🔍 Checking if development server is running...');
  
  const options = {
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/health',
    method: 'GET',
    timeout: 2000
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Development server is already running on http://127.0.0.1:3001');
      console.log('🌐 You can start the client with: npm run dev:client');
    } else {
      console.log('⚠️ Server responded but may not be healthy');
      showStartupInstructions();
    }
  });

  req.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
      console.log('❌ Development server is not running');
      showStartupInstructions();
    } else {
      console.log('⚠️ Error checking server:', err.message);
      showStartupInstructions();
    }
  });

  req.on('timeout', () => {
    console.log('⚠️ Server check timed out');
    showStartupInstructions();
  });

  req.end();
}

function showStartupInstructions() {
  console.log('\n📋 To start the development environment:');
  console.log('   npm run dev        # Start both server and client');
  console.log('   npm run dev:server # Start server only');
  console.log('   npm run dev:client # Start client only');
  console.log('\n💡 The server must be running on port 3001 for the client proxy to work.');
  console.log('🔧 Use "npm run dev" to start both server and client together.');
}

// Run if called directly
if (require.main === module) {
  checkServer();
}

module.exports = checkServer;