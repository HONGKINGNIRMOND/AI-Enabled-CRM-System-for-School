const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');
const whatsappService = require('../services/whatsappService');

// Search students by name, roll number, or class
router.get('/search-students', authenticateToken, async (req, res) => {
    try {
        const { search, class_id, section_id } = req.query;
        let sql = `
            SELECT DISTINCT 
                s.id,
                s.registration_number,
                s.first_name,
                s.last_name,
                s.phone,
                s.email,
                c.class_name,
                sec.section_name,
                se.roll_number,
                se.academic_year
            FROM students s
            LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
            LEFT JOIN classes c ON se.class_id = c.id
            LEFT JOIN sections sec ON se.section_id = sec.id
            WHERE s.is_active = TRUE
        `;
        const params = [];
        let paramIndex = 1;

        if (search) {
            sql += ` AND (
                s.first_name ILIKE $${paramIndex} OR 
                s.last_name ILIKE $${paramIndex} OR 
                se.roll_number ILIKE $${paramIndex} OR
                CONCAT(s.first_name, ' ', s.last_name) ILIKE $${paramIndex}
            )`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (class_id) {
            sql += ` AND se.class_id = $${paramIndex}`;
            params.push(class_id);
            paramIndex++;
        }

        if (section_id) {
            sql += ` AND se.section_id = $${paramIndex}`;
            params.push(section_id);
            paramIndex++;
        }

        sql += ` ORDER BY s.first_name, s.last_name LIMIT 20`;

        const students = await query(sql, params);

        res.json({
            success: true,
            data: students
        });
    } catch (error) {
        console.error('Search students error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search students'
        });
    }
});

