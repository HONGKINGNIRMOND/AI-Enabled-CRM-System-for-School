const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateProfile
} = require('../controllers/userController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Admin and management can access all user routes
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', authorize('admin'), createUser); // Only admin can create users
router.put('/:id', updateUser);
router.delete('/:id', authorize('admin'), deleteUser); // Only admin can delete users

// Any authenticated user can update their own profile
router.put('/profile', updateProfile);

module.exports = router;