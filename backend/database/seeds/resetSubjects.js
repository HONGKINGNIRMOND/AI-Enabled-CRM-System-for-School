const { query } = require('../../config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function resetSubjects() {
    try {
        console.log('Starting subject reset...');
        console.log('========================================');

        // Step 1: Delete all existing class-subject mappings
        console.log('Step 1: Removing all class-subject assignments...');
        const deleteClassSubjects = await query('DELETE FROM class_subjects RETURNING id');
        console.log(`Removed ${deleteClassSubjects.length} class-subject assignments`);

        // Step 2: Delete all existing subjects
        console.log('Step 2: Removing all existing subjects...');
        const deleteSubjects = await query('DELETE FROM subjects RETURNING id');
        console.log(`Removed ${deleteSubjects.length} subjects`);

        // Step 3: Insert the 4 standard subjects
        console.log('Step 3: Creating standard subjects...');
        const standardSubjects = ['English', 'Science', 'Social', 'Maths'];
        const subjectIds = {};

        for (const subjectName of standardSubjects) {
            const result = await query(
                `INSERT INTO subjects (subject_name, is_active) 
                 VALUES ($1, TRUE) 
                 RETURNING id, subject_name`,
                [subjectName]
            );
            subjectIds[subjectName] = result[0].id;
            console.log(`Created subject: ${subjectName} (ID: ${result[0].id})`);
        }

        // Step 4: Get all active classes
        console.log('Step 4: Assigning subjects to all classes...');
        const classes = await query('SELECT id, class_name FROM classes WHERE is_active = TRUE ORDER BY class_name');
        console.log(`Found ${classes.length} active classes`);

        // Step 5: Assign all 4 subjects to each class
        let assignmentCount = 0;
        for (const cls of classes) {
            for (const subjectName of standardSubjects) {
                await query(
                    `INSERT INTO class_subjects (class_id, subject_id, max_marks, min_passing_marks) 
                     VALUES ($1, $2, 100, 35)`,
                    [cls.id, subjectIds[subjectName]]
                );
                assignmentCount++;
            }
            console.log(`Assigned all subjects to Class ${cls.class_name}`);
        }

        console.log('========================================');
        console.log('Subject Reset Completed Successfully!');
        console.log(`Total Subjects: ${standardSubjects.length}`);
        console.log(`Total Classes: ${classes.length}`);
        console.log(`Total Assignments: ${assignmentCount}`);
        console.log('========================================');
        console.log('Standard subjects (English, Science, Social, Maths) are now assigned to all classes.');

    } catch (error) {
        console.error('Subject reset failed:', error);
        console.error('Error details:', error.message);
    } finally {
        process.exit();
    }
}

resetSubjects();
