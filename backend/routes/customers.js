const express = require('express');
const router = express.Router();
const {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    convertLeadToCustomer
} = require('../controllers/customerController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// All authenticated users can view customers
router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);

// All authenticated users can create and update customers
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

// Convert lead to customer endpoint
router.post('/convert-from-lead', convertLeadToCustomer);

module.exports = router;