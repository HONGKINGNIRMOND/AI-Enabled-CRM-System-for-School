const { User } = require('../models');
const { validationResult } = require('express-validator');
const { verifyToken } = require('../config/auth');

const getAllUsers = async (req, res) => {
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
                attributes: ['id', 'role']
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

        const { page = 1, limit = 10, role, search } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const whereCondition = {};

        if (role) {
            whereCondition.role = role;
        }

        if (search) {
            whereCondition.name = {
                [require('sequelize').Op.iLike]: `%${search}%`
            };
        }

        const { count, rows: users } = await User.findAndCountAll({
            where: whereCondition,
            attributes: ['id', 'email', 'name', 'role', 'isActive', 'createdAt'],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: {
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / parseInt(limit)),
                    totalUsers: count,
                    hasNextPage: parseInt(page) * parseInt(limit) < count,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getUserById = async (req, res) => {
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
                attributes: ['id', 'role']
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

        const user = await User.findByPk(id, {
            attributes: ['id', 'email', 'name', 'role', 'isActive', 'createdAt', 'updatedAt']
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User retrieved successfully',
            data: { user }
        });
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const createUser = async (req, res) => {
    try {
        const { 
            email, password, name, role,
            gender, date_of_birth, phone, address, city, state, pincode, joining_date
        } = req.body;

        // Basic validation
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and name are required'
            });
        }

        if (typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                message: 'Valid email is required'
            });
        }

        if (typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        if (typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Name is required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        const user = await User.create({
            email,
            password,
            name,
            role: role || 'agent',
            gender,
            date_of_birth,
            phone,
            address,
            city,
            state,
            pincode,
            joining_date
        });

        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt
        };

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { user: userData }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateUser = async (req, res) => {
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
                attributes: ['id', 'role']
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
        const { 
            email, name, role, isActive,
            gender, date_of_birth, phone, address, city, state, pincode, joining_date
        } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Allow users to update their own profile or if they are admin
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this user'
            });
        }

        // Check if email is being changed and if it already exists
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }
        }

        await user.update({
            email: email || user.email,
            name: name || user.name,
            role: req.user.role === 'admin' ? (role !== undefined ? role : user.role) : user.role, // Only admin can change roles
            isActive: req.user.role === 'admin' ? (isActive !== undefined ? isActive : user.isActive) : user.isActive, // Only admin can change active status
            gender: gender !== undefined ? gender : user.gender,
            date_of_birth: date_of_birth !== undefined ? date_of_birth : user.date_of_birth,
            phone: phone !== undefined ? phone : user.phone,
            address: address !== undefined ? address : user.address,
            city: city !== undefined ? city : user.city,
            state: state !== undefined ? state : user.state,
            pincode: pincode !== undefined ? pincode : user.pincode,
            joining_date: joining_date !== undefined ? joining_date : user.joining_date
        });

        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            updatedAt: user.updatedAt
        };

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: { user: userData }
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const deleteUser = async (req, res) => {
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
                attributes: ['id', 'role']
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

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Only admin can deactivate users
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can deactivate users'
            });
        }

        // Soft delete or hard delete based on requirements
        // For now, we'll do a soft delete by setting isActive to false
        await user.update({ isActive: false });

        res.status(200).json({
            success: true,
            message: 'User deactivated successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { id } = req.user; // Get ID from authenticated user
        const { name, email } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if email is being changed and if it already exists
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }
        }

        await user.update({
            name: name || user.name,
            email: email || user.email,
            gender: gender !== undefined ? gender : user.gender,
            date_of_birth: date_of_birth !== undefined ? date_of_birth : user.date_of_birth,
            phone: phone !== undefined ? phone : user.phone,
            address: address !== undefined ? address : user.address,
            city: city !== undefined ? city : user.city,
            state: state !== undefined ? state : user.state,
            pincode: pincode !== undefined ? pincode : user.pincode,
            joining_date: joining_date !== undefined ? joining_date : user.joining_date
        });

        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            updatedAt: user.updatedAt
        };

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: { user: userData }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateProfile
};