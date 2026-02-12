const express = require('express');
const router = express.Router();
const {
    getCommunicationMetrics,
    getConversionMetrics,
    getSentimentAnalysis,
    getPerformanceMetrics
} = require('../controllers/analyticsController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication and admin/management role
router.use(authenticateToken);
router.use(authorize('admin', 'management'));

// Only management and admin can access analytics
router.get('/communications', getCommunicationMetrics);
router.get('/conversions', getConversionMetrics);
router.get('/sentiment', getSentimentAnalysis);
router.get('/performance', getPerformanceMetrics);

module.exports = router;