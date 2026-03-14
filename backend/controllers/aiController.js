const aiService = require('../services/aiService');

/**
 * Get attendance predictions
 */
const getAttendancePredictions = async (req, res) => {
    try {
        const predictions = await aiService.predictAttendanceDrops();
        res.json({
            success: true,
            data: predictions
        });
    } catch (error) {
        console.error('Error fetching attendance predictions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate attendance predictions',
            error: error.message
        });
    }
};

/**
 * Get performance analysis for a student
 */
const getPerformanceAnalysis = async (req, res) => {
    try {
        const { studentId } = req.params;
        const analysis = await aiService.analyzeStudentPerformance(studentId);
        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        console.error('Error analyzing performance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze performance',
            error: error.message
        });
    }
};

/**
 * Get overall AI insights summary
 */
const getOverallInsights = async (req, res) => {
    try {
        const insights = await aiService.getOverallInsights();
        res.json({
            success: true,
            data: insights
        });
    } catch (error) {
        console.error('Error fetching overall insights:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate insights',
            error: error.message
        });
    }
};

module.exports = {
    getAttendancePredictions,
    getPerformanceAnalysis,
    getOverallInsights
};
