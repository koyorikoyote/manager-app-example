const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function safePrismaGenerate() {
  console.log('🔧 Safely generating Prisma client...');

  const prismaPath = path.join(__dirname, '..', 'node_modules', '.prisma');

  // Check if Prisma client already exists and is working
  try {
    if (fs.existsSync(prismaPath)) {
      // Try to import the existing client
      const { PrismaClient } = require('@prisma/client');
      console.log('✅ Existing Prisma client is working');
      return;
    }
  } catch (error) {
    console.log('⚠️ Existing Prisma client has issues, regenerating...');
  }

  // Remove existing Prisma client if it exists
  if (fs.existsSync(prismaPath)) {
    try {
      fs.rmSync(prismaPath, { recursive: true, force: true });
      console.log('🗑️ Removed existing Prisma client');
    } catch (error) {
      console.log('⚠️ Could not remove existing Prisma client, continuing...');
    }
  }

  // Wait a moment for file system to settle
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate new Prisma client
  return new Promise((resolve, reject) => {
    const generateProcess = spawn('npx', ['prisma', 'generate'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        PRISMA_CLI_BINARY_TARGETS: 'native'
      }
    });

    generateProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Prisma client generated successfully');
        resolve();
      } else {
        console.error('❌ Prisma client generation failed');
        reject(new Error('Prisma generation failed'));
      }
    });

    generateProcess.on('error', (error) => {
      console.error('❌ Error starting Prisma generation:', error);
      reject(error);
    });
  });
}

// Run if called directly
if (require.main === module) {
  safePrismaGenerate().catch(error => {
    console.error('Failed to generate Prisma client:', error);
    process.exit(1);
  });
}

module.exports = safePrismaGenerate;