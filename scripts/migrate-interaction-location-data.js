const { PrismaClient } = require('@prisma/client');

async function migrateInteractionLocationData() {
    const prisma = new PrismaClient();

    try {
        console.log('Starting migration of interaction_records location data to companies_id...\n');

        // Step 1: Get all interaction records with location data but no companies_id
        const recordsToMigrate = await prisma.interactionRecord.findMany({
            where: {
                location: {
                    not: null
                },
                companiesId: null
            },
            select: {
                id: true,
                location: true,
                type: true,
                date: true,
                description: true
            }
        });

        console.log(`Found ${recordsToMigrate.length} interaction records that need migration:`);
        recordsToMigrate.forEach(record => {
            console.log(`  ID: ${record.id}, Location: "${record.location}", Type: ${record.type}`);
        });

        // Step 2: Get all companies for potential matching
        const companies = await prisma.company.findMany({
            select: {
                id: true,
                name: true,
                address: true,
                city: true,
                prefecture: true
            }
        });

        console.log(`\nAvailable companies for matching: ${companies.length}`);

        // Step 3: Create mapping rules for location to company matching
        const locationMappings = new Map();

        // Manual mappings based on common location patterns
        const manualMappings = {
            '大阪支社 会議室B': { companyId: 2, reason: 'Contains "大阪" matching 大阪製造株式会社' },
            'メール相談': { companyId: null, reason: 'Generic location - no specific company match' },
            '営業部会議室': { companyId: null, reason: 'Generic location - no specific company match' },
            'オンライン面接': { companyId: null, reason: 'Generic location - no specific company match' },
            '人事部相談室': { companyId: null, reason: 'Generic location - no specific company match' },
            '電話相談': { companyId: null, reason: 'Generic location - no specific company match' },
            'International Conference Room': { companyId: 13, reason: 'English location matching Tokyo Tech Solutions' },
            'Video Conference': { companyId: 15, reason: 'English location matching International Business Corp' },
            'Email Consultation': { companyId: null, reason: 'Generic location - no specific company match' }
        };

        // Step 4: Apply mappings and track changes
        const migrationResults = [];
        let successCount = 0;
        let skippedCount = 0;

        for (const record of recordsToMigrate) {
            const mapping = manualMappings[record.location];

            if (mapping && mapping.companyId) {
                try {
                    await prisma.interactionRecord.update({
                        where: { id: record.id },
                        data: { companiesId: mapping.companyId }
                    });

                    migrationResults.push({
                        recordId: record.id,
                        location: record.location,
                        companiesId: mapping.companyId,
                        reason: mapping.reason,
                        status: 'SUCCESS'
                    });
                    successCount++;

                    console.log(`✓ Migrated record ${record.id}: "${record.location}" → Company ${mapping.companyId}`);
                } catch (error) {
                    migrationResults.push({
                        recordId: record.id,
                        location: record.location,
                        companiesId: mapping.companyId,
                        reason: `Error: ${error.message}`,
                        status: 'ERROR'
                    });
                    console.log(`✗ Failed to migrate record ${record.id}: ${error.message}`);
                }
            } else {
                migrationResults.push({
                    recordId: record.id,
                    location: record.location,
                    companiesId: null,
                    reason: mapping ? mapping.reason : 'No mapping rule defined',
                    status: 'SKIPPED'
                });
                skippedCount++;
                console.log(`- Skipped record ${record.id}: "${record.location}" (${mapping ? mapping.reason : 'No mapping rule'})`);
            }
        }

        // Step 5: Validate data integrity
        console.log('\n=== Data Integrity Validation ===');

        // Check for orphaned foreign keys
        const invalidReferences = await prisma.interactionRecord.findMany({
            where: {
                companiesId: {
                    not: null
                },
                company: null
            }
        });

        if (invalidReferences.length > 0) {
            console.log(`⚠️  Found ${invalidReferences.length} interaction records with invalid company references`);
            invalidReferences.forEach(record => {
                console.log(`  Record ${record.id} references non-existent company ${record.companiesId}`);
            });
        } else {
            console.log('✓ All company references are valid');
        }

        // Check for duplicate relationships
        const duplicateCheck = await prisma.interactionRecord.groupBy({
            by: ['companiesId'],
            where: {
                companiesId: {
                    not: null
                }
            },
            _count: {
                id: true
            }
        });

        console.log('✓ Company relationship distribution:');
        for (const group of duplicateCheck) {
            const company = companies.find(c => c.id === group.companiesId);
            console.log(`  Company ${group.companiesId} (${company?.name || 'Unknown'}): ${group._count.id} interactions`);
        }

        // Step 6: Generate migration summary
        console.log('\n=== Migration Summary ===');
        console.log(`Total records processed: ${recordsToMigrate.length}`);
        console.log(`Successfully migrated: ${successCount}`);
        console.log(`Skipped (no mapping): ${skippedCount}`);
        console.log(`Errors: ${migrationResults.filter(r => r.status === 'ERROR').length}`);

        // Step 7: Verify final state
        const finalCheck = await prisma.interactionRecord.findMany({
            where: {
                location: {
                    not: null
                }
            },
            select: {
                id: true,
                location: true,
                companiesId: true,
                company: {
                    select: {
                        name: true
                    }
                }
            }
        });

        console.log('\n=== Final State Verification ===');
        console.log('All interaction records with location data:');
        finalCheck.forEach(record => {
            const companyName = record.company?.name || 'No Company';
            console.log(`  ID: ${record.id}, Location: "${record.location}", Company: ${companyName} (ID: ${record.companiesId})`);
        });

        // Step 8: Check documents table integrity (already has companies_id from previous migration)
        const documentsCheck = await prisma.document.findMany({
            where: {
                companiesId: {
                    not: null
                }
            },
            include: {
                company: {
                    select: {
                        name: true
                    }
                }
            }
        });

        console.log('\n=== Documents Table Verification ===');
        console.log(`Documents with company relationships: ${documentsCheck.length}`);
        documentsCheck.forEach(doc => {
            console.log(`  Document "${doc.title}" → Company: ${doc.company?.name || 'Unknown'} (ID: ${doc.companiesId})`);
        });

        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the migration
if (require.main === module) {
    migrateInteractionLocationData()
        .then(() => {
            console.log('Migration script completed.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateInteractionLocationData };