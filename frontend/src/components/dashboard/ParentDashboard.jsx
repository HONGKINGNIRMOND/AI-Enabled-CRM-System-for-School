import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { parentsAPI } from '../../services/api';
import {
    Users,
    LogOut,
    MessageSquare,
    Bell,
    ChevronRight,
    GraduationCap,
    Calendar,
    TrendingUp,
    Heart,
    Star,
    LayoutDashboard,
    BookOpen,
    Award,
    UserCheck
} from 'lucide-react';

const ParentDashboard = () => {
    const { user, logout } = useAuth();
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChildren = async () => {
            try {
                const response = await parentsAPI.getChildren();
                setChildren(response.data.data);
            } catch (error) {
                console.error('Failed to fetch children:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchChildren();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col md:flex-row">
            {/* Sidebar - Premium Design */}
            <aside className="w-full md:w-20 lg:w-64 bg-white border-r border-gray-200 flex-shrink-0 z-30 shadow-sm">
                <div className="h-full flex flex-col p-4">
                    <div className="flex items-center gap-3 lg:px-2 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <span className="hidden lg:block font-bold text-lg text-gray-900">Parent Portal</span>
                    </div>

                    <nav className="flex-1 space-y-1">
                        <NavItem icon={<LayoutDashboard />} label="Dashboard" active />
                        <NavItem icon={<Users />} label="My Children" />
                        <NavItem icon={<MessageSquare />} label="Messages" />
                        <NavItem icon={<Bell />} label="Notifications" badge="3" />
                        <NavItem icon={<Calendar />} label="Events" />
                    </nav>

                    <button
                        onClick={logout}
                        className="mt-auto flex items-center gap-3 lg:px-3 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="hidden lg:block font-medium text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                Welcome back, {user?.fullName?.split(' ')[0]} 👋
                            </h1>
                            <p className="text-gray-600 font-medium">Track your children's academic progress in real-time</p>
                        </div>

                        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-200">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center text-indigo-700 font-bold text-sm">
                                {user?.fullName?.charAt(0)}
                            </div>
                            <div className="pr-2 hidden sm:block">
                                <p className="text-sm font-semibold text-gray-900">{user?.fullName}</p>
                                <p className="text-xs text-gray-500">Parent Account</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Children Overview Cards */}
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" />
                            My Children
                        </h2>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                            {children.length} enrolled
                        </span>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 animate-pulse">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                                    </div>
                                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                                    <div className="flex justify-between pt-4 border-t border-gray-100">
                                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : children.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {children.map((child) => (
                                <Link
                                    key={child.id}
                                    to={`/child-performance/${child.id}`}
                                    className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg border border-gray-200 transition-all duration-300 hover:border-indigo-200 hover:-translate-y-1"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform duration-300">
                                            {child.first_name.charAt(0)}
                                        </div>
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                            Active
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                                        {child.first_name} {child.last_name}
                                    </h3>

                                    <p className="text-gray-500 text-sm mb-4 flex items-center gap-1">
                                        <GraduationCap className="w-4 h-4" />
                                        Class {child.class_name || 'N/A'} • Section {child.section_name || 'N/A'}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${(child.attendance_percentage || 0) >= 75 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <span className="text-xs font-medium text-gray-600">
                                                Attendance: {child.attendance_percentage || 0}%
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-indigo-600 group-hover:translate-x-1 transition-transform duration-300">
                                            <span className="text-xs font-semibold">View Details</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No Children Found</h3>
                            <p className="text-gray-500 max-w-md mx-auto">It looks like there are no students linked to your account. Please contact the school administration to link your children.</p>
                        </div>
                    )}
                </section>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow duration-300 cursor-pointer group">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">Messages</h4>
                            <p className="text-sm text-gray-500">Chat with teachers</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow duration-300 cursor-pointer group">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">Calendar</h4>
                            <p className="text-sm text-gray-500">Events & holidays</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow duration-300 cursor-pointer group">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">Achievements</h4>
                            <p className="text-sm text-gray-500">Student awards</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const NavItem = ({ icon, label, active = false, badge }) => (
    <button className={`w-full flex items-center gap-3 lg:px-3 py-3 rounded-xl transition-all duration-200 ${active
        ? 'bg-indigo-600 text-white shadow-md'
        : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
        }`}>
        <div className="w-5 h-5 shrink-0">{icon}</div>
        <span className="hidden lg:block font-medium text-sm">{label}</span>
        {badge && (
            <span className="hidden lg:flex ml-auto w-5 h-5 bg-red-500 text-white text-xs font-bold items-center justify-center rounded-full">
                {badge}
            </span>
        )}
    </button>
);

export default ParentDashboard;
