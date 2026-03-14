import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { studentsAPI } from '../../services/api';
import { Search, Plus, Upload, ArrowLeft, Trash2, Ban, CheckCircle } from 'lucide-react';
import BulkUploadModal from '../common/BulkUploadModal';
import StudentFormModal from './StudentFormModal';

const StudentList = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    useEffect(() => {
        fetchStudents();
    }, [search]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await studentsAPI.getAll({ search, page: 1, limit: 20 });
            setStudents(response.data.data.students);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveStudent = async (formData) => {
        try {
            if (selectedStudent) {
                await studentsAPI.update(selectedStudent.id, formData);
            } else {
                await studentsAPI.create(formData);
            }
            setShowStudentModal(false);
            setSelectedStudent(null);
            fetchStudents();
        } catch (error) {
            console.error('Failed to save student:', error);
            alert(error.response?.data?.message || 'Failed to save student');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
            try {
                await studentsAPI.delete(id);
                fetchStudents();
            } catch (error) {
                console.error('Failed to delete student:', error);
                alert('Failed to delete student');
            }
        }
    };

    const handleToggleStatus = async (student) => {
        try {
            await studentsAPI.update(student.id, { is_active: !student.is_active });
            fetchStudents();
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update student status');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition mb-6 group"
                    >
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 group-hover:border-blue-200 group-hover:bg-blue-50 transition">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Back to Dashboard</span>
                    </button>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowBulkModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                            >
                                <Upload className="w-4 h-4 text-indigo-600" />
                                Bulk Upload
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedStudent(null);
                                    setShowStudentModal(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                <Plus className="w-4 h-4" />
                                Add Student
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search students by name or roll number..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="text-xl text-gray-600">Loading students...</div>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600">No students found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 text-gray-700">Roll No</th>
                                        <th className="text-left py-3 px-4 text-gray-700">Name</th>
                                        <th className="text-left py-3 px-4 text-gray-700">Class</th>
                                        <th className="text-left py-3 px-4 text-gray-700">Section</th>
                                        <th className="text-left py-3 px-4 text-gray-700">Assigned Teacher</th>
                                        <th className="text-left py-3 px-4 text-gray-700">Contact</th>
                                        <th className="text-left py-3 px-4 text-gray-700">Status</th>
                                        <th className="text-left py-3 px-4 text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => (
                                        <tr key={student.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4">{student.roll_number || '-'}</td>
                                            <td className="py-3 px-4 font-medium">
                                                {student.first_name} {student.last_name}
                                            </td>
                                            <td className="py-3 px-4">{student.class_name || '-'}</td>
                                            <td className="py-3 px-4">{student.section_name || '-'}</td>
                                            <td className="py-3 px-4">
                                                {student.assigned_teacher_name ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                                                            {student.assigned_teacher_name.charAt(0)}
                                                        </div>
                                                        <span className="text-sm">{student.assigned_teacher_name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm italic">Not assigned</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">{student.phone || '-'}</td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-semibold ${student.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}
                                                >
                                                    {student.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 flex gap-2">
                                                <Link
                                                    to={`/students/${student.id}`}
                                                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                                    title="View Details"
                                                >
                                                    View
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        setSelectedStudent(student);
                                                        setShowStudentModal(true);
                                                    }}
                                                    className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded"
                                                    title="Edit"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(student)}
                                                    className={`p-1 rounded ${student.is_active
                                                        ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
                                                        : 'text-green-600 hover:text-green-800 hover:bg-green-50'}`}
                                                    title={student.is_active ? "Block Student" : "Unblock Student"}
                                                >
                                                    {student.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(student.id)}
                                                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                                    title="Delete Student"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            {showStudentModal && (
                <StudentFormModal
                    student={selectedStudent}
                    onSave={handleSaveStudent}
                    onCancel={() => {
                        setShowStudentModal(false);
                        setSelectedStudent(null);
                    }}
                />
            )}
            {showBulkModal && (
                <BulkUploadModal
                    title="Bulk Student Upload"
                    onUpload={(file) => studentsAPI.bulkUpload(file)}
                    onCancel={() => {
                        setShowBulkModal(false);
                        fetchStudents();
                    }}
                    templateLink="http://localhost:3001/templates/student_bulk_template.csv"
                />
            )}
        </div>
    );
};

export default StudentList;
