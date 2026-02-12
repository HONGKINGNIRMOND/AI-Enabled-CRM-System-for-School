const express = require('express');
const router = express.Router();
const {
    getStudentFeeStatus,
    getClassFeeStatus,
    getPendingFees,
    updateFeePayment,
    getFeeStatistics
} = require('../controllers/feeController');

// Get fee status for a student
router.get('/student/:registrationNumber', getStudentFeeStatus);

// Get fee status for a class
router.get('/class', getClassFeeStatus);

// Get students with pending fees
router.get('/pending', getPendingFees);

// Get fee statistics
router.get('/statistics', getFeeStatistics);

// Update fee payment
router.put('/:id', updateFeePayment);

module.exports = router;
