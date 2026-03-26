import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { reportsAPI, studentsAPI, attendanceAPI, feesAPI, masterAPI } from '../../services/api';
import DateTimeDisplay from '../common/DateTimeDisplay';
import CircularNotificationBell from '../common/CircularNotificationBell';
import DashboardCircularsPanel from '../common/DashboardCircularsPanel';
import {
    Users,
    UserCheck,
    Building2,
    BookOpen,
    TrendingUp,
    LogOut,
    FileText,
    Calendar,
    CheckCircle,
    XCircle,
    AlertCircle,
    GraduationCap,
    DollarSign,
    Activity,
    BrainCircuit,
    MessageSquare,
    Send
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';

// Today's Attendance Summary Component
const TodayAttendanceSummary = () => {
    const [attendanceData, setAttendanceData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTodayAttendance();
    }, []);

    const fetchTodayAttendance = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await attendanceAPI.getSummary({ start_date: today, end_date: today });
            const summary = response.data.data?.summary || [];
            const totalStudents = summary.length;
            const presentStudents = summary.filter(s => s.present_days > 0).length;
            const absentStudents = summary.filter(s => s.absent_days > 0).length;

            setAttendanceData({
                totalStudents,
                presentStudents,
                absentStudents,
                attendancePercentage: totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0
            });
        } catch (error) {
            console.error('Failed to fetch today attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-gray-500 text-center py-4">Loading attendance...</div>;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-blue-600 text-sm font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-800">{attendanceData?.totalStudents || 0}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <p className="text-green-600 text-sm font-medium">Present</p>
                <p className="text-2xl font-bold text-green-800">{attendanceData?.presentStudents || 0}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <p className="text-red-600 text-sm font-medium">Absent</p>
                <p className="text-2xl font-bold text-red-800">{attendanceData?.absentStudents || 0}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <p className="text-yellow-600 text-sm font-medium">Rate</p>
                <p className="text-2xl font-bold text-yellow-800">{attendanceData?.attendancePercentage || 0}%</p>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState(null);
    const [feeStats, setFeeStats] = useState(null);
    const [classWiseFeeStats, setClassWiseFeeStats] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [selectedClass]);

    const fetchClasses = async () => {
        try {
            const response = await masterAPI.getClasses();
            setClasses(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        }
    };

    const fetchDashboardData = async () => {
        try {
            // Use academic year format (e.g., "2026-2027")
            const currentYear = new Date().getFullYear();
            const academicYear = `${currentYear}-${currentYear + 1}`;

            // Parallel data fetching
            const [academicResponse, feeResponse, classWiseFeeResponse] = await Promise.allSettled([
                reportsAPI.getAcademicAnalytics({ class_id: selectedClass }),
                feesAPI.getStatistics({ academicYear, classId: selectedClass }),
                feesAPI.getClassWiseStatistics({ academicYear })
            ]);

            const academicData = academicResponse.status === 'fulfilled' ? academicResponse.value.data.data : {};
            const feeData = feeResponse.status === 'fulfilled' ? feeResponse.value.data.data : {
                collectionRate: 0,
                totalPendingAmount: 0,
                paidCount: 0,
                partialCount: 0,
                pendingCount: 0
            };
            const classWiseFeeData = classWiseFeeResponse.status === 'fulfilled' ? classWiseFeeResponse.value.data.data : [];

            setStats({
                ...academicData,
                totalStudents: academicData.totalStudents || 0,
                academicYear
            });

            setFeeStats(feeData);
            setClassWiseFeeStats(classWiseFeeData);

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            // Set default values on error
            setFeeStats({
                collectionRate: 0,
                totalPendingAmount: 0,
                paidCount: 0,
                partialCount: 0,
                pendingCount: 0
            });
        } finally {
            setLoading(false);
        }
    };
    // eslint-disable-next-line no-unused-vars
    const StatCard = ({ icon: Icon, title, value, subtext, color, trend }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
                </div>
                <div className={`p-3 rounded-full ${color.bg} ${color.text}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center text-sm text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>{trend}</span>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="text-gray-500 text-xs sm:text-sm">Overview of School Performance</p>
                        </div>

                        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="flex-1 sm:w-48 text-sm border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2"
                            >
                                <option value="">All Classes</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.class_name}
                                    </option>
                                ))}
                            </select>

                            <DateTimeDisplay className="hidden lg:flex" />
                            <CircularNotificationBell />

                            <div className="flex items-center gap-2 border-l pl-3 border-gray-200">
                                <div className="hidden xs:block text-right">
                                    <p className="text-xs font-bold text-gray-900 truncate max-w-[100px]">{user?.fullName}</p>
                                    <p className="text-[10px] text-gray-500 capitalize">{user?.role}</p>
                                </div>
                                <button onClick={logout} className="p-2 text-gray-400 hover:text-red-600 transition bg-gray-50 rounded-lg">
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                icon={Users}
                                title="Total Students"
                                value={stats?.totalStudents || 0}
                                color={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
                            />
                            <StatCard
                                icon={CheckCircle}
                                title="Avg Attendance"
                                value={`${stats?.avgAttendance || 0}%`}
                                color={{ bg: 'bg-green-50', text: 'text-green-600' }}
                            />
                            <StatCard
                                icon={DollarSign}
                                title="Fee Collection"
                                value={`₹${(feeStats?.totalPaidAmount || 0).toLocaleString('en-IN')}`}
                                subtext={`${feeStats?.collectionRate || 0}% of ₹${(feeStats?.totalFeeAmount || 0).toLocaleString('en-IN')} collected`}
                                color={{ bg: 'bg-yellow-50', text: 'text-yellow-600' }}
                            />
                            <StatCard
                                icon={Activity}
                                title="Avg Performance"
                                value={`${stats?.avgPerformance || 0}%`}
                                color={{ bg: 'bg-purple-50', text: 'text-purple-600' }}
                            />
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Attendance Trends</h3>
                                <div className="h-64">
                                    <TodayAttendanceSummary />
                                    <div className="mt-6 text-center text-sm text-gray-400">
                                        * Historic trend chart placed here in future updates
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Fee Collection Analysis</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={
                                            (selectedClass
                                                ? classWiseFeeStats.filter(item => {
                                                    const cls = classes.find(c => c.id.toString() === selectedClass);
                                                    return item.class_name === cls?.class_name;
                                                })
                                                : classWiseFeeStats
                                            ).map(item => ({
                                                name: item.class_name,
                                                Collected: parseFloat(item.collected_amount || 0),
                                                Pending: parseFloat(item.pending_amount || 0)
                                            }))
                                        }
                                        margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 10 }}
                                            angle={-45}
                                            textAnchor="end"
                                            interval={0}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10 }}
                                            tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                                        <Bar dataKey="Collected" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} barSize={selectedClass ? 60 : undefined} />
                                        <Bar dataKey="Pending" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={selectedClass ? 60 : undefined} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Class-wise Statistics Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Class-wise Performance & Fee Analysis</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Class
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total Students
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Avg Performance
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Fee Collected
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Fee Pending
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Collection Rate
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {classWiseFeeStats.length > 0 ? (
                                            classWiseFeeStats.map((classData, index) => {
                                                const collected = parseFloat(classData.collected_amount || 0);
                                                const pending = parseFloat(classData.pending_amount || 0);
                                                const total = collected + pending;
                                                const collectionRate = total > 0 ? ((collected / total) * 100).toFixed(1) : 0;
                                                const avgPerformance = parseFloat(classData.avg_performance || 0).toFixed(1);
                                                const studentCount = parseInt(classData.student_count || 0);

                                                return (
                                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {classData.class_name}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{studentCount}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {avgPerformance}%
                                                                </div>
                                                                <div className={`ml-2 px-2 py-1 text-xs rounded-full ${avgPerformance >= 75
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : avgPerformance >= 50
                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {avgPerformance >= 75 ? 'Good' : avgPerformance >= 50 ? 'Average' : 'Poor'}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-green-600">
                                                                ₹{collected.toLocaleString('en-IN')}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-red-600">
                                                                ₹{pending.toLocaleString('en-IN')}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {collectionRate}%
                                                                </div>
                                                                <div className="ml-2 w-24 bg-gray-200 rounded-full h-2">
                                                                    <div
                                                                        className={`h-2 rounded-full ${collectionRate >= 75
                                                                            ? 'bg-green-500'
                                                                            : collectionRate >= 50
                                                                                ? 'bg-yellow-500'
                                                                                : 'bg-red-500'
                                                                            }`}
                                                                        style={{ width: `${collectionRate}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                                    No class data available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Quick Actions Grid */}
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <Link to="/students" className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Users className="w-5 h-5" /></div>
                                <span className="font-medium text-gray-700">Manage Students</span>
                            </Link>
                            <Link to="/teachers" className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><GraduationCap className="w-5 h-5" /></div>
                                <span className="font-medium text-gray-700">Teacher Management</span>
                            </Link>
                            <Link to="/hods" className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Building2 className="w-5 h-5" /></div>
                                <span className="font-medium text-gray-700">HOD Management</span>
                            </Link>
                            <Link to="/fees" className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600"><DollarSign className="w-5 h-5" /></div>
                                <span className="font-medium text-gray-700">Fee Management</span>
                            </Link>
                            <Link to="/class-fee-structure" className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><DollarSign className="w-5 h-5" /></div>
                                <span className="font-medium text-gray-700">Class Fee Structure</span>
                            </Link>
                            <Link to="/attendance" className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg text-green-600"><Calendar className="w-5 h-5" /></div>
                                <span className="font-medium text-gray-700">Mark Attendance</span>
                            </Link>
                            <Link to="/ai-predictions" className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><BrainCircuit className="w-5 h-5" /></div>
                                <span className="font-medium text-gray-700">AI Insights</span>
                            </Link>
                            <Link to="/quick-action" className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg text-green-600"><Send className="w-5 h-5" /></div>
                                <span className="font-medium text-gray-700">Send Student Update</span>
                            </Link>
                            <Link to="/circulars" className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Send className="w-5 h-5" /></div>
                                <span className="font-medium text-gray-700">E-Circulars (Teachers)</span>
                            </Link>
                        </div>

                        {/* Recent Circulars Dashboard Panel */}
                        <div className="mt-8">
                            <DashboardCircularsPanel />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
