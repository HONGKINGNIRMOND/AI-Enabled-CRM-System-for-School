const express = require('express');
const router = express.Router();
const {
    getAuditLogs,
    getAuditLog
} = require('../controllers/auditController');

// Get audit logs with filters
router.get('/', getAuditLogs);

// Get audit log by ID
router.get('/:id', getAuditLog);

module.exports = router;
