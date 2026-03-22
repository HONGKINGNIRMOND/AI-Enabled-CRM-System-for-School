const { query } = require('../config/database');

// 1. Get Dashboard Summary
const getDashboardOverview = async (req, res) => {
    try {
        const { departmentId, id: userId } = req.user;
        
        if (!departmentId) {
            return res.status(400).json({ success: false, message: 'HOD is not assigned to any department' });
        }

        // Get department details
        const deptRes = await query(`SELECT department_name FROM departments WHERE id = $1`, [departmentId]);
        const departmentName = deptRes.length > 0 ? deptRes[0].department_name : 'Unknown';

        // Get subjects count for this department
        const subjectsRes = await query(`SELECT COUNT(*) as count FROM subjects WHERE department_id = $1`, [departmentId]);
        
        // Get faculty count (teachers mapped to subjects in this department)
        const facultyRes = await query(`
            SELECT COUNT(DISTINCT cs.teacher_id) as count
            FROM class_subjects cs
            JOIN subjects s ON cs.subject_id = s.id
            WHERE s.department_id = $1 AND cs.teacher_id IS NOT NULL
        `, [departmentId]);

        res.json({
            success: true,
            data: {
                departmentName,
                totalSubjects: parseInt(subjectsRes[0].count),
                totalFaculty: parseInt(facultyRes[0].count)
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard overview:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
    }
};

// 2. Get Subjects and Faculty List
const getSubjectsAndFaculty = async (req, res) => {
    try {
        const { departmentId } = req.user;
        
        if (!departmentId) {
            return res.status(400).json({ success: false, message: 'HOD is not assigned to any department' });
        }

        const data = await query(`
            SELECT 
                s.id as "subjectId",
                s.subject_name as "subjectName",
                s.subject_code as "subjectCode",
                u.id as "teacherId",
                u.full_name as "teacherName",
                c.class_name as "className"
            FROM subjects s
            LEFT JOIN class_subjects cs ON s.id = cs.subject_id
            LEFT JOIN users u ON cs.teacher_id = u.id
            LEFT JOIN classes c ON cs.class_id = c.id
            WHERE s.department_id = $1
            ORDER BY s.subject_name
        `, [departmentId]);

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching subjects/faculty:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch subjects data' });
    }
};

// 3. Get Student Attendance for Department
const getStudentAttendance = async (req, res) => {
    try {
        const { departmentId } = req.user;
        
        if (!departmentId) return res.status(400).json({ success: false, message: 'No department assigned' });

        // Basic stats: overall attendance % for subjects under this department
        const stats = await query(`
            SELECT 
                s.subject_name as "subjectName",
                COUNT(a.id) as "totalRecords",
                SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as "presentCount",
                SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as "absentCount"
            FROM subjects s
            JOIN class_subjects cs ON s.id = cs.subject_id
            JOIN attendance a ON a.class_id = cs.class_id
            WHERE s.department_id = $1
            GROUP BY s.id, s.subject_name
        `, [departmentId]);

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch attendance' });
    }
};

// 4. Get Marks for Department Subjects
const getDepartmentMarks = async (req, res) => {
    try {
        const { departmentId } = req.user;
        
        if (!departmentId) return res.status(400).json({ success: false, message: 'No department assigned' });

        const marks = await query(`
            SELECT 
                s.subject_name as "subjectName",
                c.class_name as "className",
                sec.section_name as "sectionName",
                e.exam_name as "examName",
                COUNT(im.id) as "totalStudents",
                AVG(CASE WHEN im.is_absent = FALSE THEN im.marks_obtained ELSE 0 END) as "averageMarks",
                MAX(im.marks_obtained) as "highestMarks",
                MIN(CASE WHEN im.is_absent = FALSE THEN im.marks_obtained ELSE NULL END) as "lowestMarks",
                COUNT(CASE WHEN im.marks_obtained >= cs.min_passing_marks AND im.is_absent = FALSE THEN 1 END) as "totalPass",
                COUNT(CASE WHEN (im.marks_obtained < cs.min_passing_marks OR im.is_absent = TRUE) THEN 1 END) as "totalFail",
                MAX(im.status) as "status"
            FROM subjects s
            JOIN class_subjects cs ON s.id = cs.subject_id
            JOIN internal_marks im ON im.class_subject_id = cs.id
            JOIN exam_types e ON im.exam_type_id = e.id
            JOIN classes c ON cs.class_id = c.id
            JOIN students st ON im.student_id = st.id
            JOIN student_enrollments se ON st.id = se.student_id AND se.is_current = TRUE
            JOIN sections sec ON se.section_id = sec.id
            WHERE s.department_id = $1
            GROUP BY s.id, s.subject_name, c.id, c.class_name, sec.id, sec.section_name, e.id, e.exam_name
            ORDER BY c.class_name, sec.section_name, s.subject_name
        `, [departmentId]);

        res.json({ success: true, data: marks });
    } catch (error) {
        console.error('Error fetching marks:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch marks' });
    }
};

// 5. Approve Marks for Department
const approveMarks = async (req, res) => {
    try {
        const { departmentId } = req.user;
        const { subjectName, examName, className, sectionName } = req.body;

        if (!departmentId) return res.status(400).json({ success: false, message: 'No department assigned' });
        if (!subjectName || !examName) return res.status(400).json({ success: false, message: 'Missing subject or exam identification' });

        await query(`
            UPDATE internal_marks
            SET status = 'Approved', updated_at = NOW()
            WHERE id IN (
                SELECT im.id
                FROM internal_marks im
                JOIN class_subjects cs ON im.class_subject_id = cs.id
                JOIN subjects s ON cs.subject_id = s.id
                JOIN exam_types e ON im.exam_type_id = e.id
                JOIN classes c ON cs.class_id = c.id
                JOIN students st ON im.student_id = st.id
                JOIN student_enrollments se ON st.id = se.student_id AND se.is_current = TRUE
                JOIN sections sec ON se.section_id = sec.id
                WHERE s.department_id = $1 
                  AND s.subject_name = $2 
                  AND e.exam_name = $3
                  AND c.class_name = $4
                  AND sec.section_name = $5
            )
        `, [departmentId, subjectName, examName, className, sectionName]);

        res.json({ success: true, message: 'Marks approved successfully' });
    } catch (error) {
        console.error('Error approving marks:', error);
        res.status(500).json({ success: false, message: 'Failed to approve marks' });
    }
};

module.exports = {
    getDashboardOverview,
    getSubjectsAndFaculty,
    getStudentAttendance,
    getDepartmentMarks,
    approveMarks
};
