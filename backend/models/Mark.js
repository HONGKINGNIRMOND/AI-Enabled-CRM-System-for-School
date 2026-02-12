const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Mark = sequelize.define('Mark', {
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
    subjectId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'subjects',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    marks: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    maxMarks: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 100
    },
    examType: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Final'
    },
    academicYear: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'marks',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['studentId', 'subjectId', 'examType', 'academicYear']
        },
        {
            fields: ['studentId']
        },
        {
            fields: ['subjectId']
        }
    ]
});

module.exports = Mark;
