const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false
    },
    entityType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    entityId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    details: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fileName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    recordsProcessed: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    recordsInserted: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    recordsUpdated: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    recordsFailed: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'audit_logs',
    timestamps: true,
    indexes: [
        {
            fields: ['userId']
        },
        {
            fields: ['action']
        },
        {
            fields: ['entityType']
        },
        {
            fields: ['createdAt']
        }
    ]
});

module.exports = AuditLog;
