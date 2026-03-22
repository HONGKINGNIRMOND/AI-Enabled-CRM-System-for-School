import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hodAPI } from '../../services/api';
import { CheckCircle, Loader2, ArrowLeft, AlertCircle, TrendingUp } from 'lucide-react';

const ReviewMarks = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await hodAPI.getMarks();
            setData(response.data.data || []);
        } catch (err) {
            console.error('Failed to fetch marks data:', err);
            setError('Failed to load department marks. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (subjectName, examName, className, sectionName) => {
        try {
            await hodAPI.approveMarks({ subjectName, examName, className, sectionName });
            // Refresh data after approval
            fetchData();
        } catch (err) {
            console.error('Failed to approve marks:', err);
            alert('Failed to approve marks. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
                <p className="text-gray-600 font-medium">Loading Marks Data...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-500 hover:text-purple-600 transition mb-6 group"
            >
                <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 group-hover:border-purple-200 group-hover:bg-purple-50 transition">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="font-medium">Back to Dashboard</span>
            </button>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-purple-600" />
                        Review Internal Marks
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">Review evaluation results for subjects in your department.</p>
                </div>
            </div>

            {error ? (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-3">
                    <AlertCircle className="text-red-500 w-5 h-5" />
                    <p className="text-red-700 font-medium">{error}</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-transparent flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-purple-500 rounded-full inline-block"></span>
                            Performance Overview by Exam
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white border-b border-gray-100">
                                <tr>
                                    <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Sub Name</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Class</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Section</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Exam</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Avg Marks</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">High Marks</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Lowest Mark</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Total Pass</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Total Fail</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="py-4 px-6 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-gray-500 italic">No evaluated marks found.</td>
                                    </tr>
                                ) : (
                                    data.map((item, idx) => {
                                        const avg = parseFloat(item.averageMarks) || 0;
                                        const highest = parseFloat(item.highestMarks) || 0;
                                        const lowest = parseFloat(item.lowestMarks) || 0;
                                        const pass = parseInt(item.totalPass) || 0;
                                        const fail = parseInt(item.totalFail) || 0;
                                        const isApproved = item.status === 'Approved';

                                        return (
                                            <tr key={idx} className="hover:bg-purple-50/30 transition-colors border-b border-gray-50">
                                                <td className="py-4 px-6 font-bold text-gray-900">{item.subjectName}</td>
                                                <td className="py-4 px-6 font-medium text-gray-700">{item.className}</td>
                                                <td className="py-4 px-6 font-medium text-gray-700">{item.sectionName}</td>
                                                <td className="py-4 px-6">
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg uppercase tracking-wider">
                                                        {item.examName}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-bold ${avg >= 75 ? 'text-green-600' : avg >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                            {avg.toFixed(1)}
                                                        </span>
                                                        {avg >= 75 && <TrendingUp className="w-4 h-4 text-green-500" />}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 font-bold text-indigo-600">{highest.toFixed(1)}</td>
                                                <td className="py-4 px-6 font-bold text-orange-600">{lowest.toFixed(1)}</td>
                                                <td className="py-4 px-6 font-bold text-green-600">{pass}</td>
                                                <td className="py-4 px-6 font-bold text-red-600">{fail}</td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                                        isApproved 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {item.status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    {!isApproved ? (
                                                        <button 
                                                            onClick={() => handleApprove(item.subjectName, item.examName, item.className, item.sectionName)}
                                                            className="px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white text-sm font-bold rounded-xl transition-all shadow-sm active:scale-95"
                                                        >
                                                            Approve
                                                        </button>
                                                    ) : (
                                                        <span className="text-green-600 flex items-center justify-end gap-1 font-bold text-sm">
                                                            <CheckCircle className="w-4 h-4" />
                                                            Verified
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewMarks;
