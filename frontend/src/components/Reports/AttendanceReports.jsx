import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { attendanceAPI, masterAPI } from '../../services/api';
import { ArrowLeft, Calendar, Users, Download, Filter, Search, UserCheck, XCircle, Clock, AlertTriangle } from 'lucide-react';

const AttendanceReports = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        classId: '',
        sectionId: '',
        startDate: '',
        endDate: '',
        session: 'Morning'
    });

    useEffect(() => {
        fetchClasses();
        // Set default date range (last 30 days)
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        setFilters(prev => ({ ...prev, startDate, endDate }));
    }, []);

    useEffect(() => {
        if (filters.classId) {
            fetchSections(filters.classId);
        } else {
            setSections([]);
        }
    }, [filters.classId]);

    const fetchClasses = async () => {
        try {
            const response = await masterAPI.getClasses();
            const sortedClasses = response.data.data.sort((a, b) => {
                // Extract numbers from class names for proper sorting
                const getClassNumber = (className) => {
                    const match = className.match(/(\d+)/);
                    return match ? parseInt(match[1]) : 999;
                };

                const aNum = getClassNumber(a.class_name);
                const bNum = getClassNumber(b.class_name);

                if (aNum !== bNum) {
                    return aNum - bNum;
                }

                // If numbers are the same, sort alphabetically
                return a.class_name.localeCompare(b.class_name);
            });
            setClasses(sortedClasses);
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        }
    };

    const fetchSections = async (classId) => {
        try {
            const response = await masterAPI.getSections(classId);
            const sortedSections = response.data.data.sort((a, b) => {
                // Sort sections alphabetically (A, B, C, etc.)
                return a.section_name.localeCompare(b.section_name);
            });
            setSections(sortedSections);
        } catch (error) {
            console.error('Failed to fetch sections:', error);
        }
    };

    const fetchAttendanceReports = async () => {
        if (!filters.classId || !filters.sectionId || !filters.startDate || !filters.endDate) {
            return;
        }

        try {
            setLoading(true);
            const response = await attendanceAPI.getSummary({
                class_id: filters.classId,
                section_id: filters.sectionId,
                start_date: filters.startDate,
                end_date: filters.endDate,
                session: filters.session
            });
            setAttendanceData(response.data.data?.summary || []);
        } catch (error) {
            console.error('Failed to fetch attendance reports:', error);
            setAttendanceData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const getAttendanceColor = (percentage) => {
        if (percentage >= 90) return 'text-green-600 bg-green-50';
        if (percentage >= 75) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
                            <p className="text-gray-600 mt-1">View detailed attendance analytics and reports</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Filter className="w-5 h-5 text-blue-600" />
                        Filter Reports
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                            <select
                                value={filters.classId}
                                onChange={(e) => handleFilterChange('classId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select Class</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                            <select
                                value={filters.sectionId}
                                onChange={(e) => handleFilterChange('sectionId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select Section</option>
                                {sections.map(section => (
                                    <option key={section.id} value={section.id}>{section.section_name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Session</label>
                            <select
                                value={filters.session}
                                onChange={(e) => handleFilterChange('session', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="Morning">Morning</option>
                                <option value="Afternoon">Afternoon</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={fetchAttendanceReports}
                                disabled={loading || !filters.classId || !filters.sectionId}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Search className="w-4 h-4" />
                                {loading ? 'Loading...' : 'Generate Report'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {attendanceData.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-green-600" />
                                Attendance Summary ({attendanceData.length} students)
                            </h2>
                            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Student</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Reg. No.</th>
                                        <th className="text-center py-3 px-4 font-medium text-gray-700">Total Days</th>
                                        <th className="text-center py-3 px-4 font-medium text-gray-700">Present</th>
                                        <th className="text-center py-3 px-4 font-medium text-gray-700">Absent</th>
                                        <th className="text-center py-3 px-4 font-medium text-gray-700">Late</th>
                                        <th className="text-center py-3 px-4 font-medium text-gray-700">Attendance %</th>
                                        <th className="text-center py-3 px-4 font-medium text-gray-700">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {attendanceData.map((student, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="py-3 px-4 font-medium text-gray-900">
                                                {student.student_name}
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">
                                                {student.registration_number}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {student.total_days || 0}
                                            </td>
                                            <td className="py-3 px-4 text-center text-green-600">
                                                {student.present_days || 0}
                                            </td>
                                            <td className="py-3 px-4 text-center text-red-600">
                                                {student.absent_days || 0}
                                            </td>
                                            <td className="py-3 px-4 text-center text-yellow-600">
                                                {student.late_days || 0}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-sm font-medium ${getAttendanceColor(student.attendance_percentage || 0)}`}>
                                                    {student.attendance_percentage || 0}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {(student.attendance_percentage || 0) >= 75 ? (
                                                    <span className="inline-flex items-center text-green-600">
                                                        <UserCheck className="w-4 h-4" />
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center text-red-600">
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* No Data State */}
                {!loading && attendanceData.length === 0 && filters.classId && filters.sectionId && (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                        <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Data Found</h3>
                        <p className="text-gray-500">
                            No attendance records found for the selected filters. Try adjusting your search criteria.
                        </p>
                    </div>
                )}

                {/* Initial State */}
                {!filters.classId || !filters.sectionId ? (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                        <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Select Filters to Generate Report</h3>
                        <p className="text-gray-500">
                            Please select a class and section to view attendance reports.
                        </p>
                    </div>
                ) : null}
            </main>
        </div>
    );
};

export default AttendanceReports;