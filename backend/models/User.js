const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { hashPassword } = require('../config/auth');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [8, 128],
            isStrongPassword(value) {
                // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
                const hasUpperCase = /[A-Z]/.test(value);
                const hasLowerCase = /[a-z]/.test(value);
                const hasNumber = /[0-9]/.test(value);
                const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
                
                if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
                    throw new Error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
                }
            }
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'teacher', 'agent', 'management'),
        defaultValue: 'teacher',
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['email']
        }
    ]
});

// Hash password before saving
User.beforeCreate(async (user) => {
    if (user.password && !user.password.startsWith('$2')) {
        // Only hash if not already hashed (bcrypt hashes start with $2)
        user.password = await hashPassword(user.password);
    }
});

User.beforeUpdate(async (user) => {
    if (user.changed('password') && user.password && !user.password.startsWith('$2')) {
        // Only hash if not already hashed (bcrypt hashes start with $2)
        user.password = await hashPassword(user.password);
    }
});

module.exports = User;