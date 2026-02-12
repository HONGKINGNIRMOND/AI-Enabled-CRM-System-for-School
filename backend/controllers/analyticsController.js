const { CallRecord, Lead, User } = require('../models');
const { verifyToken } = require('../config/auth');

const getCommunicationMetrics = async (req, res) => {
    try {
        // Check authentication
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        try {
            const decoded = verifyToken(token, process.env.JWT_SECRET);

            // Check if user exists
            const currentUser = await User.findByPk(decoded.userId, {
                attributes: ['id', 'role', 'name']
            });

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            req.user = currentUser;
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        const { startDate, endDate, userId } = req.query;

        const whereCondition = {};
        if (startDate || endDate) {
            whereCondition.createdAt = {};
            if (startDate) {
                whereCondition.createdAt[require('sequelize').Op.gte] = new Date(startDate);
            }
            if (endDate) {
                whereCondition.createdAt[require('sequelize').Op.lte] = new Date(endDate);
            }
        }

        if (userId) {
            whereCondition.callerId = userId;
        }

        // Total calls
        const totalCalls = await CallRecord.count({ where: whereCondition });

        // Calls by status
        const callsByStatus = await CallRecord.findAll({
            attributes: ['callStatus', [require('sequelize').fn('COUNT', require('sequelize').col('callStatus')), 'count']],
            where: whereCondition,
            group: ['callStatus']
        });

        // Calls by direction
        const callsByDirection = await CallRecord.findAll({
            attributes: ['callDirection', [require('sequelize').fn('COUNT', require('sequelize').col('callDirection')), 'count']],
            where: whereCondition,
            group: ['callDirection']
        });

        // Average call duration
        const avgDurationResult = await CallRecord.findOne({
            attributes: [[require('sequelize').fn('AVG', require('sequelize').col('duration')), 'avgDuration']],
            where: whereCondition,
            raw: true
        });
        const avgDuration = avgDurationResult ? parseFloat(avgDurationResult.avgDuration) : 0;

        res.status(200).json({
            success: true,
            message: 'Communication metrics retrieved successfully',
            data: {
                totalCalls,
                callsByStatus: callsByStatus.map(item => ({ status: item.callStatus, count: parseInt(item.dataValues.count) })),
                callsByDirection: callsByDirection.map(item => ({ direction: item.callDirection, count: parseInt(item.dataValues.count) })),
                avgDuration: isNaN(avgDuration) ? 0 : avgDuration
            }
        });
    } catch (error) {
        console.error('Get communication metrics error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getConversionMetrics = async (req, res) => {
    try {
        // Check authentication
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        try {
            const decoded = verifyToken(token, process.env.JWT_SECRET);

            // Check if user exists
            const currentUser = await User.findByPk(decoded.userId, {
                attributes: ['id', 'role', 'name']
            });

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            req.user = currentUser;
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        const { startDate, endDate } = req.query;

        const whereCondition = {};
        if (startDate || endDate) {
            whereCondition.createdAt = {};
            if (startDate) {
                whereCondition.createdAt[require('sequelize').Op.gte] = new Date(startDate);
            }
            if (endDate) {
                whereCondition.createdAt[require('sequelize').Op.lte] = new Date(endDate);
            }
        }

        // Total leads
        const totalLeads = await Lead.count({ where: {} });

        // Converted leads
        const convertedLeads = await Lead.count({
            where: {
                status: 'converted',
                ...whereCondition
            }
        });

        // Conversion rate
        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

        // Leads by status
        const leadsByStatus = await Lead.findAll({
            attributes: ['status', [require('sequelize').fn('COUNT', require('sequelize').col('status')), 'count']],
            group: ['status']
        });

        res.status(200).json({
            success: true,
            message: 'Conversion metrics retrieved successfully',
            data: {
                totalLeads,
                convertedLeads,
                conversionRate: parseFloat(conversionRate.toFixed(2)),
                leadsByStatus: leadsByStatus.map(item => ({ status: item.status, count: parseInt(item.dataValues.count) }))
            }
        });
    } catch (error) {
        console.error('Get conversion metrics error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getSentimentAnalysis = async (req, res) => {
    try {
        // Check authentication
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        try {
            const decoded = verifyToken(token, process.env.JWT_SECRET);

            // Check if user exists
            const currentUser = await User.findByPk(decoded.userId, {
                attributes: ['id', 'role', 'name']
            });

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            req.user = currentUser;
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        const { startDate, endDate, userId } = req.query;

        const whereCondition = { sentimentScore: { [require('sequelize').Op.ne]: null } };
        if (startDate || endDate) {
            whereCondition.createdAt = {};
            if (startDate) {
                whereCondition.createdAt[require('sequelize').Op.gte] = new Date(startDate);
            }
            if (endDate) {
                whereCondition.createdAt[require('sequelize').Op.lte] = new Date(endDate);
            }
        }

        if (userId) {
            whereCondition.callerId = userId;
        }

        // Get all calls with sentiment scores
        const callsWithSentiment = await CallRecord.findAll({
            attributes: ['sentimentScore'],
            where: whereCondition,
            raw: true
        });

        if (callsWithSentiment.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Sentiment analysis retrieved successfully',
                data: {
                    totalCalls: 0,
                    averageSentiment: 0,
                    sentimentDistribution: { positive: 0, neutral: 0, negative: 0 }
                }
            });
        }

        // Calculate average sentiment
        const totalSentiment = callsWithSentiment.reduce((sum, call) => sum + call.sentimentScore, 0);
        const averageSentiment = totalSentiment / callsWithSentiment.length;

        // Categorize sentiments
        let positive = 0, neutral = 0, negative = 0;
        callsWithSentiment.forEach(call => {
            if (call.sentimentScore > 0.1) positive++;
            else if (call.sentimentScore < -0.1) negative++;
            else neutral++;
        });

        res.status(200).json({
            success: true,
            message: 'Sentiment analysis retrieved successfully',
            data: {
                totalCalls: callsWithSentiment.length,
                averageSentiment: parseFloat(averageSentiment.toFixed(2)),
                sentimentDistribution: {
                    positive,
                    neutral,
                    negative
                }
            }
        });
    } catch (error) {
        console.error('Get sentiment analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getPerformanceMetrics = async (req, res) => {
    try {
        // Check authentication
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        try {
            const decoded = verifyToken(token, process.env.JWT_SECRET);

            // Check if user exists
            const currentUser = await User.findByPk(decoded.userId, {
                attributes: ['id', 'role', 'name']
            });

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            req.user = currentUser;
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        const { startDate, endDate, userId } = req.query;

        const whereCondition = {};
        if (startDate || endDate) {
            whereCondition.createdAt = {};
            if (startDate) {
                whereCondition.createdAt[require('sequelize').Op.gte] = new Date(startDate);
            }
            if (endDate) {
                whereCondition.createdAt[require('sequelize').Op.lte] = new Date(endDate);
            }
        }

        // Get performance metrics by user
        const performanceByUser = await CallRecord.findAll({
            attributes: [
                'callerId',
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalCalls'],
                [require('sequelize').fn('AVG', require('sequelize').col('duration')), 'avgDuration'],
                [require('sequelize').fn('AVG', require('sequelize').col('sentimentScore')), 'avgSentiment']
            ],
            where: whereCondition,
            group: ['callerId'],
            include: [{
                model: User,
                attributes: ['id', 'name', 'email'],
                as: 'caller'
            }]
        });

        // Format the results
        const formattedPerformance = performanceByUser.map(item => ({
            user: item.caller ? {
                id: item.caller.id,
                name: item.caller.name,
                email: item.caller.email
            } : null,
            totalCalls: parseInt(item.dataValues.totalCalls),
            avgDuration: parseFloat(item.dataValues.avgDuration || 0),
            avgSentiment: parseFloat(item.dataValues.avgSentiment || 0)
        }));

        res.status(200).json({
            success: true,
            message: 'Performance metrics retrieved successfully',
            data: {
                performanceByUser: formattedPerformance
            }
        });
    } catch (error) {
        console.error('Get performance metrics error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    getCommunicationMetrics,
    getConversionMetrics,
    getSentimentAnalysis,
    getPerformanceMetrics
};