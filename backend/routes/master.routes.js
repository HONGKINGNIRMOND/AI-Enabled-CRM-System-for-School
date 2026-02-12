const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all classes
router.get('/classes', async (req, res) => {
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
router.get('/sections', async (req, res) => {
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
router.get('/subjects', async (req, res) => {
    try {
        const { class_id } = req.query;
        let sql = 'SELECT * FROM subjects WHERE is_active = TRUE';
        const params = [];

        if (class_id) {
            sql = `
                SELECT s.*, u.full_name as teacher_name
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
router.get('/exam-types', async (req, res) => {
    try {
        const examTypes = await query('SELECT * FROM exam_types ORDER BY exam_name');
        res.json({ success: true, data: examTypes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch exam types' });
    }
});

module.exports = router;
