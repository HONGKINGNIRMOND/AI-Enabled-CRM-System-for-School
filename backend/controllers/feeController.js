const { query } = require('../config/database');
const { sendFeeReminder } = require('../services/notificationService');

/**
 * Get fee status for a student
 */
const getStudentFeeStatus = async (req, res) => {
    try {
        const { registrationNumber } = req.params;
        const academicYear = req.query.academicYear || process.env.CURRENT_ACADEMIC_YEAR || new Date().getFullYear().toString();

        const students = await query(
            `SELECT s.id, s.registration_number, s.first_name, s.last_name, c.class_name, sec.section_name
             FROM students s
             LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
             LEFT JOIN classes c ON se.class_id = c.id
             LEFT JOIN sections sec ON se.section_id = sec.id
             WHERE s.registration_number = $1`,
            [registrationNumber]
        );

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const student = students[0];
        const fees = await query(
            `SELECT * FROM fees WHERE student_id = $1 AND academic_year = $2`,
            [student.id, academicYear]
        );

        res.status(200).json({
            success: true,
            data: {
                student: {
                    id: student.id,
                    registrationNumber: student.registration_number,
                    name: `${student.first_name} ${student.last_name}`,
                    class: student.class_name,
                    section: student.section_name
                },
                fees: fees || []
            }
        });
    } catch (error) {
        console.error('Get fee status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve fee status',
            error: error.message
        });
    }
};

/**
 * Get fee status for all students in a class
 */
const getClassFeeStatus = async (req, res) => {
    try {
        const { class: classId, section: sectionId } = req.query;
        const academicYear = req.query.academicYear || process.env.CURRENT_ACADEMIC_YEAR || new Date().getFullYear().toString();

        if (!classId) {
            return res.status(400).json({
                success: false,
                message: 'Class parameter is required'
            });
        }

        let sql = `
            SELECT s.id, s.registration_number, s.first_name, s.last_name, c.class_name, sec.section_name,
                   f.id as fee_id, f.total_fee, f.paid_amount, f.pending_amount, f.payment_status
            FROM students s
            JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
            JOIN classes c ON se.class_id = c.id
            JOIN sections sec ON se.section_id = sec.id
            LEFT JOIN fees f ON s.id = f.student_id AND f.academic_year = $2
            WHERE se.class_id = $1
        `;
        const params = [classId, academicYear];

        if (sectionId) {
            sql += ` AND se.section_id = $3`;
            params.push(sectionId);
        }

        sql += ` ORDER BY sec.section_name, s.first_name`;

        const data = await query(sql, params);

        res.status(200).json({
            success: true,
            academicYear,
            count: data.length,
            data
        });
    } catch (error) {
        console.error('Get class fee status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve fee status',
            error: error.message
        });
    }
};

/**
 * Get students with pending fees
 */
const getPendingFees = async (req, res) => {
    try {
        const academicYear = req.query.academicYear || process.env.CURRENT_ACADEMIC_YEAR || new Date().getFullYear().toString();
        const { class: classId, section: sectionId } = req.query;

        let sql = `
            SELECT s.id, s.registration_number, s.first_name, s.last_name, c.class_name, sec.section_name,
                   f.id as fee_id, f.total_fee, f.paid_amount, f.pending_amount, f.payment_status
            FROM students s
            JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
            JOIN classes c ON se.class_id = c.id
            JOIN sections sec ON se.section_id = sec.id
            JOIN fees f ON s.id = f.student_id AND f.academic_year = $1
            WHERE f.payment_status IN ('pending', 'partial')
        `;
        const params = [academicYear];
        let paramIdx = 2;

        if (classId) {
            sql += ` AND se.class_id = $${paramIdx++}`;
            params.push(classId);
        }

        if (sectionId) {
            sql += ` AND se.section_id = $${paramIdx++}`;
            params.push(sectionId);
        }

        sql += ` ORDER BY c.class_name, sec.section_name, s.first_name`;

        const data = await query(sql, params);

        res.status(200).json({
            success: true,
            academicYear,
            count: data.length,
            data
        });
    } catch (error) {
        console.error('Get pending fees error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve pending fees',
            error: error.message
        });
    }
};

/**
 * Create fee record
 */
