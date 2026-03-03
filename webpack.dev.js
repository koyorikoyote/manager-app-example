const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: './dist/client',
    hot: true,
    port: 3000,
    host: '0.0.0.0', // Allow external connections (required for emulators)
    allowedHosts: 'all', // Disable host check
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'],
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        ws: true,
        secure: false,
        timeout: 10000, // 10 second timeout
        retry: true,
        retryDelay: 2000, // 2 second delay between retries
        onError: (err, req, res) => {
          console.error('\n❌ Proxy Error: Cannot connect to backend server');
          console.error('🔧 Make sure the server is running with: npm run dev:server');
          console.error('📍 Server should be available at: http://127.0.0.1:3001');
          console.error('🔍 Check server status at: http://127.0.0.1:3001/api/health');
          console.error('💡 Use "npm run dev" to start both server and client together\n');

          res.writeHead(503, {
            'Content-Type': 'text/html',
          });
          res.end(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Backend Server Not Available</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .error { color: #e74c3c; font-size: 24px; margin: 20px 0; }
                .info { color: #666; margin: 15px 0; line-height: 1.6; }
                .command { background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; margin: 10px 0; }
                .button { display: inline-block; background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px; }
                .button:hover { background: #2980b9; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🔌 Backend Server Not Available</h1>
                <div class="error">Cannot connect to development server</div>
                <div class="info">The backend server needs to be running for the application to work properly.</div>
                
                <h3>Quick Fix:</h3>
                <div class="info">Run this command in your terminal:</div>
                <div class="command">npm run dev</div>
                <div class="info">This will start both the server and client together.</div>
                
                <h3>Alternative:</h3>
                <div class="info">Start the server separately:</div>
                <div class="command">npm run dev:server</div>
                <div class="info">Then refresh this page.</div>
                
                <div style="margin-top: 30px;">
                  <a href="javascript:location.reload()" class="button">🔄 Refresh Page</a>
                  <a href="http://127.0.0.1:3001/api/health" class="button" target="_blank">🔍 Check Server</a>
                </div>
              </div>
            </body>
            </html>
          `);
        },
        onProxyReq: (proxyReq, req, res) => {
          // Log proxy requests in development for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 Proxying ${req.method} ${req.url} to http://127.0.0.1:3001${req.url}`);
          }
        }
      },
    ],
  },
  output: {
    filename: '[name].bundle.js',
    path: require('path').resolve(__dirname, 'dist/client'),
    clean: true,
    publicPath: '/',
  },
});
