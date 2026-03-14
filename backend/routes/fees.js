const express = require('express');
const router = express.Router();

// DB helpers (used for class fee initialization)
const { query, transaction } = require('../config/database');

// Use the fee controller that matches the frontend API contract
const {
    getStudentFeeStatus,
    getClassFeeStatus,
    getPendingFees,
    createFee,
    updateFeePayment,
    getFeeStatistics,
    getClassWiseFeeStatistics,
    sendReminder
} = require('../controllers/feeController');

// Standard authentication middleware (no role restrictions for now)
const { authenticateToken } = require('../middleware/auth');

// All routes below require authentication
router.use(authenticateToken);

// Match frontend `feesAPI` endpoints
// GET /api/fees/student/:registrationNumber
router.get('/student/:registrationNumber', getStudentFeeStatus);

// GET /api/fees/class
router.get('/class', getClassFeeStatus);

// GET /api/fees/pending
router.get('/pending', getPendingFees);

// POST /api/fees
router.post('/', createFee);

// PUT /api/fees/:id
router.put('/:id', updateFeePayment);

// Initialize fees for all students in a class based on class fee structure
// POST /api/fees/initialize-class-fees
router.post('/initialize-class-fees', async (req, res) => {
    try {
        const { classId } = req.body;
        const academicYear = req.body.academicYear || process.env.CURRENT_ACADEMIC_YEAR || '2026-2027';

        if (!classId) {
            return res.status(400).json({
                success: false,
                message: 'classId is required'
            });
        }

        // Get class fee structure
        const feeStructure = await query(
            `SELECT SUM(amount) as total_fee
             FROM class_fee_structure
             WHERE class_id = $1 AND academic_year = $2 AND is_active = TRUE`,
            [classId, academicYear]
        );

        const totalFee = parseFloat(feeStructure[0]?.total_fee || 0);

        if (totalFee === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fee structure defined for this class'
            });
        }

        // Get all students in the class
        const students = await query(
            `SELECT s.id
             FROM students s
             JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
             WHERE se.class_id = $1`,
            [classId]
        );

        let createdCount = 0;
        let updatedCount = 0;

        await transaction(async (conn) => {
            for (const student of students) {
                // Check if fee record exists
                const existing = await conn.query(
                    'SELECT id, paid_amount FROM fees WHERE student_id = $1 AND academic_year = $2',
                    [student.id, academicYear]
                );

                if (existing.length === 0) {
                    // Create new fee record
                    await conn.query(
                        `INSERT INTO fees (student_id, total_fee, paid_amount, pending_amount, payment_status, academic_year)
                         VALUES ($1, $2, 0, $2, 'pending', $3)`,
                        [student.id, totalFee, academicYear]
                    );
                    createdCount++;
                } else {
                    // Update existing fee record
                    const paidAmount = parseFloat(existing[0].paid_amount || 0);
                    const pendingAmount = totalFee - paidAmount;
                    const paymentStatus = pendingAmount === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';

                    await conn.query(
                        `UPDATE fees 
                         SET total_fee = $1, pending_amount = $2, payment_status = $3
                         WHERE id = $4`,
                        [totalFee, pendingAmount, paymentStatus, existing[0].id]
                    );
                    updatedCount++;
                }
            }
        });

        res.json({
            success: true,
            message: `Fees initialized successfully. Created: ${createdCount}, Updated: ${updatedCount}`,
            data: {
                totalFee,
                studentsProcessed: students.length,
                created: createdCount,
                updated: updatedCount
            }
        });
    } catch (error) {
        console.error('Initialize class fees error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initialize fees'
        });
    }
});

// GET /api/fees/statistics
router.get('/statistics', getFeeStatistics);

// GET /api/fees/class-wise-statistics
router.get('/class-wise-statistics', getClassWiseFeeStatistics);

// POST /api/fees/:id/remind
router.post('/:id/remind', sendReminder);

module.exports = router;
