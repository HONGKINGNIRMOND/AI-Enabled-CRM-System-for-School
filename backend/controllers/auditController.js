const { AuditLog } = require('../models/school');
const { User } = require('../models');
const { Op } = require('sequelize');

/**
 * Get audit logs with filters
 */
const getAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const action = req.query.action || '';
        const entityType = req.query.entityType || '';
        const userId = req.query.userId || '';
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';

        const whereClause = {};

        if (action) {
            whereClause.action = { [Op.iLike]: `%${action}%` };
        }

        if (entityType) {
            whereClause.entityType = { [Op.iLike]: `%${entityType}%` };
        }

        if (userId) {
            whereClause.userId = userId;
        }

        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) {
                whereClause.createdAt[Op.gte] = new Date(startDate);
            }
            if (endDate) {
                whereClause.createdAt[Op.lte] = new Date(endDate);
            }
        }

        const { count, rows } = await AuditLog.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email', 'role'],
                    required: false
                }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.status(200).json({
            success: true,
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit)
            },
            data: rows
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve audit logs',
            error: error.message
        });
    }
};

/**
 * Get audit log by ID
 */
const getAuditLog = async (req, res) => {
    try {
        const { id } = req.params;

        const auditLog = await AuditLog.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email', 'role'],
                    required: false
                }
            ]
        });

        if (!auditLog) {
            return res.status(404).json({
                success: false,
                message: 'Audit log not found'
            });
        }

        res.status(200).json({
            success: true,
            data: auditLog
        });
    } catch (error) {
        console.error('Get audit log error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve audit log',
            error: error.message
        });
    }
};

module.exports = {
    getAuditLogs,
    getAuditLog
};
