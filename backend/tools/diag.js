const { query } = require('./backend/config/database');

async function diagnostic() {
    try {
        console.log('--- Student Enrollments Academic Years ---');
        const enrollments = await query('SELECT DISTINCT academic_year, is_current FROM student_enrollments');
        console.table(enrollments);

        console.log('--- Internal Marks Academic Years ---');
        const marks = await query('SELECT DISTINCT academic_year FROM internal_marks');
        console.table(marks);

        console.log('--- Current Date Extracted Year ---');
        const yearRes = await query('SELECT EXTRACT(YEAR FROM CURRENT_DATE) as year');
        console.log(yearRes[0].year);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

diagnostic();
