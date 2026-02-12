import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { reportsAPI, studentsAPI, attendanceAPI } from '../../services/api';
import {
    Users,
    UserCheck,
    BookOpen,
    TrendingUp,
    LogOut,
    FileText,
    Upload,
    Calendar,
    CheckCircle,
    XCircle,
    AlertCircle,
    GraduationCap
} from 'lucide-react';
import BulkUploadModal from '../common/BulkUploadModal';

// Today's Attendance Summary Component
const TodayAttendanceSummary = () => {
    const [attendanceData, setAttendanceData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTodayAttendance();
    }, []);



    const fetchTodayAttendance = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Get attendance summary for today across all classes
            const response = await attendanceAPI.getSummary({
                start_date: today,
                end_date: today
            });

            const summary = response.data.data?.summary || [];
            const totalStudents = summary.length;
            const presentStudents = summary.filter(s => s.present_days > 0).length;
            const absentStudents = summary.filter(s => s.absent_days > 0).length;
            const lateStudents = summary.filter(s => s.late_days > 0).length;

            setAttendanceData({
                totalStudents,
                presentStudents,
                absentStudents,
                lateStudents,
                attendancePercentage: totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0
            });
        } catch (error) {
            console.error('Failed to fetch today attendance:', error);
            setAttendanceData({
                totalStudents: 0,
                presentStudents: 0,
                absentStudents: 0,
                lateStudents: 0,
                attendancePercentage: 0
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading attendance data...</div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-blue-600 text-sm font-medium">Total Students</p>
                        <p className="text-2xl font-bold text-blue-800">{attendanceData?.totalStudents || 0}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-green-600 text-sm font-medium">Present</p>
                        <p className="text-2xl font-bold text-green-800">{attendanceData?.presentStudents || 0}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-red-600 text-sm font-medium">Absent</p>
                        <p className="text-2xl font-bold text-red-800">{attendanceData?.absentStudents || 0}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600" />
                </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-yellow-600 text-sm font-medium">Attendance %</p>
                        <p className="text-2xl font-bold text-yellow-800">{attendanceData?.attendancePercentage || 0}%</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-yellow-600" />
                </div>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Try to fetch analytics from reports API
            const response = await reportsAPI.getAcademicAnalytics();
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data from reports API:', error);

            // Fallback: Fetch students directly
            try {
                const studentsResponse = await studentsAPI.getAll({ limit: 1000 });
                const students = studentsResponse.data.data?.students || [];

                setStats({
                    totalStudents: students.length,
                    avgAttendance: 0,
                    avgPerformance: 0,
                    academicYear: new Date().getFullYear().toString(),
                    topPerformers: [],
                    lowAttendance: []
                });
            } catch (fallbackError) {
                console.error('Failed to fetch students:', fallbackError);
                // Set empty stats
                setStats({
                    totalStudents: 0,
                    avgAttendance: 0,
                    avgPerformance: 0,
                    academicYear: new Date().getFullYear().toString(),
                    topPerformers: [],
                    lowAttendance: []
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line no-unused-vars
    const StatCard = ({ icon: Icon, title, value, color, trend }) => (
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-600 text-sm font-medium">{title}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
                    {trend && (
                        <p className="text-sm text-green-600 mt-2 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            {trend}
                        </p>
                    )}
                </div>
                <div className={`p-4 rounded-full ${color}`}>
                    <Icon className="w-8 h-8 text-white" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="text-gray-600 mt-1">Welcome back, {user?.fullName}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-xl text-gray-600">Loading dashboard...</div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                icon={Users}
                                title="Total Students"
                                value={stats?.totalStudents || 0}
                                color="bg-blue-500"
                            />
                            <StatCard
                                icon={UserCheck}
                                title="Avg Attendance"
                                value={`${stats?.avgAttendance || 0}%`}
                                color="bg-green-500"
                            />
                            <StatCard
                                icon={BookOpen}
                                title="Avg Performance"
                                value={`${stats?.avgPerformance || 0}%`}
                                color="bg-purple-500"
                            />
                            <StatCard
                                icon={TrendingUp}
                                title="Academic Year"
                                value={stats?.academicYear || '2025-2026'}
                                color="bg-indigo-500"
                            />
                        </div>

                        {/* Today's Attendance Summary */}
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Attendance Overview</h2>
                            <TodayAttendanceSummary />
                        </div>

                        {/* Operations Panels */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            {/* Student Operations */}
                            <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-blue-50 to-transparent">
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <GraduationCap className="w-6 h-6 text-blue-600" />
                                        Student Operations
                                    </h2>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Link
                                        to="/students"
                                        className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
                                    >
                                        <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-600 transition-colors">
                                            <Users className="w-6 h-6 text-blue-600 group-hover:text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Manage Students</p>
                                            <p className="text-xs text-gray-500">View and edit records</p>
                                        </div>
                                    </Link>


                                    <Link
                                        to="/attendance"
                                        className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:border-green-500 hover:bg-green-50/50 transition-all group"
                                    >
                                        <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-600 transition-colors">
                                            <Calendar className="w-6 h-6 text-green-600 group-hover:text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Mark Attendance</p>
                                            <p className="text-xs text-gray-500">Daily attendance roll</p>
                                        </div>
                                    </Link>

                                    <Link
                                        to="/marks"
                                        className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:border-purple-500 hover:bg-purple-50/50 transition-all group"
                                    >
                                        <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-600 transition-colors">
                                            <BookOpen className="w-6 h-6 text-purple-600 group-hover:text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Enter Marks</p>
                                            <p className="text-xs text-gray-500">Record exam marks</p>
                                        </div>
                                    </Link>
                                </div>
                            </div>

                            {/* Staff & Admin Operations */}
                            <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-transparent">
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <UserCheck className="w-6 h-6 text-indigo-600" />
                                        Staff & Admin Operations
                                    </h2>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Link
                                        to="/teachers"
                                        className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group"
                                    >
                                        <div className="p-3 bg-indigo-100 rounded-xl group-hover:bg-indigo-600 transition-colors">
                                            <Users className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Manage Teachers</p>
                                            <p className="text-xs text-gray-500">Assign classes & subjects</p>
                                        </div>
                                    </Link>

                                    <Link
                                        to="/attendance/reports"
                                        className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
                                    >
                                        <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-600 transition-colors">
                                            <FileText className="w-6 h-6 text-blue-600 group-hover:text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Attendance Reports</p>
                                            <p className="text-xs text-gray-500">View analytics</p>
                                        </div>
                                    </Link>

                                    <Link
                                        to="/reports"
                                        className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group"
                                    >
                                        <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-600 transition-colors">
                                            <TrendingUp className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Academic Analytics</p>
                                            <p className="text-xs text-gray-500">General performance</p>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Top Performers */}
                        {stats?.topPerformers && stats.topPerformers.length > 0 && (
                            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Top Performers</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 text-gray-700">Reg. No</th>
                                                <th className="text-left py-3 px-4 text-gray-700">Student Name</th>
                                                <th className="text-left py-3 px-4 text-gray-700">Class</th>
                                                <th className="text-left py-3 px-4 text-gray-700">Avg %</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.topPerformers.map((student, index) => (
                                                <tr key={index} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 px-4">{student.registration_number}</td>
                                                    <td className="py-3 px-4 font-medium">{student.student_name}</td>
                                                    <td className="py-3 px-4">{student.class_name}</td>
                                                    <td className="py-3 px-4">
                                                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                                            {student.avg_percentage}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}


                    </>
                )}
            </main>

            {/* Modals */}
        </div>
    );
};

export default AdminDashboard;
