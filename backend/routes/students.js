const express = require('express');
const router = express.Router();
const {
    upload,
    uploadStudentData,
    createStudent,
    getStudent,
    getStudents,
    getAllStudents,
    updateStudent,
    deleteStudent
} = require('../controllers/studentController');

// File upload route
router.post('/upload', upload.single('file'), uploadStudentData);

// Create a new student
router.post('/', createStudent);

// Get all students with pagination and filters
router.get('/', getAllStudents);

// Get students by class
router.get('/class', getStudents);

// Get student by registration number
router.get('/registration/:registrationNumber', getStudent);

// Update student
router.put('/:id', updateStudent);

// Delete student
router.delete('/:id', deleteStudent);

module.exports = router;
