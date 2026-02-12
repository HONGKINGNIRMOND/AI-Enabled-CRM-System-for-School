const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const {
    getAllLeads,
    getLeadById,
    createLead,
    updateLead,
    deleteLead,
    assignLead,
    bulkUpload
} = require('../controllers/leadController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Bulk upload route
router.post('/bulk-upload', upload.single('file'), bulkUpload);

// All authenticated users can view leads
router.get('/', getAllLeads);
router.get('/:id', getLeadById);

// All authenticated users can create and update leads
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

// All authenticated users can assign leads
router.post('/:id/assign', assignLead);

module.exports = router;