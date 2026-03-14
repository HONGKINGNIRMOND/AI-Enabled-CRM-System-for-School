const { query } = require('../config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function resetExamTypes() {
    try {
        console.log('Starting exam types reset...');
        console.log('========================================');

        // Step 1: Delete all existing exam types
        console.log('Step 1: Removing all existing exam types...');
        const deleteExamTypes = await query('DELETE FROM exam_types RETURNING id');
        console.log(`Removed ${deleteExamTypes.length} exam types`);

        // Step 2: Insert the 4 standard exam types in the correct order
        console.log('Step 2: Creating standard exam types in order...');
        const standardExamTypes = [
            { name: 'First Internal', code: 'INT1', weightage: 20.00, order: 1 },
            { name: 'Mid-Term', code: 'MID', weightage: 30.00, order: 2 },
            { name: 'Second Internal', code: 'INT2', weightage: 20.00, order: 3 },
            { name: 'Final Exam', code: 'FINAL', weightage: 30.00, order: 4 }
        ];

        for (const examType of standardExamTypes) {
            const result = await query(
                `INSERT INTO exam_types (exam_name, exam_code, weightage) 
                 VALUES ($1, $2, $3) 
                 RETURNING id, exam_name`,
                [examType.name, examType.code, examType.weightage]
            );
            console.log(`${examType.order}. Created exam type: ${examType.name} (Code: ${examType.code}, Weightage: ${examType.weightage}%, ID: ${result[0].id})`);
        }

        console.log('========================================');
        console.log('Exam Types Reset Completed Successfully!');
        console.log('Order: First Internal → Mid-Term → Second Internal → Final Exam');
        console.log('========================================');

    } catch (error) {
        console.error('Exam types reset failed:', error);
        console.error('Error details:', error.message);
    } finally {
        process.exit();
    }
}

resetExamTypes();