// Get comprehensive student data for WhatsApp update
router.get('/student-complete-data/:studentId', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        console.log(`Fetching complete data for student ID: ${studentId}`);

        // Get student basic info with parent information
        console.log('Step 1: Fetching student info...');
        const studentInfo = await query(`
            SELECT 
                s.id,
                s.registration_number,
                s.first_name,
                s.last_name,
                s.phone,
                s.email,
                s.father_name,
                s.father_phone,
                s.father_whatsapp,
                s.father_email,
                s.mother_name,
                s.mother_phone,
                s.mother_whatsapp,
                s.mother_email,
                c.class_name,
                sec.section_name,
                se.roll_number,
                se.academic_year
            FROM students s
            LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
            LEFT JOIN classes c ON se.class_id = c.id
            LEFT JOIN sections sec ON se.section_id = sec.id
            WHERE s.id = $1 AND s.is_active = TRUE
        `, [studentId]);

        if (studentInfo.length === 0) {
            console.log('Student not found');
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        console.log('Student info fetched successfully');

        // Get attendance percentage
        console.log('Step 2: Fetching attendance data...');
        const attendanceData = await query(`
            SELECT 
                COUNT(*) as total_days,
                SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days
            FROM attendance 
            WHERE student_id = $1 
            AND attendance_date >= CURRENT_DATE - INTERVAL '3 months'
        `, [studentId]);
        console.log('Attendance data fetched');

        const attendancePercentage = attendanceData[0].total_days > 0
            ? ((attendanceData[0].present_days / attendanceData[0].total_days) * 100).toFixed(1)
            : 0;

        // Get internal marks
        console.log('Step 3: Fetching marks data...');
        const marksData = await query(`
            SELECT 
                sub.subject_name,
                AVG(im.marks_obtained) as average_marks,
                MAX(im.marks_obtained) as highest_marks,
                MIN(im.marks_obtained) as lowest_marks
            FROM internal_marks im
            JOIN class_subjects cs ON im.class_subject_id = cs.id 
            JOIN subjects sub ON cs.subject_id = sub.id
            WHERE im.student_id = $1
            AND im.academic_year = EXTRACT(YEAR FROM CURRENT_DATE)::text 
            AND im.is_absent = FALSE
            GROUP BY sub.subject_name
            ORDER BY sub.subject_name
        `, [studentId]);
        console.log(`Marks data fetched: ${marksData.length} subjects`);

        // Get overall grade
        console.log('Step 4: Fetching grade data...');
        const gradeData = await query(`
            SELECT 
                AVG(sg.grade_point) as average_grade_point,
                MAX(sg.grade_point) as highest_grade_point
            FROM student_grades sg
            WHERE sg.student_id = $1
            AND sg.academic_year = EXTRACT(YEAR FROM CURRENT_DATE)::text
        `, [studentId]);
        console.log('Grade data fetched');

        // Get fee pending amount
        console.log('Step 5: Fetching fee data...');
        const feeData = await query(`
            SELECT 
                COALESCE(SUM(pending_amount), 0) as total_pending
            FROM fees f
            WHERE f.student_id = $1
            AND f.payment_status IN ('pending', 'partial')
        `, [studentId]);
        console.log('Fee data fetched');

        // Get WhatsApp number from student table (father or mother)
        console.log('Step 6: Getting parent WhatsApp...');
        const student = studentInfo[0];
        const parentWhatsApp = student.father_whatsapp || student.mother_whatsapp || student.father_phone || student.mother_phone || null;

        const completeData = {
            student: studentInfo[0],
            attendance: {
                percentage: parseFloat(attendancePercentage),
                totalDays: attendanceData[0].total_days,
                presentDays: attendanceData[0].present_days
            },
            marks: marksData,
            grade: {
                averageGradePoint: parseFloat(gradeData[0]?.average_grade_point || 0),
                highestGradePoint: parseFloat(gradeData[0]?.highest_grade_point || 0)
            },
            fees: {
                pendingAmount: parseFloat(feeData[0]?.total_pending || 0)
            },
            parent: {
                father_name: student.father_name || 'N/A',
                mother_name: student.mother_name || 'N/A',
                father_phone: student.father_phone || 'N/A',
                mother_phone: student.mother_phone || 'N/A'
            },
            parentWhatsApp: parentWhatsApp
        };

        console.log('All data fetched successfully, sending response');
        res.json({
            success: true,
            data: completeData
        });
    } catch (error) {
        console.error('Get student complete data error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch student data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Send WhatsApp message to parent (Demo mode)
router.post('/send-whatsapp-update', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.body;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required'
            });
        }

        // Get complete student data
        const studentDataResponse = await query(`
            SELECT 
                s.id,
                s.registration_number,
                s.first_name,
                s.last_name,
                s.phone,
                s.email,
                s.father_name,
                s.father_phone,
                s.father_whatsapp,
                s.father_email,
                s.mother_name,
                s.mother_phone,
                s.mother_whatsapp,
                s.mother_email,
                c.class_name,
                sec.section_name,
                se.roll_number,
                se.academic_year
            FROM students s
            LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
            LEFT JOIN classes c ON se.class_id = c.id
            LEFT JOIN sections sec ON se.section_id = sec.id
            WHERE s.id = $1 AND s.is_active = TRUE
        `, [studentId]);

        if (studentDataResponse.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Get attendance percentage
        const attendanceData = await query(`
            SELECT 
                COUNT(*) as total_days,
                SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days
            FROM attendance 
            WHERE student_id = $1 
            AND attendance_date >= CURRENT_DATE - INTERVAL '3 months'
        `, [studentId]);

        const attendancePercentage = attendanceData[0].total_days > 0
            ? ((attendanceData[0].present_days / attendanceData[0].total_days) * 100).toFixed(1)
            : 0;

        // Get internal marks
        const marksData = await query(`
            SELECT 
                sub.subject_name,
                AVG(im.marks_obtained) as average_marks,
                MAX(im.marks_obtained) as highest_marks,
                MIN(im.marks_obtained) as lowest_marks
            FROM internal_marks im
            JOIN class_subjects cs ON im.class_subject_id = cs.id 
            JOIN subjects sub ON cs.subject_id = sub.id
            WHERE im.student_id = $1
            AND im.academic_year = EXTRACT(YEAR FROM CURRENT_DATE)::text
            AND im.is_absent = FALSE
            GROUP BY sub.subject_name
            ORDER BY sub.subject_name
        `, [studentId]);

        // Get overall grade
        const gradeData = await query(`
            SELECT 
                AVG(sg.grade_point) as average_grade_point,
                MAX(sg.grade_point) as highest_grade_point
            FROM student_grades sg
            WHERE sg.student_id = $1
            AND sg.academic_year = EXTRACT(YEAR FROM CURRENT_DATE)::text
        `, [studentId]);

        // Get fee pending amount
        const feeData = await query(`
            SELECT 
                COALESCE(SUM(pending_amount), 0) as total_pending
            FROM fees f
            WHERE f.student_id = $1
            AND f.payment_status IN ('pending', 'partial')
        `, [studentId]);

        // Get WhatsApp number from student table (father or mother)
        const student = studentDataResponse[0];
        const parentWhatsApp = student.father_whatsapp || student.mother_whatsapp || student.father_phone || student.mother_phone || null;

        const completeData = {
            student: studentDataResponse[0],
            attendance: {
                percentage: parseFloat(attendancePercentage),
                totalDays: attendanceData[0].total_days,
                presentDays: attendanceData[0].present_days
            },
            marks: marksData,
            grade: {
                averageGradePoint: parseFloat(gradeData[0]?.average_grade_point || 0),
                highestGradePoint: parseFloat(gradeData[0]?.highest_grade_point || 0)
            },
            fees: {
                pendingAmount: parseFloat(feeData[0]?.total_pending || 0)
            },
            parent: {
                father_name: student.father_name || 'N/A',
                mother_name: student.mother_name || 'N/A',
                father_phone: student.father_phone || 'N/A',
                mother_phone: student.mother_phone || 'N/A'
            },
            parentWhatsApp: parentWhatsApp
        };

        // Generate formatted message (demo mode)
        let message = `📚 *Student Academic Update*\n\n`;
        message += `👤 *Student Information*\n`;
        message += `📝 Name: ${completeData.student.first_name} ${completeData.student.last_name}\n`;
        message += `🎓 Class: ${completeData.student.class_name} - ${completeData.student.section_name}\n`;
        message += `🔢 Roll No: ${completeData.student.roll_number}\n`;
        message += `📅 Academic Year: ${completeData.student.academic_year}\n\n`;

        message += `📊 *Academic Performance*\n`;
        message += `📈 Attendance: ${completeData.attendance.percentage}% (${completeData.attendance.presentDays}/${completeData.attendance.totalDays} days)\n`;

        if (completeData.marks && completeData.marks.length > 0) {
            message += `📝 Subject-wise Internal Marks:\n`;
            completeData.marks.forEach(mark => {
                message += `  • ${mark.subject_name}: ${mark.average_marks.toFixed(1)}/100\n`;
            });
        }

        message += `🏆 Overall Grade Point: ${completeData.grade.averageGradePoint.toFixed(2)}\n\n`;

        message += `💰 *Fee Information*\n`;
        message += `💳 Pending Amount: ₹${completeData.fees.pendingAmount.toFixed(2)}\n\n`;

        message += `📱 *Parent Contact*\n`;
        message += `👨 Father: ${completeData.parent.father_name || 'N/A'}\n`;
        message += `👩 Mother: ${completeData.parent.mother_name || 'N/A'}\n\n`;

        message += `---\n`;
        message += `📧 For any queries, please contact the school administration.\n`;
        message += `🏫 School Management System`;

        // Return success in demo mode
        res.json({
            success: true,
            message: 'Student update prepared successfully (Demo mode - WhatsApp disabled)',
            data: {
                messageId: 'demo_' + Date.now(),
                parentNumber: completeData.parentWhatsApp,
                studentName: `${completeData.student.first_name} ${completeData.student.last_name}`,
                demoMode: true,
                formattedMessage: message
            }
        });

    } catch (error) {
        console.error('Send WhatsApp update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send student update',
            error: error.message
        });
    }
});

// Test Twilio connection
router.get('/test-whatsapp', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        // Return demo response since WhatsApp is disabled
        res.json({
            success: true,
            data: {
                message: 'WhatsApp service disabled - Demo mode active',
                configured: false,
                demoMode: true
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to test WhatsApp connection',
            error: error.message
        });
    }
});

module.exports = router;
