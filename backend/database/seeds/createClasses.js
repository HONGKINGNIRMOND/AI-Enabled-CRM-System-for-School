const { query } = require('../../config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function createClasses() {
    try {
        console.log('🌱 Starting class and section seeding...');
        console.log('========================================');

        const ACADEMIC_YEAR = '2025-2026';
        const classes = [
            'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
            'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
            'Class 11', 'Class 12'
        ];
        const sections = ['A', 'B', 'C', 'D'];

        let classCount = 0;
        let sectionCount = 0;

        for (const className of classes) {
            // 1. Insert Class
            const classResult = await query(
                `INSERT INTO classes (class_name, academic_year, is_active) 
                 VALUES ($1, $2, TRUE) 
                 ON CONFLICT (class_name, academic_year) DO UPDATE SET is_active = TRUE
                 RETURNING id`,
                [className, ACADEMIC_YEAR]
            );

            const classId = classResult[0].id;
            classCount++;

            // 2. Insert Sections for this Class
            for (const sectionName of sections) {
                await query(
                    `INSERT INTO sections (class_id, section_name, max_students) 
                     VALUES ($1, $2, 40) 
                     ON CONFLICT (class_id, section_name) DO NOTHING`,
                    [classId, sectionName]
                );
                sectionCount++;
            }
            console.log(`✓ Created/Verified ${className} with sections A, B, C, D`);
        }

        console.log('========================================');
        console.log('✅ Class and Section Seeding Completed!');
        console.log(`Total Classes: ${classCount}`);
        console.log(`Total Sections: ${sectionCount}`);
        console.log('========================================');

    } catch (error) {
        console.error('❌ Class seeding failed:', error);
        process.exit(1);
    } finally {
        // Only exit if this is the main module
        if (require.main === module) {
            process.exit(0);
        }
    }
}

if (require.main === module) {
    createClasses();
}

module.exports = createClasses;
