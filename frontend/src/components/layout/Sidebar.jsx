import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Phone, BarChart3, LogOut, Menu, X, GraduationCap, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    ];

    if (user?.role === 'admin') {
        navItems.push(
            { path: '/teachers', label: 'Teachers', icon: GraduationCap }
        );
    }

    if (user?.role === 'admin' || user?.role === 'teacher') {
        navItems.push(
            { path: '/students', label: 'Students', icon: Users },
            { path: '/attendance', label: 'Attendance', icon: ClipboardCheck },
            { path: '/marks', label: 'Marks', icon: BarChart3 }
        );
    }

    const isActive = (path) => location.pathname === path;

    return (
        <>
            {/* Mobile sidebar overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
                    onClick={toggleSidebar}
                ></div>
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-30 h-full w-64 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:h-screen`}
            >
                <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold">AI CRM System</h1>
                        <button
                            className="lg:hidden text-gray-400 hover:text-white"
                            onClick={toggleSidebar}
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <nav className="p-4">
                    <ul className="space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${isActive(item.path)
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                            }`}
                                        onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                                    >
                                        <Icon size={20} />
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="font-semibold">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                        </div>
                        <div>
                            <p className="font-medium">{user?.name || 'User'}</p>
                            <p className="text-sm text-gray-400 capitalize">{user?.role || 'Role'}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center space-x-3 w-full px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Mobile menu button */}
            <button
                className="fixed top-4 left-4 z-20 lg:hidden text-gray-700 bg-white p-2 rounded-lg shadow"
                onClick={toggleSidebar}
            >
                <Menu size={24} />
            </button>
        </>
    );
};

export default Sidebar;