const { query } = require('../config/database');

async function addSampleParents() {
    try {
        console.log('Adding sample parent data...');

        // Get all students without parent records
        const studentsWithoutParents = await query(`
            SELECT s.id, s.first_name, s.last_name, s.phone
            FROM students s
            LEFT JOIN parents p ON s.id = p.user_id
            WHERE p.id IS NULL
            LIMIT 10
        `);

        console.log(`Found ${studentsWithoutParents.length} students without parent records`);

        for (const student of studentsWithoutParents) {
            // Create father record
            await query(`
                INSERT INTO parents (
                    user_id,
                    first_name, 
                    last_name, 
                    relationship,
                    phone,
                    father_whatsapp
                )
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                student.id,
                `Father`,
                student.last_name,
                'Father',
                student.phone || '9876543210',
                student.phone || '9876543210'
            ]);

            // Create mother record
            await query(`
                INSERT INTO parents (
                    user_id,
                    first_name, 
                    last_name, 
                    relationship,
                    phone,
                    mother_whatsapp
                )
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                student.id,
                `Mother`,
                student.last_name,
                'Mother',
                student.phone || '9876543211',
                student.phone || '9876543211'
            ]);

            console.log(`Added parents for student: ${student.first_name} ${student.last_name}`);
        }

        console.log('Sample parent data added successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error adding sample parents:', error);
        process.exit(1);
    }
}

addSampleParents();
