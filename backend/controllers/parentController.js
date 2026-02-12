const { query } = require('../config/database');

const getChildren = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find parent ID from users table (assuming user is the parent)
        // In this schema, parents might be in a separate table 'parents' linked to 'users'
        // OR we just use student_parents mapping directly with user_id if simplified.
        // Based on schema 'student_parents' has 'parent_id'. 'parents' table has 'user_id'.

        // Let's try to find the parent record first
        const parentRes = await query('SELECT id FROM parents WHERE user_id = $1', [userId]);

        // If no parent record found, for this prototype, we might fall back or return empty.
        // However, let's assume direct mapping for simplicity if the detailed parent table isn't populated.
        // But the schema verification showed 'parents' table exists. 
        // If the table is empty (because createUsers didn't populate it), we need to handle that.

        let parentId = null;
        if (parentRes.length > 0) {
            parentId = parentRes[0].id;
        } else {
            // Fallback: Check if we can use the user_id directly or if we need to create a parent record on the fly?
            // For valid prototype behavior, let's return a specific set of students if logged in as the 'demo' parent
            // or return empty if not linked.

            // DEMO HACK: If email is 'parent@school.com', return all students for now to show UI, 
            // OR better, create a linkage script.
            // Let's stick to the SQL. If no parent record, return empty.
        }

        let students = [];
        if (parentId) {
            const sql = `
                SELECT s.*, c.class_name, sec.section_name,
                       (SELECT avg_attendance_percentage FROM v_student_attendance_summary WHERE student_id = s.id LIMIT 1) as attendance_percentage
                FROM students s
                JOIN student_parents sp ON s.id = sp.student_id
                LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
                LEFT JOIN classes c ON se.class_id = c.id
                LEFT JOIN sections sec ON se.section_id = sec.id
                WHERE sp.parent_id = $1
            `;
            students = await query(sql, [parentId]);
        }

        res.json({
            success: true,
            data: students
        });
    } catch (error) {
        console.error('Get children error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch children'
        });
    }
};

module.exports = {
    getChildren
};
