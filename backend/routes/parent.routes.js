const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const { getChildren } = require('../controllers/parentController');

router.get('/my-children', authenticateToken, authorize('parent'), getChildren);

module.exports = router;
