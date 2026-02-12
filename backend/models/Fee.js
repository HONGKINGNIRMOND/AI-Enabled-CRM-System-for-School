const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Fee = sequelize.define('Fee', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'students',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    totalFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    paidAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    pendingAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    academicYear: {
        type: DataTypes.STRING,
        allowNull: true
    },
    paymentStatus: {
        type: DataTypes.ENUM('paid', 'partial', 'pending'),
        defaultValue: 'pending',
        allowNull: false
    },
    lastPaymentDate: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'fees',
    timestamps: true,
    indexes: [
        {
            fields: ['studentId']
        },
        {
            fields: ['paymentStatus']
        },
        {
            fields: ['academicYear']
        }
    ],
    hooks: {
        beforeSave: (fee) => {
            // Calculate pending amount
            fee.pendingAmount = parseFloat(fee.totalFee) - parseFloat(fee.paidAmount);
            
            // Update payment status
            if (fee.pendingAmount <= 0) {
                fee.paymentStatus = 'paid';
            } else if (fee.paidAmount > 0) {
                fee.paymentStatus = 'partial';
            } else {
                fee.paymentStatus = 'pending';
            }
        }
    }
});

module.exports = Fee;
