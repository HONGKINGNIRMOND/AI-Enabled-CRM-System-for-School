import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { hodAPI } from '../../services/api';
import DateTimeDisplay from '../common/DateTimeDisplay';
import { 
    Users, 
    BookOpen, 
    Calendar, 
    CheckCircle, 
    LogOut,
    Building,
    TrendingUp,
    BarChart3,
    GraduationCap,
    DollarSign,
    Zap,
    Send
} from 'lucide-react';

const HODDashboard = () => {
    const { user, logout } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await hodAPI.getDashboard();
            setDashboardData(response.data.data);
        } catch (error) {
            console.error('Failed to fetch HOD dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ icon: Icon, title, value, color }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center hover:shadow-md transition">
            <div className={`p-4 rounded-full ${color.bg} ${color.text} mb-4`}>
                <Icon className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
            <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-wide">{title}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Head of Department Panel</h1>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">HOD</span>
                            </div>
                            <p className="text-gray-500 text-sm mt-1">
                                {loading ? 'Loading...' : `Department: ${dashboardData?.departmentName || 'Not Assigned'}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <DateTimeDisplay className="hidden md:flex" />
                            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-gray-900">{user?.fullName}</p>
                                    <p className="text-xs text-gray-500">HOD</p>
                                </div>
                                <button
                                    onClick={logout}
                                    className="p-2 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-center mb-8">
                            <div className="w-full md:w-1/3">
                                <StatCard 
                                    icon={Building} 
                                    title="My Department" 
                                    value={dashboardData?.departmentName || 'N/A'} 
                                    color={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }} 
                                />
                            </div>
                        </div>

                        <h2 className="text-lg font-bold text-gray-900 mb-4">Department Management</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Link
                                to="/hod/subjects"
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-blue-200 transition group flex flex-col items-center text-center"
                            >
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <BookOpen className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-gray-900">Subjects & Faculty</h3>
                                <p className="text-sm text-gray-500 mt-2">View subjects and teaching allocations</p>
                            </Link>

                            <Link
                                to="/hod/attendance"
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-green-200 transition group flex flex-col items-center text-center"
                            >
                                <div className="p-3 bg-green-50 text-green-600 rounded-xl mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                    <Calendar className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-gray-900">Attendance Tracking</h3>
                                <p className="text-sm text-gray-500 mt-2">Monitor student attendance in department</p>
                            </Link>

                            <Link
                                to="/hod/marks"
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-purple-200 transition group flex flex-col items-center text-center"
                            >
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-gray-900">Review Marks</h3>
                                <p className="text-sm text-gray-500 mt-2">Approve and review internal marks</p>
                            </Link>

                            <Link
                                to="/hod/analytics"
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-orange-200 transition group flex flex-col items-center text-center"
                            >
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                    <BarChart3 className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-gray-900">Analytics</h3>
                                <p className="text-sm text-gray-500 mt-2">View department pass %, averages, and toppers</p>
                            </Link>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 mt-8">General Management</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Link
                                to="/students"
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-blue-200 transition group flex flex-col items-center text-center"
                            >
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Users className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-gray-900">Manage Students</h3>
                                <p className="text-sm text-gray-500 mt-2">View and manage student records</p>
                            </Link>
                            
                            <Link
                                to="/teachers"
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-indigo-200 transition group flex flex-col items-center text-center"
                            >
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <GraduationCap className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-gray-900">Teacher Management</h3>
                                <p className="text-sm text-gray-500 mt-2">Manage all teaching staff</p>
                            </Link>

                            <Link
                                to="/fees"
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-yellow-200 transition group flex flex-col items-center text-center"
                            >
                                <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl mb-4 group-hover:bg-yellow-600 group-hover:text-white transition-colors">
                                    <DollarSign className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-gray-900">Fee Management</h3>
                                <p className="text-sm text-gray-500 mt-2">Track student fee payments</p>
                            </Link>

                            <Link
                                to="/attendance"
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-green-200 transition group flex flex-col items-center text-center"
                            >
                                <div className="p-3 bg-green-50 text-green-600 rounded-xl mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                    <Calendar className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-gray-900">Mark Attendance</h3>
                                <p className="text-sm text-gray-500 mt-2">Record daily attendance</p>
                            </Link>
                        </div>
                        
                        <h2 className="text-lg font-bold text-gray-900 mb-4 mt-8">Tools & Insights</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Link
                                to="/ai-predictions"
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-purple-200 transition group flex flex-col items-center text-center"
                            >
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <Zap className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-gray-900">AI Insights</h3>
                                <p className="text-sm text-gray-500 mt-2">View ML driven student predictions</p>
                            </Link>

                            <Link
                                to="/quick-action"
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-orange-200 transition group flex flex-col items-center text-center"
                            >
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                    <Send className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-gray-900">Quick Action CRM</h3>
                                <p className="text-sm text-gray-500 mt-2">Send bulk updates to students</p>
                            </Link>

                            <Link
                                to="/circulars"
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-indigo-200 transition group flex flex-col items-center text-center"
                            >
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <Calendar className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-gray-900">E-Circulars</h3>
                                <p className="text-sm text-gray-500 mt-2">Manage notices & circulars</p>
                            </Link>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default HODDashboard;
