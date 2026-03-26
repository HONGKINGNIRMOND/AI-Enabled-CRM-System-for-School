const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Student = sequelize.define('Student', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    registrationNumber: {
        type: DataTypes.STRING(50),
        field: 'registration_number',
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true
        }
    },
    firstName: {
        type: DataTypes.STRING(100),
        field: 'first_name',
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    lastName: {
        type: DataTypes.STRING(100),
        field: 'last_name',
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    dateOfBirth: {
        type: DataTypes.DATE,
        field: 'date_of_birth',
        allowNull: false
    },
    gender: {
        type: DataTypes.ENUM('Male', 'Female', 'Other'),
        allowNull: false
    },
    bloodGroup: {
        type: DataTypes.STRING(5),
        field: 'blood_group',
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    state: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    pincode: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    admissionDate: {
        type: DataTypes.DATE,
        field: 'admission_date',
        allowNull: false
    },
    photoUrl: {
        type: DataTypes.STRING(255),
        field: 'photo_url',
        allowNull: true
    },
    assignedTeacherId: {
        type: DataTypes.INTEGER,
        field: 'assigned_teacher_id',
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    fatherName: {
        type: DataTypes.STRING(255),
        field: 'father_name',
        allowNull: true
    },
    fatherPhone: {
        type: DataTypes.STRING(20),
        field: 'father_phone',
        allowNull: true
    },
    fatherWhatsapp: {
        type: DataTypes.STRING(20),
        field: 'father_whatsapp',
        allowNull: true
    },
    fatherEmail: {
        type: DataTypes.STRING(255),
        field: 'father_email',
        allowNull: true
    },
    fatherOccupation: {
        type: DataTypes.STRING(100),
        field: 'father_occupation',
        allowNull: true
    },
    motherName: {
        type: DataTypes.STRING(255),
        field: 'mother_name',
        allowNull: true
    },
    motherPhone: {
        type: DataTypes.STRING(20),
        field: 'mother_phone',
        allowNull: true
    },
    motherWhatsapp: {
        type: DataTypes.STRING(20),
        field: 'mother_whatsapp',
        allowNull: true
    },
    motherEmail: {
        type: DataTypes.STRING(255),
        field: 'mother_email',
        allowNull: true
    },
    motherOccupation: {
        type: DataTypes.STRING(100),
        field: 'mother_occupation',
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        field: 'is_active',
        defaultValue: true
    },
    createdAt: {
        type: DataTypes.DATE,
        field: 'created_at',
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        field: 'updated_at',
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'students',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
        {
            unique: true,
            fields: ['registration_number']
        },
        {
            fields: ['first_name', 'last_name']
        },
        {
            fields: ['is_active']
        }
    ]
});

module.exports = Student;
