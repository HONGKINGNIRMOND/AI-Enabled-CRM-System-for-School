import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { circularsAPI } from '../../services/api';
import { FileText, Upload, Send, Loader2, AlertCircle, ArrowLeft, Trash2 } from 'lucide-react';

const Circulars = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [circulars, setCirculars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Form state (admin)
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [files, setFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        loadCirculars();
    }, []);

    const loadCirculars = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await circularsAPI.list();
            setCirculars(res.data.data || []);
        } catch (err) {
            console.error('Failed to load circulars:', err);
            setError('Failed to load circulars. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            setError('Title and message are required.');
            return;
        }
        setSubmitting(true);
        setError(null);
        setSuccess(null);
        try {
            await circularsAPI.create({
                title: title.trim(),
                message: message.trim(),
                audience: 'teachers',
                files
            });
            setSuccess('Circular sent successfully.');
            setTitle('');
            setMessage('');
            setFiles([]);
            await loadCirculars();
        } catch (err) {
            console.error('Failed to send circular:', err);
            setError(err.response?.data?.message || 'Failed to send circular.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this circular? This will also delete any attached files.')) {
            return;
        }

        setError(null);
        setSuccess(null);
        try {
            await circularsAPI.delete(id);
            setSuccess('Circular deleted successfully.');
            await loadCirculars();
        } catch (err) {
            console.error('Failed to delete circular:', err);
            setError(err.response?.data?.message || 'Failed to delete circular.');
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="mb-6 inline-flex items-center gap-3 text-sm font-medium text-gray-600 hover:text-blue-600 transition"
            >
                <span className="inline-flex items-center justify-center rounded-xl bg-white shadow-sm border border-gray-200 p-2 hover:border-blue-200 hover:bg-blue-50 transition">
                    <ArrowLeft className="w-4 h-4" />
                </span>
                <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">E-Circulars</h1>
            <p className="text-sm text-gray-600 mb-6">
                {isAdmin
                    ? 'Create and send circulars with PDF or Excel attachments to all teachers.'
                    : 'View circulars and download attached PDF / Excel files shared by the administration.'}
            </p>

            {error && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <Send className="w-4 h-4 mt-0.5" />
                    <span>{success}</span>
                </div>
            )}

            {isAdmin && (
                <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-blue-600" />
                        New Circular to Teachers
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Staff Meeting on Friday"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Provide details about the circular..."
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Attachments (optional)
                            </label>
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.xls,.xlsx"
                                onChange={(e) => setFiles(e.target.files)}
                                className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Allowed types: PDF, Excel (.xls, .xlsx). Max 5 files, 10MB each.
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Send Circular
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Recent Circulars
                </h2>

                {loading ? (
                    <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Loading circulars...
                    </div>
                ) : circulars.length === 0 ? (
                    <p className="text-sm text-gray-500">No circulars available.</p>
                ) : (
                    <div className="space-y-4">
                        {circulars.map((circular) => (
                            <div
                                key={circular.id}
                                className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition"
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900">
                                            {circular.title}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                                            {circular.message}
                                        </p>
                                        <p className="mt-2 text-xs text-gray-400">
                                            From: {circular.createdBy} •{' '}
                                            {new Date(circular.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDelete(circular.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                            title="Delete Circular"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                {circular.attachments && circular.attachments.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {circular.attachments.map((file) => (
                                            <a
                                                key={file.fileName}
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs text-indigo-700 hover:bg-indigo-100"
                                            >
                                                <FileText className="w-3 h-3" />
                                                <span className="truncate max-w-[180px]">
                                                    {file.originalName}
                                                </span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Circulars;

