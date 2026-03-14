const { query, transaction } = require('../config/database');

/**
 * Calculate grades for students based on their marks and grading rules
 */
async function calculateGrades(academicYear = null) {
    try {
        const year = academicYear || process.env.CURRENT_ACADEMIC_YEAR;

        // Get all students with marks for the academic year
        const studentsWithMarks = await query(
            `SELECT DISTINCT student_id, class_subject_id
       FROM internal_marks
       WHERE academic_year = $1`,
            [year]
        );

        let processedCount = 0;

        for (const record of studentsWithMarks) {
            await calculateStudentGrade(record.student_id, record.class_subject_id, year);
            processedCount++;
        }

        return {
            success: true,
            processedCount
        };
    } catch (error) {
        console.error('Calculate grades error:', error);
        throw error;
    }
}

/**
 * Calculate grade for a specific student and subject
 */
async function calculateStudentGrade(studentId, classSubjectId, academicYear) {
    try {
        // Get all marks for this student and subject
        const marks = await query(
            `SELECT 
        SUM(marks_obtained) as total_marks_obtained,
        SUM(max_marks) as total_max_marks,
        COUNT(*) as exam_count,
        SUM(CASE WHEN is_absent = TRUE THEN 1 ELSE 0 END) as absent_count
       FROM internal_marks
       WHERE student_id = $1 AND class_subject_id = $2 AND academic_year = $3`,
            [studentId, classSubjectId, academicYear]
        );

        if (marks.length === 0 || marks[0].exam_count === 0 || marks[0].total_max_marks === null) {
            console.log(`No marks found for student ${studentId}, subject ${classSubjectId}, year ${academicYear}`);
            return null;
        }

        const { total_marks_obtained, total_max_marks, absent_count } = marks[0];

        // Ensure numeric types for calculation
        const obtained = parseFloat(total_marks_obtained) || 0;
        const max = parseFloat(total_max_marks) || 0;

        if (max === 0) {
            console.log(`Max marks is 0 for student ${studentId}, subject ${classSubjectId}`);
            return null;
        }

        // Calculate percentage
        const percentage = (obtained / max) * 100;

        // Get appropriate grade based on percentage
        const grades = await query(
            `SELECT id, grade_name, grade_point
       FROM grading_rules
       WHERE $1 >= min_percentage AND $1 <= max_percentage
       LIMIT 1`,
            [percentage]
        );

        let gradeId = null;
        let gradePoint = null;
        let remarks = null;

        if (grades.length > 0) {
            gradeId = grades[0].id;
            gradePoint = grades[0].grade_point;
        } else {
            console.log(`No grade found for percentage ${percentage}`);
        }

        // Add remarks if student was absent
        if (parseInt(absent_count) > 0) {
            remarks = `Absent in ${absent_count} exam(s)`;
        }

        // Insert or update student grade
        // PostgreSQL UPSERT
        await query(
            `INSERT INTO student_grades 
      (student_id, class_subject_id, academic_year, total_marks_obtained, total_max_marks, percentage, grade_id, grade_point, remarks)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (student_id, class_subject_id, academic_year)
      DO UPDATE SET 
        total_marks_obtained = EXCLUDED.total_marks_obtained, 
        total_max_marks = EXCLUDED.total_max_marks, 
        percentage = EXCLUDED.percentage, 
        grade_id = EXCLUDED.grade_id, 
        grade_point = EXCLUDED.grade_point, 
        remarks = EXCLUDED.remarks,
        updated_at = NOW()`,
            [
                studentId, classSubjectId, academicYear, obtained, max, percentage, gradeId, gradePoint, remarks
            ]
        );

        console.log(`Grade calculated successfully for student ${studentId}: ${percentage}%`);

        return {
            studentId,
            classSubjectId,
            percentage,
            gradeId,
            gradePoint
        };
    } catch (error) {
        console.error('Calculate student grade error:', error);
        console.error('Error details:', {
            studentId,
            classSubjectId,
            academicYear,
            errorMessage: error.message,
            errorStack: error.stack
        });
        throw error;
    }
}

/**
 * Get student grades for a specific academic year
 */
async function getStudentGrades(studentId, academicYear) {
    try {
        const grades = await query(
            `SELECT 
        sg.*,
        s.subject_name,
        gr.grade_name,
        cs.max_marks,
        cs.min_passing_marks
       FROM student_grades sg
       JOIN class_subjects cs ON sg.class_subject_id = cs.id
       JOIN subjects s ON cs.subject_id = s.id
       LEFT JOIN grading_rules gr ON sg.grade_id = gr.id
       WHERE sg.student_id = $1 AND sg.academic_year = $2
       ORDER BY s.subject_name`,
            [studentId, academicYear]
        );

        return grades;
    } catch (error) {
        console.error('Get student grades error:', error);
        throw error;
    }
}

/**
 * Calculate overall GPA for a student
 */
async function calculateGPA(studentId, academicYear) {
    try {
        const result = await query(
            `SELECT 
        AVG(grade_point) as gpa,
        COUNT(*) as subject_count
       FROM student_grades
       WHERE student_id = $1 AND academic_year = $2 AND grade_point IS NOT NULL`,
            [studentId, academicYear]
        );

        if (result.length > 0 && result[0].gpa !== null) {
            return {
                gpa: parseFloat(result[0].gpa).toFixed(2),
                subjectCount: parseInt(result[0].subject_count)
            };
        }

        return { gpa: 0, subjectCount: 0 };
    } catch (error) {
        console.error('Calculate GPA error:', error);
        throw error;
    }
}

module.exports = {
    calculateGrades,
    calculateStudentGrade,
    getStudentGrades,
    calculateGPA
};
