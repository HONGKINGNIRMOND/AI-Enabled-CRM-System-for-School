const { Interaction, User, Lead, Customer } = require('../models');
const { verifyToken } = require('../config/auth');

const getAllInteractions = async (req, res) => {
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

        const { page = 1, limit = 10, type, customerId, leadId, userId, startDate, endDate } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const whereCondition = {};

        if (type) {
            whereCondition.type = type;
        }

        if (customerId) {
            whereCondition.customerId = customerId;
        }

        if (leadId) {
            whereCondition.leadId = leadId;
        }

        if (userId) {
            whereCondition.userId = userId;
        }

        if (startDate || endDate) {
            whereCondition.timestamp = {};
            if (startDate) {
                whereCondition.timestamp[require('sequelize').Op.gte] = new Date(startDate);
            }
            if (endDate) {
                whereCondition.timestamp[require('sequelize').Op.lte] = new Date(endDate);
            }
        }

        const { count, rows: interactions } = await Interaction.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Lead,
                    as: 'lead',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'email']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['timestamp', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: 'Interactions retrieved successfully',
            data: {
                interactions,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / parseInt(limit)),
                    totalInteractions: count,
                    hasNextPage: parseInt(page) * parseInt(limit) < count,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });
    } catch (error) {
        console.error('Get all interactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getInteractionById = async (req, res) => {
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

        const { id } = req.params;

        const interaction = await Interaction.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Lead,
                    as: 'lead',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        if (!interaction) {
            return res.status(404).json({
                success: false,
                message: 'Interaction not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Interaction retrieved successfully',
            data: { interaction }
        });
    } catch (error) {
        console.error('Get interaction by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const createInteraction = async (req, res) => {
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

        const { customerId, leadId, type, notes, outcome, nextAction } = req.body;

        // Validation
        if (!type || !['call', 'email', 'meeting', 'note', 'sms'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Valid interaction type is required (call, email, meeting, note, sms)'
            });
        }

        // Validate that either customerId or leadId is provided
        if (!customerId && !leadId) {
            return res.status(400).json({
                success: false,
                message: 'Either customerId or leadId must be provided'
            });
        }

        // Validate that both are not provided
        if (customerId && leadId) {
            return res.status(400).json({
                success: false,
                message: 'Only one of customerId or leadId should be provided'
            });
        }

        const interaction = await Interaction.create({
            customerId,
            leadId,
            type,
            notes,
            outcome,
            nextAction,
            userId: req.user.id // Automatically set to the authenticated user
        });

        res.status(201).json({
            success: true,
            message: 'Interaction created successfully',
            data: { interaction }
        });
    } catch (error) {
        console.error('Create interaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateInteraction = async (req, res) => {
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

        const { id } = req.params;
        const { customerId, leadId, type, notes, outcome, nextAction } = req.body;

        const interaction = await Interaction.findByPk(id);
        if (!interaction) {
            return res.status(404).json({
                success: false,
                message: 'Interaction not found'
            });
        }

        // Check if the user is authorized to update this interaction
        // Only the creator can update their own interaction
        if (interaction.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this interaction'
            });
        }

        await interaction.update({
            customerId: customerId !== undefined ? customerId : interaction.customerId,
            leadId: leadId !== undefined ? leadId : interaction.leadId,
            type: type || interaction.type,
            notes: notes || interaction.notes,
            outcome: outcome || interaction.outcome,
            nextAction: nextAction || interaction.nextAction
        });

        res.status(200).json({
            success: true,
            message: 'Interaction updated successfully',
            data: { interaction }
        });
    } catch (error) {
        console.error('Update interaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const deleteInteraction = async (req, res) => {
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

        const { id } = req.params;

        const interaction = await Interaction.findByPk(id);
        if (!interaction) {
            return res.status(404).json({
                success: false,
                message: 'Interaction not found'
            });
        }

        // Check if the user is authorized to delete this interaction
        // Only the creator can delete their own interaction
        if (interaction.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this interaction'
            });
        }

        await interaction.destroy();

        res.status(200).json({
            success: true,
            message: 'Interaction deleted successfully'
        });
    } catch (error) {
        console.error('Delete interaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    getAllInteractions,
    getInteractionById,
    createInteraction,
    updateInteraction,
    deleteInteraction
};