const express = require('express');
const router = express.Router();
const {
    getStudentFeeStatus,
    getClassFeeStatus,
    getPendingFees,
    updateFeePayment,
    getFeeStatistics,
    getClassWiseFeeStatistics,
    sendReminder,
    createFee
} = require('../controllers/feeController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All fee routes require authentication
router.use(authenticateToken);
router.use(authorize('admin', 'teacher'));

// Get fee status for a student
router.get('/student/:registrationNumber', getStudentFeeStatus);

// Get fee status for a class
router.get('/class', getClassFeeStatus);

// Get students with pending fees
router.get('/pending', getPendingFees);

// Get fee statistics
router.get('/statistics', getFeeStatistics);

// Get class-wise fee statistics
router.get('/class-wise-statistics', getClassWiseFeeStatistics);

// Update fee payment
router.put('/:id', updateFeePayment);

// Create fee record
router.post('/', createFee);

// Send fee reminder
router.post('/:id/remind', sendReminder);

module.exports = router;
