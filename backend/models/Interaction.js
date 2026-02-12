const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Interaction = sequelize.define('Interaction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    customerId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'customers',
            key: 'id'
        }
    },
    leadId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'leads',
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM('call', 'email', 'meeting', 'note', 'sms'),
        allowNull: false
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    outcome: {
        type: DataTypes.STRING,
        allowNull: true
    },
    nextAction: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'interactions',
    timestamps: true
});

module.exports = Interaction;