import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hodAPI } from '../../services/api';
import { Calendar, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const AttendanceTracking = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await hodAPI.getAttendance();
            setData(response.data.data || []);
        } catch (err) {
            console.error('Failed to fetch attendance data:', err);
            setError('Failed to load department attendance. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 animate-spin text-green-600 mb-4" />
                <p className="text-gray-600 font-medium">Loading Attendance Data...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-500 hover:text-green-600 transition mb-6 group"
            >
                <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 group-hover:border-green-200 group-hover:bg-green-50 transition">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="font-medium">Back to Dashboard</span>
            </button>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-green-600" />
                        Attendance Tracking
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">Monitor student attendance for your department's subjects.</p>
                </div>
            </div>

            {error ? (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-3">
                    <AlertCircle className="text-red-500 w-5 h-5" />
                    <p className="text-red-700 font-medium">{error}</p>
                </div>
            ) : (
                <>
                    {/* Charts Section */}
                    {data.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 mb-8 animate-fade-in">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-green-500 rounded-full inline-block"></span>
                                Attendance Overview by Subject
                            </h3>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart
                                    data={data.map(item => ({
                                        name: item.subjectName,
                                        Present: parseInt(item.presentCount),
                                        Absent: parseInt(item.absentCount)
                                    }))}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 11 }}
                                        angle={-45}
                                        textAnchor="end"
                                        interval={0}
                                        height={60}
                                    />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="Present" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} maxBarSize={50} />
                                    <Bar dataKey="Absent" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Data Table */}
                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-transparent">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-blue-500 rounded-full inline-block"></span>
                                Subject-wise Breakdown
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white border-b border-gray-100">
                                    <tr>
                                        <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Subject Name</th>
                                        <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Total Records</th>
                                        <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Present</th>
                                        <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Absent</th>
                                        <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Attendance %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {data.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-12 text-center text-gray-500 italic">No attendance data available.</td>
                                        </tr>
                                    ) : (
                                        data.map((item, idx) => {
                                            const total = parseInt(item.totalRecords) || 0;
                                            const present = parseInt(item.presentCount) || 0;
                                            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
                                            
                                            return (
                                                <tr key={idx} className="hover:bg-green-50/20 transition-colors">
                                                    <td className="py-4 px-6 font-bold text-gray-900">{item.subjectName}</td>
                                                    <td className="py-4 px-6 font-medium text-gray-600">{total}</td>
                                                    <td className="py-4 px-6 font-medium text-green-600">{present}</td>
                                                    <td className="py-4 px-6 font-medium text-red-600">{parseInt(item.absentCount) || 0}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-bold text-gray-900 w-12">{percentage}%</span>
                                                            <div className="w-full bg-gray-100 rounded-full h-2 max-w-[100px]">
                                                                <div 
                                                                    className={`h-2 rounded-full ${percentage >= 75 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                                                    style={{ width: `${percentage}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AttendanceTracking;
