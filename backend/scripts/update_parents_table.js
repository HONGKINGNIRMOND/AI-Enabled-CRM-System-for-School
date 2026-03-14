const { query } = require('../config/database');

async function updateParentsTable() {
    try {
        console.log('Updating parents table with WhatsApp columns...');

        // Add father_whatsapp column if it doesn't exist
        try {
            await query(`
                ALTER TABLE parents 
                ADD COLUMN IF NOT EXISTS father_whatsapp VARCHAR(20);
            `);
            console.log('Added father_whatsapp column');
        } catch (error) {
            console.log('father_whatsapp column may already exist:', error.message);
        }

        // Add mother_whatsapp column if it doesn't exist
        try {
            await query(`
                ALTER TABLE parents 
                ADD COLUMN IF NOT EXISTS mother_whatsapp VARCHAR(20);
            `);
            console.log('Added mother_whatsapp column');
        } catch (error) {
            console.log('mother_whatsapp column may already exist:', error.message);
        }

        // Create indexes
        try {
            await query('CREATE INDEX IF NOT EXISTS idx_parents_father_whatsapp ON parents(father_whatsapp);');
            await query('CREATE INDEX IF NOT EXISTS idx_parents_mother_whatsapp ON parents(mother_whatsapp);');
            console.log('Created indexes');
        } catch (error) {
            console.log('Indexes may already exist:', error.message);
        }

        console.log('Parents table updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating parents table:', error);
        process.exit(1);
    }
}

updateParentsTable();
