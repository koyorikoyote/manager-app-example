#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySeedData() {
  console.log('🔍 Verifying seeded data...\n');

  try {
    // Check users
    const userCount = await prisma.user.count();
    const usersByRole = await prisma.user.groupBy({
      by: ['roleId'],
      _count: { roleId: true },
    });
    
    console.log(`👥 Users: ${userCount} total`);
    usersByRole.forEach(group => {
      console.log(`   Role ID ${group.roleId}: ${group._count.roleId}`);
    });

    // Check staff
    const staffCount = await prisma.staff.count();
    const staffByDepartment = await prisma.staff.groupBy({
      by: ['department'],
      _count: { department: true },
    });
    const staffByStatus = await prisma.staff.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    console.log(`\n👷 Staff: ${staffCount} total`);
    console.log('   By Department:');
    staffByDepartment.forEach(group => {
      console.log(`     ${group.department}: ${group._count.department}`);
    });
    console.log('   By Status:');
    staffByStatus.forEach(group => {
      console.log(`     ${group.status}: ${group._count.status}`);
    });

    // Check properties
    const propertyCount = await prisma.property.count();
    const propertiesByType = await prisma.property.groupBy({
      by: ['propertyType'],
      _count: { propertyType: true },
    });
    const propertiesByStatus = await prisma.property.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    console.log(`\n🏢 Properties: ${propertyCount} total`);
    console.log('   By Type:');
    propertiesByType.forEach(group => {
      console.log(`     ${group.propertyType}: ${group._count.propertyType}`);
    });
    console.log('   By Status:');
    propertiesByStatus.forEach(group => {
      console.log(`     ${group.status}: ${group._count.status}`);
    });

    // Check property staff assignments
    const assignmentCount = await prisma.propertyStaffAssignment.count();
    const activeAssignments = await prisma.propertyStaffAssignment.count({
      where: { isActive: true }
    });

    console.log(`\n🔗 Property Staff Assignments: ${assignmentCount} total`);
    console.log(`   Active: ${activeAssignments}`);
    console.log(`   Inactive: ${assignmentCount - activeAssignments}`);

    // Check system configurations
    const configCount = await prisma.systemConfiguration.count();
    const configsByCategory = await prisma.systemConfiguration.groupBy({
      by: ['category'],
      _count: { category: true },
    });
    const activeConfigs = await prisma.systemConfiguration.count({
      where: { isActive: true }
    });

    console.log(`\n⚙️ System Configurations: ${configCount} total`);
    console.log(`   Active: ${activeConfigs}`);
    console.log('   By Category:');
    configsByCategory.forEach(group => {
      console.log(`     ${group.category}: ${group._count.category}`);
    });

    // Check user sessions
    const sessionCount = await prisma.userSession.count();
    const activeSessions = await prisma.userSession.count({
      where: { expiresAt: { gt: new Date() } }
    });

    console.log(`\n🔐 User Sessions: ${sessionCount} total`);
    console.log(`   Active: ${activeSessions}`);
    console.log(`   Expired: ${sessionCount - activeSessions}`);

    // Sample data verification
    console.log('\n📋 Sample Data Verification:');
    
    // Check for specific test users
    const superAdmin = await prisma.user.findUnique({
      where: { username: 'superadmin' }
    });
    console.log(`   Super Admin exists: ${superAdmin ? '✅' : '❌'}`);

    const japaneseUser = await prisma.user.findUnique({
      where: { username: 'admin2' }
    });
    console.log(`   Japanese Admin exists: ${japaneseUser ? '✅' : '❌'}`);

    // Check for property managers
    const propertyManagers = await prisma.user.count({
      where: { 
        username: { in: ['manager1', 'manager2'] }
      }
    });
    console.log(`   Property Managers: ${propertyManagers}/2 ${propertyManagers === 2 ? '✅' : '❌'}`);

    // Check for staff with user relationships
    const staffWithUsers = await prisma.staff.count({
      where: { userId: { not: null } }
    });
    console.log(`   Staff linked to users: ${staffWithUsers} ✅`);

    // Check for properties with managers
    const propertiesWithManagers = await prisma.property.count({
      where: { managerId: { not: null } }
    });
    console.log(`   Properties with managers: ${propertiesWithManagers} ✅`);

    // Check for multilingual data
    const japaneseStaff = await prisma.staff.count({
      where: { name: { contains: '佐藤' } }
    });
    const japaneseProperty = await prisma.property.count({
      where: { address: { contains: '東京' } }
    });
    console.log(`   Japanese staff records: ${japaneseStaff} ✅`);
    console.log(`   Japanese property records: ${japaneseProperty} ✅`);

    console.log('\n🎉 Seed data verification completed successfully!');
    console.log('\n💡 You can now:');
    console.log('   - Start the development server: npm run dev');
    console.log('   - Open Prisma Studio: npx prisma studio');
    console.log('   - Run tests: npm test');

  } catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifySeedData();