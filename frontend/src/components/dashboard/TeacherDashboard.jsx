import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DateTimeDisplay from '../common/DateTimeDisplay';
import CircularNotificationBell from '../common/CircularNotificationBell';
import DashboardCircularsPanel from '../common/DashboardCircularsPanel';
import { Calendar, BookOpen, Users, LogOut, Activity } from 'lucide-react';

const TeacherDashboard = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
                            <p className="text-gray-600 mt-1">Welcome back, {user?.fullName}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <DateTimeDisplay />
                            <CircularNotificationBell />
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link
                        to="/students"
                        className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
                    >
                        <Users className="w-12 h-12 text-blue-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-800">My Students</h3>
                        <p className="text-gray-600 mt-2">View and manage student records</p>
                    </Link>

                    <Link
                        to="/attendance"
                        className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
                    >
                        <Calendar className="w-12 h-12 text-green-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-800">Mark Attendance</h3>
                        <p className="text-gray-600 mt-2">Record daily attendance for classes</p>
                    </Link>

                    <Link
                        to="/marks"
                        className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
                    >
                        <BookOpen className="w-12 h-12 text-purple-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-800">Enter Marks</h3>
                        <p className="text-gray-600 mt-2">Record student exam marks</p>
                    </Link>


                    <Link
                        to="/quick-action"
                        className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
                    >
                        <Users className="w-12 h-12 text-orange-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-800">Quick Action</h3>
                        <p className="text-gray-600 mt-2">Search students and send updates</p>
                    </Link>

                    <Link
                        to="/reports/student-analytics"
                        className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
                    >
                        <Activity className="w-12 h-12 text-indigo-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-800">Student Analytics</h3>
                        <p className="text-gray-600 mt-2">Detailed performance analysis</p>
                    </Link>
                </div>

                <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Schedule</h2>
                    <p className="text-gray-600">No classes scheduled for today.</p>
                </div>

                <div className="mt-8">
                    <DashboardCircularsPanel />
                </div>
            </main>
        </div>
    );
};

export default TeacherDashboard;
