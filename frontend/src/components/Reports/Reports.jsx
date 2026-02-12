import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText } from 'lucide-react';

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <FileText className="w-12 h-12 text-blue-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Progress Cards</h3>
                        <p className="text-gray-600 mb-4">Generate student progress reports</p>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full justify-center">
                            <Download className="w-4 h-4" />
                            Generate
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <FileText className="w-12 h-12 text-green-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Attendance Report</h3>
                        <p className="text-gray-600 mb-4">View attendance summaries</p>
                        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition w-full justify-center">
                            <Download className="w-4 h-4" />
                            Generate
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <FileText className="w-12 h-12 text-purple-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Class Performance</h3>
                        <p className="text-gray-600 mb-4">Analyze class-wise performance</p>
                        <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition w-full justify-center">
                            <Download className="w-4 h-4" />
                            Generate
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <FileText className="w-12 h-12 text-orange-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Academic Analytics</h3>
                        <p className="text-gray-600 mb-4">View overall statistics</p>
                        <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition w-full justify-center">
                            <Download className="w-4 h-4" />
                            View
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <FileText className="w-12 h-12 text-red-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Low Attendance</h3>
                        <p className="text-gray-600 mb-4">Students below threshold</p>
                        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition w-full justify-center">
                            <Download className="w-4 h-4" />
                            View
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <FileText className="w-12 h-12 text-indigo-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Export Data</h3>
                        <p className="text-gray-600 mb-4">Download data as Excel</p>
                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition w-full justify-center">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Reports;
