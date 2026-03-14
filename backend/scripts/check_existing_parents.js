const { query } = require('../config/database');

async function checkExistingParents() {
    try {
        console.log('Checking existing parent data...');

        const result = await query(`
            SELECT p.*, s.first_name, s.last_name
            FROM parents p
            JOIN students s ON p.user_id = s.id
            LIMIT 5
        `);

        console.log('\nExisting parent records:');
        result.forEach(row => {
            console.log(`Student: ${row.first_name} ${row.last_name}, Parent: ${row.first_name} (${row.relationship}), WhatsApp: ${row.father_whatsapp || row.mother_whatsapp || 'N/A'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error checking parents:', error);
        process.exit(1);
    }
}

checkExistingParents();
