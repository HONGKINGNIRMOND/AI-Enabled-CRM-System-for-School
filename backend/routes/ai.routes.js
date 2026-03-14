const express = require('express');
const router = express.Router();
const { getAttendancePredictions, getPerformanceAnalysis, getOverallInsights } = require('../controllers/aiController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All AI routes require authentication and admin/teacher role
router.use(authenticateToken);
router.use(authorize('admin', 'teacher'));

router.get('/attendance-predictions', getAttendancePredictions);
router.get('/performance-analysis/:studentId', getPerformanceAnalysis);
router.get('/insights', getOverallInsights);

module.exports = router;
