const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const hodController = require('../controllers/hodController');

// All endpoints require HOD role
router.use(authenticateToken, authorize('hod'));

router.get('/dashboard', hodController.getDashboardOverview);
router.get('/subjects', hodController.getSubjectsAndFaculty);
router.get('/attendance', hodController.getStudentAttendance);
router.get('/marks', hodController.getDepartmentMarks);
router.post('/approve-marks', hodController.approveMarks);

module.exports = router;
