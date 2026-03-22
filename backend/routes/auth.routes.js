const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { validate, schemas } = require('../middleware/validator');
const { authenticateToken } = require('../middleware/auth');

// Login endpoint
router.post('/login', validate(schemas.login), async (req, res) => {
    try {
        const { email, password } = req.validatedData;

        // Find user by email
        const users = await query(
            `SELECT u.id, u.username, u.email, u.password_hash, u.full_name, 
              u.phone, u.is_active, u.department_id, r.role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = $1`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account is inactive. Please contact administrator.'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT tokens
        const accessToken = jwt.sign(
            { userId: user.id, role: user.role_name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
        );

        // Update last login
        await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.full_name,
                    phone: user.phone,
                    role: user.role_name,
                    departmentId: user.department_id
                },
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user profile'
        });
    }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token required'
            });
        }

        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid refresh token'
                });
            }

            // Generate new access token
            const accessToken = jwt.sign(
                { userId: decoded.userId },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );

            res.json({
                success: true,
                data: { accessToken }
            });
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Token refresh failed'
        });
    }
});

// Logout endpoint (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = router;
