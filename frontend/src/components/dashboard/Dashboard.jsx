import React, { useState, useEffect } from 'react';
import { Phone, Users, TrendingUp, Activity, RefreshCw } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatCard = ({ icon, title, value, color, loading }) => {
    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6 flex items-center">
                <div className="mr-4 text-gray-400">
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <div className="h-6 bg-gray-200 rounded w-16 mt-1 animate-pulse"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
            <div className={`mr-4 p-3 rounded-full ${color} text-white`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            // Fetch data from multiple endpoints
            const [leadsRes] = await Promise.allSettled([
                fetch('http://localhost:3001/api/leads')
            ]);
            // Mock calls and analytics for now
            const calls = [];
            const sentimentData = { positive: 0, neutral: 0, negative: 0 };
            const conversionData = { rate: 0 };

            const leads = leadsRes.status === 'fulfilled' && leadsRes.value?.ok
                ? (await leadsRes.value.json()).leads || []
                : [];

            // Calculate conversion rate
            const convertedLeads = leads.filter(l => l.status === 'Converted' || l.status === 'converted').length;
            const conversionRate = leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0;

            // Process sentiment data
            const sentimentChartData = [
                { name: 'Positive', value: sentimentData.positive || 0 },
                { name: 'Neutral', value: sentimentData.neutral || 0 },
                { name: 'Negative', value: sentimentData.negative || 0 },
            ];

            // Process call trends (last 6 months)
            const now = new Date();
            const callTrends = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                const monthCalls = calls.filter(c => {
                    const callDate = new Date(c.createdAt || c.startTime);
                    return callDate.getMonth() === date.getMonth() && callDate.getFullYear() === date.getFullYear();
                }).length;
                callTrends.push({ month: monthName, calls: monthCalls });
            }

            setAnalytics({
                totalCalls: calls.length,
                totalLeads: leads.length,
                conversionRate: conversionData.rate || conversionRate,
                activeAgents: 12, // This would come from users API
                callTrends,
                sentimentData: sentimentChartData,
            });
        } catch (err) {
            console.error('Failed to load analytics:', err);
            // Set default data in case of error
            setAnalytics({
                totalCalls: 0,
                totalLeads: 0,
                conversionRate: 0,
                activeAgents: 0,
                callTrends: [],
                sentimentData: [
                    { name: 'Positive', value: 0 },
                    { name: 'Neutral', value: 0 },
                    { name: 'Negative', value: 0 },
                ],
            });
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

    if (!analytics) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={<Phone className="w-8 h-8" />}
                    title="Total Calls"
                    value={analytics.totalCalls}
                    color="bg-blue-500"
                    loading={loading}
                />
                <StatCard
                    icon={<Users className="w-8 h-8" />}
                    title="Total Leads"
                    value={analytics.totalLeads}
                    color="bg-green-500"
                    loading={loading}
                />
                <StatCard
                    icon={<TrendingUp className="w-8 h-8" />}
                    title="Conversion Rate"
                    value={`${analytics.conversionRate}%`}
                    color="bg-purple-500"
                    loading={loading}
                />
                <StatCard
                    icon={<Activity className="w-8 h-8" />}
                    title="Active Agents"
                    value={analytics.activeAgents}
                    color="bg-orange-500"
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Call Trends</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.callTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Sentiment Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={analytics.sentimentData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {analytics.sentimentData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;