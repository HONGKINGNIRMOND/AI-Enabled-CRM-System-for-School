const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { hashPassword } = require('../config/auth');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        field: 'password_hash', // Map to correct column name
        allowNull: false
    },
    roleId: {
        type: DataTypes.INTEGER,
        field: 'role_id',
        allowNull: false,
        references: {
            model: 'roles',
            key: 'id'
        }
    },
    departmentId: {
        type: DataTypes.INTEGER,
        field: 'department_id',
        allowNull: true,
        references: {
            model: 'departments',
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING(255),
        field: 'full_name', // Map to correct column name
        allowNull: false
    },
    gender: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    dateOfBirth: {
        type: DataTypes.DATE,
        field: 'date_of_birth',
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(20),
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
        type: DataTypes.STRING(20),
        allowNull: true
    },
    joiningDate: {
        type: DataTypes.DATE,
        field: 'joining_date',
        allowNull: true,
        defaultValue: DataTypes.NOW
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        field: 'is_active',
        defaultValue: true
    },
    lastLogin: {
        type: DataTypes.DATE,
        field: 'last_login',
        allowNull: true
    },
    primarySubject: {
        type: DataTypes.STRING(100),
        field: 'primary_subject',
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['email']
        },
        {
            unique: true,
            fields: ['username']
        }
    ]
});

// Hash password before saving
User.beforeCreate(async (user) => {
    if (user.password && !user.password.startsWith('$2')) {
        user.password = await hashPassword(user.password);
    }
});

User.beforeUpdate(async (user) => {
    if (user.changed('password') && user.password && !user.password.startsWith('$2')) {
        user.password = await hashPassword(user.password);
    }
});

module.exports = User;