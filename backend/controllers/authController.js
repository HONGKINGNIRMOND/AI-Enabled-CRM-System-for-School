const { User, Role } = require('../models');
const {
    generateAccessToken,
    generateRefreshToken,
    comparePassword
} = require('../config/auth');
const { validationResult } = require('express-validator');

const register = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password, name, role: roleName } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Get role ID
        const role = await Role.findOne({ where: { roleName: roleName || 'teacher' } });
        if (!role) {
            return res.status(400).json({
                success: false,
                message: `Invalid role: ${roleName}`
            });
        }

        // Create new user
        const user = await User.create({
            username: email.split('@')[0], // Default username
            email,
            password,
            name,
            roleId: role.id
        });

        // Generate tokens
        const accessToken = generateAccessToken(user.id, role.roleName);
        const refreshToken = generateRefreshToken(user.id, role.roleName);

        // Return user data without password
        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: role.roleName,
            createdAt: user.createdAt
        };

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: userData,
                tokens: {
                    access: {
                        token: accessToken,
                        expires: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
                    },
                    refresh: {
                        token: refreshToken,
                        expires: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const login = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user by email and include role
        const user = await User.findOne({ 
            where: { email },
            include: [{ model: Role, as: 'role' }]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Compare passwords
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const roleName = user.role ? user.role.roleName : 'teacher';

        // Generate tokens
        const accessToken = generateAccessToken(user.id, roleName);
        const refreshToken = generateRefreshToken(user.id, roleName);

        // Return user data without password
        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: roleName,
            createdAt: user.createdAt
        };

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: userData,
                tokens: {
                    access: {
                        token: accessToken,
                        expires: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
                    },
                    refresh: {
                        token: refreshToken,
                        expires: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const logout = async (req, res) => {
    // In a real application, you might want to blacklist the refresh token
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};

const getMe = async (req, res) => {
    try {
        const user = req.user;

        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt
        };

        res.status(200).json({
            success: true,
            message: 'User data retrieved successfully',
            data: { user: userData }
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const refresh = async (req, res) => {
    try {
        const refreshToken = req.body.refreshToken || req.query.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        try {
            const decoded = require('jsonwebtoken').verify(refreshToken, process.env.JWT_REFRESH_SECRET);

            if (decoded.type !== 'refresh') {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid refresh token type'
                });
            }

            const user = await User.findByPk(decoded.userId, {
                attributes: ['id', 'email', 'role', 'name']
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Generate new tokens
            const newAccessToken = generateAccessToken(user.id, user.role);
            const newRefreshToken = generateRefreshToken(user.id, user.role);

            res.status(200).json({
                success: true,
                message: 'Tokens refreshed successfully',
                data: {
                    tokens: {
                        access: {
                            token: newAccessToken,
                            expires: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
                        },
                        refresh: {
                            token: newRefreshToken,
                            expires: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
                        }
                    }
                }
            });
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }
    } catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    getMe,
    refresh
};