import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { circularsAPI, teachersAPI, masterAPI } from '../../services/api';
import { FileText, Upload, Send, Loader2, AlertCircle, ArrowLeft, Trash2, Users, Grid, BookOpen, Search, Paperclip, RotateCcw } from 'lucide-react';

const Circulars = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [circulars, setCirculars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Form state (admin & hod)
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [files, setFiles] = useState([]);
    
    // Smart Recipient Selection State
    const [targetRoles, setTargetRoles] = useState([]);
    const [targetDepartments, setTargetDepartments] = useState([]);
    
    // Dropdown Data
    const [departments, setDepartments] = useState([]);
    
    // Preview State
    const [recipientCount, setRecipientCount] = useState(0);
    const [fetchingCount, setFetchingCount] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    const canCreate = ['admin', 'hod'].includes(user?.role);

    useEffect(() => {
        loadCirculars();
        if (canCreate) {
            loadDropdownData();
        }
    }, [canCreate]);

    useEffect(() => {
        if (!canCreate) return;
        const fetchPreview = async () => {
            if (!targetRoles.length && !targetDepartments.length) {
                setRecipientCount(0);
                return;
            }
            setFetchingCount(true);
            try {
                const res = await circularsAPI.previewRecipients({
                    targetRoles,
                    targetDepartments
                });
                setRecipientCount(res.data.count || 0);
            } catch (err) {
                console.error('Failed to preview recipients', err);
            } finally {
                setFetchingCount(false);
            }
        };

        const timer = setTimeout(() => {
            fetchPreview();
        }, 500); // debounce API calls

        return () => clearTimeout(timer);
    }, [targetRoles, targetDepartments, canCreate]);

    const loadDropdownData = async () => {
        try {
            const [deptRes] = await Promise.all([
                masterAPI.getDepartments()
            ]);
            setDepartments(deptRes.data.data || []);
        } catch (err) {
            console.error('Failed to load dropdown data:', err);
        }
    };

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
                targetRoles,
                targetDepartments,
                files
            });
            setSuccess('Circular sent successfully.');
            setTitle('');
            setMessage('');
            setFiles([]);
            setTargetRoles([]);
            setTargetDepartments([]);
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
                {canCreate
                    ? 'Create and target circulars to specific roles, departments, subjects, or individuals with scheduling options.'
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

            {canCreate && (
                <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-blue-600" />
                            New Circular
                        </h2>
                        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-800">
                                {fetchingCount ? 'Calculating...' : `${recipientCount} Recipients Selected`}
                            </span>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
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

                        <div className="border border-blue-100 rounded-xl p-5 bg-gradient-to-br from-blue-50/40 to-indigo-50/40 space-y-5">
                            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    Smart Recipient Targeting
                                </h3>
                                <span className="text-[11px] text-blue-500 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                                    Sends to users matching ANY rule below
                                </span>
                            </div>

                            {/* Target Roles */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Target by Role</span>
                                    {targetRoles.length > 0 && (
                                        <button type="button" onClick={() => setTargetRoles([])} className="text-[10px] text-red-400 hover:text-red-600">Clear</button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {[{ value: 'teacher', label: 'Teacher' }, { value: 'hod', label: 'HOD' }].map(({ value, label }) => {
                                        const selected = targetRoles.includes(value);
                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => {
                                                    if (selected) setTargetRoles(targetRoles.filter(r => r !== value));
                                                    else setTargetRoles([...targetRoles, value]);
                                                }}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                                                    selected
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                                                }`}
                                            >
                                                {selected && <span className="text-white text-xs">✓</span>}
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Target Departments */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                        <Grid className="w-3 h-3" /> Target by Department
                                    </span>
                                    {targetDepartments.length > 0 && (
                                        <button type="button" onClick={() => setTargetDepartments([])} className="text-[10px] text-red-400 hover:text-red-600">Clear</button>
                                    )}
                                </div>
                                {departments.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">No departments available</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {departments.map(d => {
                                            const selected = targetDepartments.includes(d.id);
                                            return (
                                                <button
                                                    key={d.id}
                                                    type="button"
                                                    onClick={() => {
                                                        if (selected) setTargetDepartments(targetDepartments.filter(id => id !== d.id));
                                                        else setTargetDepartments([...targetDepartments, d.id]);
                                                    }}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                                                        selected
                                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                            : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
                                                    }`}
                                                >
                                                    {selected && <span className="text-white text-xs">✓</span>}
                                                    {d.department_name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Attachments (optional)
                            </label>
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.xls,.xlsx,.csv"
                                onChange={(e) => setFiles(e.target.files)}
                                className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Allowed types: PDF, Excel (.xls, .xlsx), CSV. Max 5 files, 10MB each.
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
        </div>
    );
};

export default Circulars;

