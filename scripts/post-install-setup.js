const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function postInstallSetup() {
    console.log('🚀 Running post-install setup for Manager App...');

    try {
        // 1. Generate Prisma client
        console.log('📦 Generating Prisma client...');
        await runCommand('npx', ['prisma', 'generate']);
        
        // Verify Prisma client was generated
        try {
            require('@prisma/client');
            console.log('✅ Prisma client verified and ready');
        } catch (error) {
            console.log('⚠️ Prisma client generation may have issues:', error.message);
        }

        // 2. Check if .env file exists
        const envPath = path.join(__dirname, '..', '.env');
        if (!fs.existsSync(envPath)) {
            console.log('⚠️ No .env file found. Creating from template...');
            const envTemplate = `# Database Configuration
DATABASE_URL="mysql://root:root@localhost:3307/manager_app_db"

# JWT Configuration
JWT_SECRET="cd82b70a71feb5d5726ea2b48e4530203c7c47343aefbb38428e305aaa0bfaf16c51719e2fc9f949e1fb03d0431c2c0231f55356a2a66754d5303af3176d61ea"
JWT_EXPIRES_IN="24h"

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN="http://localhost:3000"

# Windows-specific optimizations
PRISMA_CLI_BINARY_TARGETS=native,windows
PRISMA_ENGINE_TYPE=library

# Development settings
WEBPACK_DEV_SERVER_PORT=3000
PRISMA_STUDIO_PORT=5555

# Performance settings for Windows
UV_THREADPOOL_SIZE=16
NODE_OPTIONS=--max-old-space-size=4096
`;
            fs.writeFileSync(envPath, envTemplate);
            console.log('✅ Created .env file with default configuration');
        }



        console.log('\n✅ Post-install setup completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('   1. Ensure MySQL is running on localhost:3307');
        console.log('   2. Run database migrations: npm run prisma:migrate');
        console.log('   3. Start development: npm run dev');

    } catch (error) {
        console.error('❌ Post-install setup failed:', error.message);
        console.log('\n🔧 Manual setup required:');
        console.log('   1. npm run prisma:generate');
        console.log('   2. npm run prisma:migrate');
        console.log('   3. npm run dev');
    }
}



function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true,
            ...options
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });

        child.on('error', (error) => {
            reject(error);
        });
    });
}

// Run if called directly
if (require.main === module) {
    postInstallSetup().catch(error => {
        console.error('Setup failed:', error);
        process.exit(1);
    });
}

module.exports = postInstallSetup;