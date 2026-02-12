const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const { calculateGrades, calculateStudentGrade } = require('../controllers/gradeCalculator');

// Calculate grades for all students
router.post('/calculate', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const { academic_year } = req.body;

        // Pass calculateGrades directly, it handles query execution internally
        const result = await calculateGrades(academic_year);

        res.json({
            success: true,
            message: `Grades calculated for ${result.processedCount} student-subject combinations`,
            data: result
        });
    } catch (error) {
        console.error('Calculate grades error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate grades'
        });
    }
});

// Calculate grade for a specific student and subject
router.post('/calculate/:studentId/:classSubjectId', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const { studentId, classSubjectId } = req.params;
        const { academic_year } = req.body;
        const year = academic_year || process.env.CURRENT_ACADEMIC_YEAR;

        const result = await calculateStudentGrade(studentId, classSubjectId, year);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'No marks found for this student and subject'
            });
        }

        res.json({
            success: true,
            message: 'Grade calculated successfully',
            data: result
        });
    } catch (error) {
        console.error('Calculate student grade error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate grade'
        });
    }
});

// Get grades for a student
router.get('/student/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { academic_year } = req.query;
        const year = academic_year || process.env.CURRENT_ACADEMIC_YEAR;

        const grades = await query(
            `SELECT 
        sg.*,
        s.subject_name,
        s.subject_code,
        gr.grade_name,
        gr.description as grade_description
       FROM student_grades sg
       JOIN class_subjects cs ON sg.class_subject_id = cs.id
       JOIN subjects s ON cs.subject_id = s.id
       LEFT JOIN grading_rules gr ON sg.grade_id = gr.id
       WHERE sg.student_id = $1 AND sg.academic_year = $2
       ORDER BY s.subject_name`,
            [id, year]
        );

        res.json({
            success: true,
            data: { grades }
        });
    } catch (error) {
        console.error('Get student grades error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch grades'
        });
    }
});

module.exports = router;
