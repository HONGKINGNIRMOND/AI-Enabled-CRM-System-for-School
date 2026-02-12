const express = require('express');
const router = express.Router();
const {
    getAllInteractions,
    getInteractionById,
    createInteraction,
    updateInteraction,
    deleteInteraction
} = require('../controllers/interactionController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// All authenticated users can view interactions
router.get('/', getAllInteractions);
router.get('/:id', getInteractionById);

// All authenticated users can create interactions
router.post('/', createInteraction);

// Users can update their own interactions, admins and management can update all
router.put('/:id', updateInteraction);

// Users can delete their own interactions, only admins can delete any interaction
router.delete('/:id', deleteInteraction);

module.exports = router;