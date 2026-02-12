require('dotenv').config();

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT utility functions
const generateToken = (payload, secret, expiresIn) => {
    return jwt.sign(payload, secret, { expiresIn });
};

const generateAccessToken = (userId, role) => {
    return generateToken(
        { userId, role, type: 'access' },
        process.env.JWT_SECRET,
        process.env.JWT_ACCESS_EXPIRES_IN || '15m'
    );
};

const generateRefreshToken = (userId, role) => {
    return generateToken(
        { userId, role, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET,
        process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    );
};

const verifyToken = (token, secret) => {
    return jwt.verify(token, secret);
};

const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    hashPassword,
    comparePassword
};