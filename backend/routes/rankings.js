const express = require('express');
const router = express.Router();
const {
    getClassRankings,
    recalculateClassRankings,
    recalculateAllRankingsEndpoint,
    getTopPerformers
} = require('../controllers/rankingController');

// Get class rankings
router.get('/class', getClassRankings);

// Get top performers
router.get('/top', getTopPerformers);

// Recalculate rankings for a class
router.post('/recalculate/class', recalculateClassRankings);

// Recalculate all rankings
router.post('/recalculate/all', recalculateAllRankingsEndpoint);

module.exports = router;
