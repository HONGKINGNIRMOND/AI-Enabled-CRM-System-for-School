import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { Bell, Search } from 'lucide-react';

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useAuth();

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

            <div className="flex-1 flex flex-col lg:ml-64">
                {/* Top Header Bar */}
                <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6 fixed top-0 right-0 left-0 lg:left-64 z-10">
                    <div className="flex items-center flex-1 max-w-xl">
                        <Search className="text-gray-400 mr-2" size={20} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                        />
                    </div>
                    <div className="flex items-center space-x-4">
                        <button className="relative p-2 text-gray-600 hover:text-gray-900">
                            <Bell size={20} />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="font-semibold text-white">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="hidden md:block">
                                <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                                <p className="text-xs text-gray-500 capitalize">{user?.role || 'Role'}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 pt-16 overflow-y-auto">
                    <div className="p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;