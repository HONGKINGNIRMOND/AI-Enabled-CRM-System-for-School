import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiAPI } from '../../services/api';
import { AlertTriangle, TrendingDown, Eye, BrainCircuit, RefreshCw, Info, ArrowLeft } from 'lucide-react';

const AIPredictions = () => {
    const navigate = useNavigate();
    const [atRiskStudents, setAtRiskStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPredictions();
    }, []);

    const fetchPredictions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await aiAPI.getAttendancePredictions();
            setAtRiskStudents(response.data.data || []);
        } catch (error) {
            console.error('Error fetching predictions:', error);
            setError(error.response?.data?.message || 'Failed to load AI predictions');
        } finally {
            setLoading(false);
        }
    };

    const getRiskBadgeColor = (riskLevel) => {
        return riskLevel === 'High'
            ? 'bg-red-100 text-red-800 border-red-200'
            : 'bg-yellow-100 text-yellow-800 border-yellow-200';
    };

    const getAttendanceColor = (percentage) => {
        const pct = parseFloat(percentage);
        if (pct >= 90) return 'text-green-600';
        if (pct >= 75) return 'text-blue-600';
        if (pct >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

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
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <BrainCircuit className="w-8 h-8 text-purple-600" />
                            AI Insights & Predictions
                        </h1>
                        <p className="text-gray-500 mt-1">AI-driven analysis of student attendance patterns and risk detection</p>
                    </div>
                    <button
                        onClick={fetchPredictions}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Analysis
                    </button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">How AI Insights Work</p>
                    <p>Our AI analyzes attendance patterns over the last 90 days to identify students at risk. Risk factors include: significant attendance drops (&gt;10%), critically low attendance (&lt;75%), and consistent declining trends.</p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {/* Statistics Cards */}
            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total At-Risk</p>
                                <p className="text-3xl font-bold text-gray-900">{atRiskStudents.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">High Risk</p>
                                <p className="text-3xl font-bold text-red-600">
                                    {atRiskStudents.filter(s => s.risk_level === 'High').length}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <TrendingDown className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Medium Risk</p>
                                <p className="text-3xl font-bold text-yellow-600">
                                    {atRiskStudents.filter(s => s.risk_level === 'Medium').length}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Eye className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* At-Risk Students Table */}
            <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
                <div className="p-6 border-b border-red-50 bg-gradient-to-r from-red-50 to-orange-50">
                    <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Attendance Risk Alerts
                    </h2>
                    <p className="text-sm text-red-600 mt-1">
                        Students requiring immediate attention and intervention
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current %</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previous %</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drop</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
                                            <p className="text-gray-500">Analyzing attendance data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                        Unable to load predictions. Please try again.
                                    </td>
                                </tr>
                            ) : atRiskStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-lg font-semibold text-gray-900">No High-Risk Students Detected</p>
                                                <p className="text-gray-500 mt-1">All students are maintaining good attendance. Great job!</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                atRiskStudents.map((student, index) => (
                                    <tr key={index} className="hover:bg-red-50/30 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{student.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.roll_number || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.class}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-sm font-bold ${getAttendanceColor(student.current_attendance)}`}>
                                                {student.current_attendance}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.previous_attendance}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {parseFloat(student.drop_percentage) > 0 ? (
                                                <span className="text-sm text-red-600 flex items-center gap-1 font-bold">
                                                    <TrendingDown className="w-4 h-4" />
                                                    {student.drop_percentage}%
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRiskBadgeColor(student.risk_level)}`}>
                                                {student.risk_level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="max-w-xs">
                                                {student.reason}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Action Recommendations */}
            {!loading && atRiskStudents.length > 0 && (
                <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5" />
                        Recommended Actions
                    </h3>
                    <ul className="space-y-2 text-sm text-purple-800">
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600 font-bold">•</span>
                            <span>Contact parents of high-risk students immediately to discuss attendance concerns</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600 font-bold">•</span>
                            <span>Schedule one-on-one meetings with students showing declining trends</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600 font-bold">•</span>
                            <span>Implement attendance improvement plans for students below 75%</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600 font-bold">•</span>
                            <span>Monitor these students weekly and update intervention strategies as needed</span>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AIPredictions;
