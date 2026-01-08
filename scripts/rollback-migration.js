const { PrismaClient } = require('@prisma/client');

async function rollbackMigration() {
    const prisma = new PrismaClient();

    try {
        console.log('=== Migration Rollback Script ===\n');
        console.log('⚠️  WARNING: This will remove company relationships from interaction records');
        console.log('⚠️  This action cannot be undone automatically\n');

        // Step 1: Backup current state
        console.log('1. Creating backup of current relationships...');

        const currentRelationships = await prisma.interactionRecord.findMany({
            where: { companiesId: { not: null } },
            select: {
                id: true,
                companiesId: true,
                location: true,
                company: {
                    select: { name: true }
                }
            }
        });

        console.log(`   Found ${currentRelationships.length} records with company relationships:`);
        currentRelationships.forEach(record => {
            console.log(`     ID: ${record.id}, Company: ${record.company?.name} (${record.companiesId}), Location: "${record.location}"`);
        });

        // Step 2: Confirm rollback (in a real scenario, this would require user input)
        console.log('\n2. Performing rollback...');
        console.log('   Note: In production, this would require explicit confirmation');

        // For this demo, we'll only rollback the records we migrated in this session
        const recordsToRollback = [5, 11, 12]; // IDs that were migrated in our script

        let rollbackCount = 0;
        for (const recordId of recordsToRollback) {
            const record = await prisma.interactionRecord.findUnique({
                where: { id: recordId },
                select: { id: true, companiesId: true, location: true }
            });

            if (record && record.companiesId) {
                await prisma.interactionRecord.update({
                    where: { id: recordId },
                    data: { companiesId: null }
                });
                rollbackCount++;
                console.log(`   ✓ Rolled back record ${recordId}: removed company ${record.companiesId}`);
            }
        }

        console.log(`\n   Rolled back ${rollbackCount} records`);

        // Step 3: Verify rollback
        console.log('\n3. Verifying rollback...');

        const remainingRelationships = await prisma.interactionRecord.findMany({
            where: {
                id: { in: recordsToRollback },
                companiesId: { not: null }
            }
        });

        if (remainingRelationships.length === 0) {
            console.log('   ✓ Rollback completed successfully');
        } else {
            console.log(`   ❌ ${remainingRelationships.length} records still have company relationships`);
        }

        // Step 4: Show final state
        console.log('\n4. Final state after rollback...');

        const finalState = await prisma.interactionRecord.findMany({
            where: { location: { not: null } },
            select: {
                id: true,
                location: true,
                companiesId: true,
                company: {
                    select: { name: true }
                }
            },
            orderBy: { id: 'asc' }
        });

        finalState.forEach(record => {
            const companyInfo = record.companiesId ? `${record.company?.name} (${record.companiesId})` : 'No Company';
            console.log(`   ID: ${record.id}, Location: "${record.location}", Company: ${companyInfo}`);
        });

        console.log('\n✅ Rollback completed');

    } catch (error) {
        console.error('❌ Rollback failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Utility function to restore from backup (if backup data is provided)
async function restoreFromBackup(backupData) {
    const prisma = new PrismaClient();

    try {
        console.log('=== Restoring from Backup ===\n');

        for (const record of backupData) {
            await prisma.interactionRecord.update({
                where: { id: record.id },
                data: { companiesId: record.companiesId }
            });
            console.log(`✓ Restored record ${record.id} → Company ${record.companiesId}`);
        }

        console.log('\n✅ Restore completed');

    } catch (error) {
        console.error('❌ Restore failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the rollback
if (require.main === module) {
    rollbackMigration()
        .then(() => {
            console.log('\nRollback script completed.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Rollback script failed:', error);
            process.exit(1);
        });
}

module.exports = { rollbackMigration, restoreFromBackup };