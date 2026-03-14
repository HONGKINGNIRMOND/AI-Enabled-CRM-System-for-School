const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all classes
router.get('/classes', authenticateToken, async (req, res) => {
    try {
        const classes = await query(`
            SELECT * FROM classes 
            WHERE is_active = TRUE 
            ORDER BY 
                CASE 
                    WHEN class_name ~ '^[0-9]+$' THEN CAST(class_name AS INTEGER)
                    WHEN class_name ~ '^Class [0-9]+$' THEN CAST(SUBSTRING(class_name FROM '[0-9]+') AS INTEGER)
                    WHEN class_name ~ '^Grade [0-9]+$' THEN CAST(SUBSTRING(class_name FROM '[0-9]+') AS INTEGER)
                    ELSE 999
                END,
                class_name
        `);
        res.json({ success: true, data: classes });
    } catch (error) {
        console.error('Failed to fetch classes:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch classes' });
    }
});

// Get sections by class
router.get('/sections', authenticateToken, async (req, res) => {
    try {
        const { class_id } = req.query;
        let sql = 'SELECT * FROM sections';
        const params = [];

        if (class_id) {
            sql += ' WHERE class_id = $1';
            params.push(class_id);
        }

        sql += ` ORDER BY 
            CASE 
                WHEN section_name ~ '^[A-Z]$' THEN ASCII(section_name)
                WHEN section_name ~ '^Section [A-Z]$' THEN ASCII(SUBSTRING(section_name FROM '[A-Z]'))
                ELSE 999
            END,
            section_name`;

        const sections = await query(sql, params);
        res.json({ success: true, data: sections });
    } catch (error) {
        console.error('Failed to fetch sections:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch sections' });
    }
});

// Get all subjects (optionally filtered by class_id)
router.get('/subjects', authenticateToken, async (req, res) => {
    try {
        const { class_id } = req.query;
        let sql = 'SELECT * FROM subjects WHERE is_active = TRUE';
        const params = [];

        if (class_id) {
            sql = `
                SELECT s.*, cs.id as class_subject_id, u.full_name as teacher_name
                FROM subjects s
                JOIN class_subjects cs ON s.id = cs.subject_id
                LEFT JOIN users u ON cs.teacher_id = u.id
                WHERE cs.class_id = $1 AND s.is_active = TRUE
            `;
            params.push(class_id);
        }

        sql += ' ORDER BY subject_name';

        const subjects = await query(sql, params);
        res.json({ success: true, data: subjects });
    } catch (error) {
        console.error('Failed to fetch subjects:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch subjects' });
    }
});

// Get exam types
router.get('/exam-types', authenticateToken, async (req, res) => {
    try {
        const examTypes = await query('SELECT * FROM exam_types ORDER BY id');
        res.json({ success: true, data: examTypes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch exam types' });
    }
});

// Get all distinct academic years
router.get('/academic-years', authenticateToken, async (req, res) => {
    try {
        const years = await query(`
            SELECT DISTINCT academic_year 
            FROM student_enrollments 
            ORDER BY academic_year DESC
        `);
        res.json({ success: true, data: years.map(y => y.academic_year) });
    } catch (error) {
        console.error('Failed to fetch academic years:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch academic years' });
    }
});

module.exports = router;