const createFee = async (req, res) => {
    try {
        const { studentId, totalFee, paidAmount, academicYear } = req.body;

        const feeTotal = parseFloat(totalFee || 0);
        const amountPaid = parseFloat(paidAmount || 0);
        const pending = feeTotal - amountPaid;

        let status = 'pending';
        let lastPaymentDate = null;

        if (pending <= 0) {
            status = 'paid';
            lastPaymentDate = new Date();
        } else if (amountPaid > 0) {
            status = 'partial';
            lastPaymentDate = new Date();
        }

        const newFee = await query(
            `INSERT INTO fees (
                student_id, total_fee, paid_amount, pending_amount, academic_year, payment_status, last_payment_date, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
            [studentId, feeTotal, amountPaid, pending, academicYear, status, lastPaymentDate]
        );

        res.status(201).json({
            success: true,
            message: 'Fee record created successfully',
            data: newFee[0]
        });
    } catch (error) {
        console.error('Create fee error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create fee record',
            error: error.message
        });
    }
};

/**
 * Update fee payment
 */
const updateFeePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { paidAmount, totalFee, academicYear } = req.body;

        // Fetch current fee record
        const fees = await query('SELECT * FROM fees WHERE id = $1', [id]);
        if (fees.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fee record not found'
            });
        }

        const fee = fees[0];
        const newPaidAmount = paidAmount !== undefined ? parseFloat(paidAmount) : parseFloat(fee.paid_amount);
        const newTotalFee = totalFee !== undefined ? parseFloat(totalFee) : parseFloat(fee.total_fee);
        const newAcademicYear = academicYear || fee.academic_year;
        const newPendingAmount = newTotalFee - newPaidAmount;

        let status = 'pending';
        let lastPaymentDate = fee.last_payment_date;

        if (newPendingAmount <= 0) {
            status = 'paid';
            lastPaymentDate = new Date();
        } else if (newPaidAmount > 0) {
            status = 'partial';
            lastPaymentDate = new Date();
        }

        const updated = await query(
            `UPDATE fees SET 
                paid_amount = $1, 
                total_fee = $2, 
                academic_year = $3, 
                pending_amount = $4, 
                payment_status = $5, 
                last_payment_date = $6,
                updated_at = NOW()
             WHERE id = $7 RETURNING *`,
            [newPaidAmount, newTotalFee, newAcademicYear, newPendingAmount, status, lastPaymentDate, id]
        );

        res.status(200).json({
            success: true,
            message: 'Fee payment updated successfully',
            data: updated[0]
        });
    } catch (error) {
        console.error('Update fee payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update fee payment',
            error: error.message
        });
    }
};

/**
 * Get fee statistics
 */
const getFeeStatistics = async (req, res) => {
    try {
        const academicYear = req.query.academicYear || process.env.CURRENT_ACADEMIC_YEAR || new Date().getFullYear().toString();
        const { class: classId } = req.query;

        let sql = `
            SELECT f.*, se.class_id
            FROM fees f
            JOIN student_enrollments se ON f.student_id = se.student_id AND se.is_current = TRUE
            WHERE f.academic_year = $1
        `;
        const params = [academicYear];

        if (classId) {
            sql += ` AND se.class_id = $2`;
            params.push(classId);
        }

        const fees = await query(sql, params);

        const stats = {
            totalStudents: fees.length,
            totalFeeAmount: 0,
            totalPaidAmount: 0,
            totalPendingAmount: 0,
            paidCount: 0,
            partialCount: 0,
            pendingCount: 0,
            paidValue: 0,
            partialValue: 0,
            pendingValue: 0
        };

        fees.forEach(fee => {
            const total = parseFloat(fee.total_fee || 0);
            const paid = parseFloat(fee.paid_amount || 0);
            const pending = parseFloat(fee.pending_amount || 0);

            stats.totalFeeAmount += total;
            stats.totalPaidAmount += paid;
            stats.totalPendingAmount += pending;

            if (fee.payment_status === 'paid') {
                stats.paidCount++;
                stats.paidValue += paid;
            } else if (fee.payment_status === 'partial') {
                stats.partialCount++;
                stats.partialValue += paid;
                stats.pendingValue += pending;
            } else {
                stats.pendingCount++;
                stats.pendingValue += pending;
            }
        });

        stats.collectionRate = stats.totalFeeAmount > 0
            ? ((stats.totalPaidAmount / stats.totalFeeAmount) * 100).toFixed(2)
            : 0;

        res.status(200).json({
            success: true,
            academicYear,
            data: stats
        });
    } catch (error) {
        console.error('Get fee statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve fee statistics',
            error: error.message
        });
    }
};

/**
 * Send fee reminder manually
 */
const sendReminder = async (req, res) => {
    try {
        const { id } = req.params; // Fee ID

        const fees = await query('SELECT * FROM fees WHERE id = $1', [id]);
        if (fees.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fee record not found'
            });
        }

        const fee = fees[0];

        if (fee.payment_status === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Fee is already paid'
            });
        }

        const result = await sendFeeReminder(fee.student_id, fee.total_fee, fee.pending_amount);

        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Fee reminder sent successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send reminder',
                error: result.message || result.error
            });
        }
    } catch (error) {
        console.error('Send fee reminder error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send reminder',
            error: error.message
        });
    }
};

const getClassWiseFeeStatistics = async (req, res) => {
    try {
        const academicYear = req.query.academicYear || process.env.CURRENT_ACADEMIC_YEAR || new Date().getFullYear().toString();

        const sql = `
            SELECT 
                c.class_name,
                COUNT(DISTINCT se.student_id) as student_count,
                COALESCE(SUM(f.total_fee), 0) as expected_amount,
                COALESCE(SUM(f.paid_amount), 0) as collected_amount,
                COALESCE(SUM(f.pending_amount), 0) as pending_amount,
                COALESCE(
                    (SELECT AVG(avg_perf.avg_percentage)
                     FROM (
                         SELECT sg2.student_id, AVG(sg2.percentage) as avg_percentage
                         FROM student_grades sg2
                         JOIN student_enrollments se2 ON sg2.student_id = se2.student_id 
                         WHERE se2.class_id = c.id 
                           AND se2.is_current = TRUE
                           AND sg2.academic_year = $1
                         GROUP BY sg2.student_id
                     ) avg_perf
                    ), 0
                ) as avg_performance
            FROM classes c
            LEFT JOIN student_enrollments se ON c.id = se.class_id AND se.is_current = TRUE
            LEFT JOIN fees f ON se.student_id = f.student_id AND f.academic_year = $1
            GROUP BY c.class_name, c.id
            ORDER BY 
                CAST(NULLIF(REGEXP_REPLACE(c.class_name, '[^0-9]', '', 'g'), '') AS INTEGER) NULLS LAST,
                c.class_name
        `;

        const classWiseStats = await query(sql, [academicYear]);

        res.status(200).json({
            success: true,
            academicYear,
            data: classWiseStats
        });
    } catch (error) {
        console.error('Get class-wise fee statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve class-wise fee statistics',
            error: error.message
        });
    }
};

module.exports = {
    getStudentFeeStatus,
    getClassFeeStatus,
    getPendingFees,
    updateFeePayment,
    getFeeStatistics,
    getClassWiseFeeStatistics,
    sendReminder,
    createFee
};
