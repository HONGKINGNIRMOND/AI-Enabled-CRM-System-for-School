const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            console.log('Auth Debug: No token provided');
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                console.log('Auth Debug: Token verification failed', err.message);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired token'
                });
            }

            // Fetch user details from database
            const users = await query(
                `SELECT u.id, u.username, u.email, u.full_name, u.phone, u.is_active, u.department_id,
                r.role_name 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.id = $1`,
                [decoded.userId]
            );

            if (users.length === 0) {
                console.log('Auth Debug: User not found', decoded.userId);
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (!users[0].is_active) {
                console.log('Auth Debug: User inactive', users[0].username);
                return res.status(401).json({
                    success: false,
                    message: 'User inactive'
                });
            }

            req.user = {
                id: users[0].id,
                username: users[0].username,
                email: users[0].email,
                fullName: users[0].full_name,
                phone: users[0].phone,
                role: users[0].role_name,
                departmentId: users[0].department_id
            };

            console.log(`Auth Debug: User ${req.user.username} authenticated with role ${req.user.role}`);
            next();
        });
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

// Role-based access control middleware
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return next();
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (!err) {
                const users = await query(
                    'SELECT id, username, email, full_name, role_id FROM users WHERE id = $1',
                    [decoded.userId]
                );

                if (users.length > 0) {
                    req.user = users[0];
                }
            }
            next();
        });
    } catch (error) {
        next();
    }
};

module.exports = {
    authenticateToken,
    authorize,
    optionalAuth
};
