require('dotenv').config();
const { query } = require('../config/database');

async function seedSubjects() {
    try {
        console.log('Starting to seed subjects...');

        const subjects = [
            { name: 'English', code: 'ENG' },
            { name: 'Maths', code: 'MAT' },
            { name: 'Science', code: 'SCI' },
            { name: 'Social', code: 'SOC' }
        ];

        for (const sub of subjects) {
            // Check if subject already exists
            const existing = await query(
                'SELECT id FROM subjects WHERE subject_name = $1',
                [sub.name]
            );

            if (existing.length > 0) {
                console.log(`Subject "${sub.name}" already exists.`);
            } else {
                await query(
                    'INSERT INTO subjects (subject_name, subject_code, is_active) VALUES ($1, $2, TRUE)',
                    [sub.name, sub.code]
                );
                console.log(`Created subject "${sub.name}".`);
            }
        }

        console.log('✅ Subjects seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding subjects:', error);
        process.exit(1);
    }
}

seedSubjects();
