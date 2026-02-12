import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Phone, RefreshCw, Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [communicationMetrics, setCommunicationMetrics] = useState(null);
    const [conversionMetrics, setConversionMetrics] = useState(null);
    const [sentimentData, setSentimentData] = useState(null);
    const [performanceMetrics, setPerformanceMetrics] = useState(null);

    const loadAnalytics = async () => {
        setLoading(true);
        // Mock analytics for now
        setCommunicationMetrics({ totalCalls: 0, avgDuration: '0:00', responseRate: 0 });
        setConversionMetrics({ rate: 0, total: 0, thisMonth: 0, lastMonth: 0 });
        setSentimentData({ positive: 0, neutral: 0, negative: 0 });
        setPerformanceMetrics({ topPerformer: 'N/A', avgResponseTime: '0:00', successRate: 0 });
        setLoading(false);
    };

    const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
                <div className="flex space-x-2">
                    <button
                        onClick={loadAnalytics}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <RefreshCw size={16} />
                        <span>Refresh</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Download size={16} />
                        <span>Export</span>
                    </button>
                </div>
            </div>

            {/* Communication Metrics */}
            {communicationMetrics && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <Phone className="mr-2" size={20} />
                        Communication Metrics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-sm text-gray-500 mb-2">Total Calls</p>
                            <p className="text-3xl font-bold text-gray-800">{communicationMetrics.totalCalls || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-sm text-gray-500 mb-2">Average Call Duration</p>
                            <p className="text-3xl font-bold text-gray-800">{communicationMetrics.avgDuration || '0:00'}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-sm text-gray-500 mb-2">Response Rate</p>
                            <p className="text-3xl font-bold text-gray-800">{communicationMetrics.responseRate || 0}%</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Conversion Metrics */}
            {conversionMetrics && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <TrendingUp className="mr-2" size={20} />
                        Conversion Metrics
                    </h2>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Conversion Rate</p>
                                <p className="text-3xl font-bold text-gray-800">{conversionMetrics.rate || 0}%</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Total Conversions</p>
                                <p className="text-3xl font-bold text-gray-800">{conversionMetrics.total || 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-2">This Month</p>
                                <p className="text-3xl font-bold text-gray-800">{conversionMetrics.thisMonth || 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Last Month</p>
                                <p className="text-3xl font-bold text-gray-800">{conversionMetrics.lastMonth || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sentiment Analysis */}
            {sentimentData && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Sentiment Analysis</h2>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Positive', value: sentimentData.positive || 0 },
                                                { name: 'Neutral', value: sentimentData.neutral || 0 },
                                                { name: 'Negative', value: sentimentData.negative || 0 },
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {[
                                                { name: 'Positive', value: sentimentData.positive || 0 },
                                                { name: 'Neutral', value: sentimentData.neutral || 0 },
                                                { name: 'Negative', value: sentimentData.negative || 0 },
                                            ].map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-col justify-center space-y-4">
                                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                    <span className="font-medium text-gray-700">Positive</span>
                                    <span className="text-2xl font-bold text-green-600">{sentimentData.positive || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                                    <span className="font-medium text-gray-700">Neutral</span>
                                    <span className="text-2xl font-bold text-yellow-600">{sentimentData.neutral || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                                    <span className="font-medium text-gray-700">Negative</span>
                                    <span className="text-2xl font-bold text-red-600">{sentimentData.negative || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Performance Metrics */}
            {performanceMetrics && (
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <BarChart3 className="mr-2" size={20} />
                        Performance Metrics
                    </h2>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Top Performer</p>
                                <p className="text-2xl font-bold text-gray-800">{performanceMetrics.topPerformer || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Average Response Time</p>
                                <p className="text-2xl font-bold text-gray-800">{performanceMetrics.avgResponseTime || '0:00'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Success Rate</p>
                                <p className="text-2xl font-bold text-gray-800">{performanceMetrics.successRate || 0}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!communicationMetrics && !conversionMetrics && !sentimentData && !performanceMetrics && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No analytics data available</p>
                </div>
            )}
        </div>
    );
};

export default Analytics;
