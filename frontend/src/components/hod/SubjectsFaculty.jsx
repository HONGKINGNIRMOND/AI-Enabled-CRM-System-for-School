import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hodAPI } from '../../services/api';
import { BookOpen, Users, Loader2, ArrowLeft, Building2 } from 'lucide-react';

const SubjectsFaculty = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await hodAPI.getSubjects();
            setData(response.data.data || []);
        } catch (err) {
            console.error('Failed to fetch subjects data:', err);
            setError('Failed to load department subjects. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
                <p className="text-gray-600 font-medium">Loading Subjects & Faculty...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition mb-6 group"
            >
                <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 group-hover:border-indigo-200 group-hover:bg-indigo-50 transition">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="font-medium">Back to Dashboard</span>
            </button>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-indigo-600" />
                        Subjects & Faculty Tracking
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">Overview of subjects under your department and their assigned teachers.</p>
                </div>
                <div className="flex bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm gap-2 whitespace-nowrap">
                    <span className="font-bold text-gray-800">{data.length}</span>
                    <span className="text-gray-500">Subjects Assigned</span>
                </div>
            </div>

            {error ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6">
                    {error}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/80 border-b border-gray-100">
                                <tr>
                                    <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Subject Name</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Handling Department</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Class</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Assigned Faculty</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="py-12 text-center text-gray-500 italic">No subjects found for this department.</td>
                                    </tr>
                                ) : (
                                    data.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                                            <td className="py-4 px-6 font-bold text-gray-900">{item.subjectName}</td>
                                            <td className="py-4 px-6">
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-medium text-xs rounded-lg whitespace-nowrap border border-indigo-100">
                                                    {item.departmentName || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm font-semibold text-gray-700 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                                    {item.className || 'Not Assigned to Class'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                {item.teacherName ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                                                            {item.teacherName.charAt(0)}
                                                        </div>
                                                        <span className="text-gray-800 font-medium">{item.teacherName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic text-sm">Unassigned</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectsFaculty;
