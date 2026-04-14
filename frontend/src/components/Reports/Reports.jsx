import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Activity } from 'lucide-react';

const Reports = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-center">
                    <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full border border-gray-100 hover:shadow-xl transition-shadow group">
                        <Activity className="w-16 h-16 text-indigo-600 mb-6 group-hover:scale-110 transition-transform" />
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Student Analytics</h3>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            Access comprehensive performance and attendance analysis with advanced filtering and PDF export capabilities.
                        </p>
                        <Link to="/reports/student-analytics" className="flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition w-full justify-center font-bold shadow-md">
                            Open Analytics Tool
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Reports;
