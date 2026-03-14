import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Send, User, BookOpen, TrendingUp, DollarSign, MessageSquare, CheckCircle, AlertCircle, Loader2, ArrowLeft, Filter } from 'lucide-react';
import api, { masterAPI } from '../../services/api';

const QuickActionPanel = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState('');
    const [showMessagePreview, setShowMessagePreview] = useState(false);
    const [notification, setNotification] = useState(null);
    const [filters, setFilters] = useState({
        classId: '',
        sectionId: '',
        academicYear: '',
        sortBy: 'name',
        order: 'ASC'
    });
    const [masterData, setMasterData] = useState({
        classes: [],
        sections: [],
        academicYears: []
    });

    // Search students
    const searchStudents = async (term, currentFilters = filters) => {
        if (!term.trim() && !currentFilters.classId && !currentFilters.sectionId && !currentFilters.academicYear) {
            setStudents([]);
            return;
        }

        setSearching(true);
        try {
            const queryParams = new URLSearchParams();
            if (term.trim()) queryParams.append('search', term.trim());
            if (currentFilters.classId) queryParams.append('class_id', currentFilters.classId);
            if (currentFilters.sectionId) queryParams.append('section_id', currentFilters.sectionId);
            if (currentFilters.academicYear) queryParams.append('academic_year', currentFilters.academicYear);
            if (currentFilters.sortBy) queryParams.append('sortBy', currentFilters.sortBy);
            if (currentFilters.order) queryParams.append('order', currentFilters.order);

            const response = await api.get(`/quick-action/search-students?${queryParams.toString()}`);
            if (response.data.success) {
                setStudents(response.data.data);
            }
        } catch (error) {
            console.error('Search error:', error);
            setNotification({
                type: 'error',
                message: 'Failed to search students'
            });
        } finally {
            setSearching(false);
        }
    };

    // Utility: safely parse numeric values
    const safeNumber = (value, fallback = 0) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    };

    // Get complete student data
    const getStudentData = async (studentId) => {
        setLoading(true);
        try {
            const response = await api.get(`/quick-action/student-complete-data/${studentId}`);
            if (response.data.success) {
                const rawData = response.data.data;

                // Normalize response fields to match frontend expectations
                const normalizedMarks = Array.isArray(rawData.marks)
                    ? rawData.marks.map((mark) => ({
                        ...mark,
                        averageMarks:
                            typeof mark.averageMarks !== 'undefined'
                                ? mark.averageMarks
                                : safeNumber(mark.average_marks),
                    }))
                    : [];

                const normalizedData = {
                    ...rawData,
                    marks: normalizedMarks,
                    fees: {
                        ...rawData.fees,
                        pendingAmount: safeNumber(rawData.fees?.pendingAmount),
                    },
                };

                setStudentData(normalizedData);
                generateMessage(normalizedData);
            }
        } catch (error) {
            console.error('Get student data error:', error);
            setNotification({
                type: 'error',
                message: 'Failed to fetch student data'
            });
        } finally {
            setLoading(false);
        }
    };

    // Generate formatted message
    const generateMessage = (data) => {
        const { student, attendance, marks = [], grade = {}, fees = {}, parent = {} } = data;


        const gradePoint = safeNumber(grade?.averageGradePoint);
        const pendingAmount = safeNumber(fees?.pendingAmount);

        let msg = `📚 *Student Academic Update*\n\n`;
        msg += `👤 *Student Information*\n`;
        msg += `📝 Name: ${student.first_name} ${student.last_name}\n`;
        msg += `🎓 Class: ${student.class_name} - ${student.section_name}\n`;
        msg += `🔢 Roll No: ${student.roll_number}\n`;
        msg += `📅 Academic Year: ${student.academic_year}\n\n`;

        msg += `📊 *Academic Performance*\n`;
        msg += `📈 Attendance: ${attendance.percentage}% (${attendance.presentDays}/${attendance.totalDays} days)\n`;

        if (marks && marks.length > 0) {
            msg += `📝 Subject-wise Internal Marks:\n`;
            marks.forEach((mark) => {
                const average = safeNumber(mark.averageMarks ?? mark.average_marks);
                msg += `  • ${mark.subject_name}: ${average.toFixed(1)}/100\n`;
            });
        }

        msg += `🏆 Overall Grade Point: ${gradePoint.toFixed(2)}\n\n`;

        msg += `💰 *Fee Information*\n`;
        msg += `💳 Pending Amount: ₹${pendingAmount.toFixed(2)}\n\n`;


        msg += `---\n`;
        msg += `📧 For any queries, please contact the school administration.\n`;
        msg += `🏫 School Management System`;

        setMessage(msg);
    };

    // Reset/Clear Panel State
    const resetPanel = () => {
        setShowMessagePreview(false);
        setSelectedStudent(null);
        setStudentData(null);
        setSearchTerm('');
        setStudents([]);
    };

    // Fetch master data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [classesRes, yearsRes] = await Promise.all([
                    masterAPI.getClasses(),
                    masterAPI.getAcademicYears()
                ]);

                setMasterData(prev => ({
                    ...prev,
                    classes: classesRes.data.success ? classesRes.data.data : [],
                    academicYears: yearsRes.data.success ? yearsRes.data.data : []
                }));
            } catch (error) {
                console.error('Failed to fetch initial data:', error);
            }
        };

        fetchInitialData();
    }, []);

    // Fetch sections when class changes
    useEffect(() => {
        const fetchSections = async () => {
            if (!filters.classId) {
                setMasterData(prev => ({ ...prev, sections: [] }));
                return;
            }

            try {
                const response = await masterAPI.getSections(filters.classId);
                if (response.data.success) {
                    setMasterData(prev => ({ ...prev, sections: response.data.data }));
                }
            } catch (error) {
                console.error('Failed to fetch sections:', error);
            }
        };

        fetchSections();
    }, [filters.classId]);

    // Handle filter changes
    const handleFilterChange = (newUpdates) => {
        setFilters(prev => {
            const updated = { ...prev, ...newUpdates };
            if (newUpdates.classId !== undefined) {
                updated.sectionId = '';
            }
            // Trigger search with updated filters
            searchStudents(searchTerm, updated);
            return updated;
        });
    };

    // Send WhatsApp message
    const sendWhatsAppMessage = async () => {
        if (!selectedStudent || !studentData) return;

        setSending(true);
        try {
            const response = await api.post('/quick-action/send-whatsapp-update', {
                studentId: selectedStudent.id
            });

            if (response.data.success) {
                setNotification({
                    type: 'success',
                    message: response.data.message
                });
                resetPanel();
            } else {
                setNotification({
                    type: 'error',
                    message: response.data.message || 'Failed to send message'
                });
            }
        } catch (error) {
            console.error('Send message error:', error);
            setNotification({
                type: 'error',
                message: 'Failed to send WhatsApp message'
            });
        } finally {
            setSending(false);
        }
    };

    // Handle search input
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchStudents(searchTerm, filters);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Handle student selection
    const handleStudentSelect = (student) => {
        setSelectedStudent(student);
        getStudentData(student.id);
        setShowMessagePreview(true);
    };

    // Clear notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    return (
        <div className="max-w-6xl mx-auto p-6 min-h-screen">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">Quick Action CRM</h1>
                    </div>
                </div>
                <p className="text-gray-600">Send student updates to parents via WhatsApp</p>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${notification.type === 'success'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                    {notification.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    {notification.message}
                </div>
            )}

            {/* Search Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Search Students
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                            <Filter className="w-4 h-4" /> Academic Year
                        </label>
                        <select
                            value={filters.academicYear}
                            onChange={(e) => handleFilterChange({ academicYear: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">All Years</option>
                            {masterData.academicYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                        <select
                            value={filters.classId}
                            onChange={(e) => handleFilterChange({ classId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">All Classes</option>
                            {masterData.classes.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                        <select
                            value={filters.sectionId}
                            onChange={(e) => handleFilterChange({ sectionId: e.target.value })}
                            disabled={!filters.classId}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                        >
                            <option value="">All Sections</option>
                            {masterData.sections.map(sec => (
                                <option key={sec.id} value={sec.id}>{sec.section_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                        <select
                            value={`${filters.sortBy}-${filters.order}`}
                            onChange={(e) => {
                                const [sortBy, order] = e.target.value.split('-');
                                handleFilterChange({ sortBy, order });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="name-ASC">Alphabetical (A-Z)</option>
                            <option value="name-DESC">Alphabetical (Z-A)</option>
                            <option value="roll_number-ASC">Roll Number (Low to High)</option>
                            <option value="roll_number-DESC">Roll Number (High to Low)</option>
                        </select>
                    </div>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name or roll number..."
                        className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    {searching && (
                        <Loader2 className="absolute right-4 top-3.5 w-5 h-5 text-blue-500 animate-spin" />
                    )}
                </div>

                {/* Search Results */}
                {students.length > 0 && (
                    <div className="mt-4 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                        {students.map((student) => (
                            <div
                                key={student.id}
                                onClick={() => handleStudentSelect(student)}
                                className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">
                                                {student.first_name} {student.last_name}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {student.class_name} - {student.section_name} | Roll: {student.roll_number}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Student Data Preview */}
            {showMessagePreview && studentData && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Student Information Card */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Student Information
                            </h3>

                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Name:</span>
                                        <span className="font-medium text-gray-800">
                                            {studentData.student.first_name} {studentData.student.last_name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Class:</span>
                                        <span className="font-medium text-gray-800">
                                            {studentData.student.class_name} - {studentData.student.section_name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Roll Number:</span>
                                        <span className="font-medium text-gray-800">
                                            {studentData.student.roll_number}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Parent WhatsApp:</span>
                                        <span className="font-medium text-green-600">
                                            {studentData.parentWhatsApp || studentData.student?.father_phone || studentData.student?.mother_phone || 'Not Available'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Academic Performance Card */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                Academic Performance
                            </h3>

                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 flex items-center gap-1">
                                            <TrendingUp className="w-4 h-4" />
                                            Attendance:
                                        </span>
                                        <span className="font-medium text-gray-800">
                                            {studentData.attendance.percentage}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Overall Grade:</span>
                                        <span className="font-medium text-gray-800">
                                            {safeNumber(studentData.grade?.averageGradePoint).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 flex items-center gap-1">
                                            <DollarSign className="w-4 h-4" />
                                            Pending Fees:
                                        </span>
                                        <span className="font-medium text-red-600">
                                            ₹{safeNumber(studentData.fees?.pendingAmount).toFixed(2)}
                                        </span>
                                    </div>

                                    {studentData.marks && studentData.marks.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-600 mb-2">Subject Marks:</p>
                                            <div className="space-y-1">
                                                {studentData.marks.map((mark, index) => (
                                                    <div key={index} className="flex justify-between text-sm">
                                                        <span className="text-gray-600">{mark.subject_name}:</span>
                                                        <span className="font-medium text-gray-800">{safeNumber(mark.averageMarks).toFixed(1)}/100</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Message Preview and Send */}
                    <div className="mt-6 bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Message Preview
                        </h3>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <pre className="whitespace-pre-wrap text-sm text-gray-700">{message}</pre>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={sendWhatsAppMessage}
                                disabled={sending || !studentData.parentWhatsApp}
                                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {sending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                                {sending ? 'Sending...' : 'Send WhatsApp Message'}
                            </button>

                            <button
                                onClick={resetPanel}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>

                        {!studentData.parentWhatsApp && (
                            <div className="mt-3 p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    ⚠️ Parent WhatsApp number not found. Cannot send message.
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default QuickActionPanel;
