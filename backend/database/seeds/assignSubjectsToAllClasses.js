const { query } = require('../config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function assignSubjectsToAllClasses() {
    try {
        console.log('Starting bulk subject assignment...');

        // 1. Get all active classes
        const classes = await query('SELECT id, class_name FROM classes WHERE is_active = TRUE');
        console.log(`Found ${classes.length} active classes.`);

        // 2. Get standard subjects
        const subjects = await query(
            "SELECT id, subject_name FROM subjects WHERE subject_name IN ('English', 'Maths', 'Science', 'Social') AND is_active = TRUE"
        );
        console.log(`Found ${subjects.length} standard subjects.`);

        if (subjects.length === 0) {
            console.error('Standard subjects not found. Please run seedSubjects.js first.');
            return;
        }

        let assignedCount = 0;
        let skippedCount = 0;

        for (const cls of classes) {
            for (const sub of subjects) {
                // Check if already assigned
                const existing = await query(
                    'SELECT id FROM class_subjects WHERE class_id = $1 AND subject_id = $2',
                    [cls.id, sub.id]
                );

                if (existing.length === 0) {
                    await query(
                        'INSERT INTO class_subjects (class_id, subject_id) VALUES ($1, $2)',
                        [cls.id, sub.id]
                    );
                    assignedCount++;
                } else {
                    skippedCount++;
                }
            }
        }

        console.log('========================================');
        console.log('Bulk Assignment Completed Successfully');
        console.log(`Total New Assignments: ${assignedCount}`);
        console.log(`Skipped (Already Assigned): ${skippedCount}`);
        console.log('========================================');

    } catch (error) {
        console.error('Bulk assignment failed:', error);
    } finally {
        process.exit();
    }
}

assignSubjectsToAllClasses();
