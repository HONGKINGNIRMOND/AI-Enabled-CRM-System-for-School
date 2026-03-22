const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const adminHodController = require('../controllers/adminHodController');

// All routes require authentication and 'admin' role
router.use(authenticateToken, authorize('admin'));

// HOD user CRUD
router.get('/', adminHodController.getAllHods);
router.post('/', adminHodController.createHod);
router.put('/:id', adminHodController.updateHod);
router.delete('/:id', adminHodController.deleteHod);

// Departments CRUD (useful for admin mappings)
router.get('/departments', adminHodController.getDepartments);
router.post('/departments', adminHodController.createDepartment);

module.exports = router;
