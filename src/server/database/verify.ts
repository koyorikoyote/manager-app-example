#!/usr/bin/env node

import { getDatabase, closeDatabase } from './config';

// Verify database setup and show sample data
async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database setup...');
    
    const db = await getDatabase();
    
    // Check migrations
    const migrations = await db.all('SELECT * FROM migrations ORDER BY version');
    console.log(`\n📋 Applied Migrations: ${migrations.length}`);
    migrations.forEach(m => {
      console.log(`  - Version ${m.version}: ${m.name} (${m.applied_at})`);
    });
    
    // Check users
    const users = await db.all('SELECT id, username, role, name, email FROM users');
    console.log(`\n👥 Users: ${users.length}`);
    users.forEach(u => {
      console.log(`  - ${u.username} (${u.role}): ${u.name}`);
    });
    
    // Check staff
    const staff = await db.all('SELECT id, name, nationality FROM staff');
    console.log(`\n👨‍💼 Staff Members: ${staff.length}`);
    staff.forEach(s => {
      console.log(`  - ${s.name} (${s.nationality})`);
    });
    
    // Check properties
    const properties = await db.all('SELECT id, name, type, status FROM properties');
    console.log(`\n🏢 Properties: ${properties.length}`);
    properties.forEach(p => {
      console.log(`  - ${p.name} (${p.type}, ${p.status})`);
    });
    
    // Check contracts
    const contracts = await db.all('SELECT id, title, type, status FROM contracts');
    console.log(`\n📄 Contracts: ${contracts.length}`);
    contracts.forEach(c => {
      console.log(`  - ${c.title} (${c.type}, ${c.status})`);
    });
    
    // Check interaction records
    const interactions = await db.all('SELECT id, type, date, status FROM interaction_records');
    console.log(`\n💬 Interaction Records: ${interactions.length}`);
    interactions.forEach(i => {
      console.log(`  - ${i.type} on ${i.date} (${i.status || 'no status'})`);
    });
    
    console.log('\n✅ Database verification completed successfully');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifyDatabase().catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}

export { verifyDatabase };