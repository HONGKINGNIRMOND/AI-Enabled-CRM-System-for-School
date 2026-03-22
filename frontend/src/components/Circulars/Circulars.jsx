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
    const [targetSubjects, setTargetSubjects] = useState([]);
    const [targetUsers, setTargetUsers] = useState([]);
    const [staffSearch, setStaffSearch] = useState('');
    
    // Dropdown Data
    const [departments, setDepartments] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    
    // Preview State
    const [recipientCount, setRecipientCount] = useState(0);
    const [fetchingCount, setFetchingCount] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    // Recent Circulars Filter State
    const [listSearch, setListSearch] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterAttachment, setFilterAttachment] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

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
            if (!targetRoles.length && !targetDepartments.length && !targetSubjects.length && !targetUsers.length) {
                setRecipientCount(0);
                return;
            }
            setFetchingCount(true);
            try {
                const res = await circularsAPI.previewRecipients({
                    targetRoles,
                    targetDepartments,
                    targetSubjects,
                    targetUsers
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
    }, [targetRoles, targetDepartments, targetSubjects, targetUsers, canCreate]);

    const loadDropdownData = async () => {
        try {
            const [deptRes, subRes, teacherRes] = await Promise.all([
                masterAPI.getDepartments(),
                masterAPI.getSubjects(),
                teachersAPI.getAll()
            ]);
            setDepartments(deptRes.data.data || []);
            setSubjects(subRes.data.data || []);
            setTeachers(teacherRes.data.data || []);
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
                targetSubjects,
                targetUsers,
                files
            });
            setSuccess('Circular sent successfully.');
            setTitle('');
            setMessage('');
            setFiles([]);
            setTargetRoles([]);
            setTargetDepartments([]);
            setTargetSubjects([]);
            setTargetUsers([]);
            setStaffSearch('');
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

    // Filtering for Recent Circulars list
    const _q = listSearch.toLowerCase();
    const filteredCirculars = circulars.filter(c => {
        if (_q && !c.title?.toLowerCase().includes(_q) && !c.message?.toLowerCase().includes(_q) && !c.createdBy?.toLowerCase().includes(_q)) return false;
        if (filterRole !== 'all' && c.creatorRole !== filterRole) return false;
        if (filterAttachment && !(c.attachments?.length > 0)) return false;
        
        // Date range filter
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (new Date(c.createdAt) < start) return false;
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (new Date(c.createdAt) > end) return false;
        }

        return true;
    });

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

                            {/* Target Subjects */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" /> Target by Subject
                                    </span>
                                    {targetSubjects.length > 0 && (
                                        <button type="button" onClick={() => setTargetSubjects([])} className="text-[10px] text-red-400 hover:text-red-600">Clear</button>
                                    )}
                                </div>
                                {subjects.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">No subjects available</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                                        {subjects.map(s => {
                                            const selected = targetSubjects.includes(s.id);
                                            return (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => {
                                                        if (selected) setTargetSubjects(targetSubjects.filter(id => id !== s.id));
                                                        else setTargetSubjects([...targetSubjects, s.id]);
                                                    }}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                                                        selected
                                                            ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                                            : 'bg-white text-gray-600 border-gray-300 hover:border-violet-400 hover:text-violet-600'
                                                    }`}
                                                >
                                                    {selected && <span className="text-white text-xs">✓</span>}
                                                    {s.subject_name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Target Specific Staff */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                        <Users className="w-3 h-3" /> Target Specific Staff
                                    </span>
                                    {targetUsers.length > 0 && (
                                        <button type="button" onClick={() => setTargetUsers([])} className="text-[10px] text-red-400 hover:text-red-600">Clear</button>
                                    )}
                                </div>
                                {/* Staff search */}
                                <input
                                    type="text"
                                    placeholder="Search staff by name..."
                                    value={staffSearch}
                                    onChange={e => setStaffSearch(e.target.value)}
                                    className="w-full mb-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                                />
                                {teachers.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">No staff available</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                                        {teachers
                                            .filter(t => !staffSearch || t.full_name?.toLowerCase().includes(staffSearch.toLowerCase()))
                                            .map(t => {
                                                const selected = targetUsers.includes(t.id);
                                                return (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => {
                                                            if (selected) setTargetUsers(targetUsers.filter(id => id !== t.id));
                                                            else setTargetUsers([...targetUsers, t.id]);
                                                        }}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                                                            selected
                                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                                                : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400 hover:text-emerald-600'
                                                        }`}
                                                    >
                                                        {selected && <span className="text-white text-xs">✓</span>}
                                                        {t.full_name}
                                                        <span className={`text-[10px] ${selected ? 'text-emerald-100' : 'text-gray-400'}`}>({t.role})</span>
                                                    </button>
                                                );
                                            })
                                        }
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {/* Header + Filter bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 shrink-0">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        Recent Circulars
                        {!loading && (
                            <span className="text-xs font-normal text-gray-400 ml-1">
                                ({filteredCirculars.length} results)
                            </span>
                        )}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search title, message, sender..."
                                value={listSearch}
                                onChange={e => setListSearch(e.target.value)}
                                className="pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-52"
                            />
                        </div>
                        {/* Sender Role */}
                        <select
                            value={filterRole}
                            onChange={e => setFilterRole(e.target.value)}
                            className="rounded-lg border border-gray-200 text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-600"
                        >
                            <option value="all">All Senders</option>
                            <option value="admin">Admin Only</option>
                            <option value="hod">HOD Only</option>
                        </select>
                        {/* Has Attachment toggle */}
                        <button
                            type="button"
                            onClick={() => setFilterAttachment(v => !v)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-all ${
                                filterAttachment
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                            }`}
                        >
                            <Paperclip className="w-3.5 h-3.5" />
                            With Attachment
                        </button>
                        {/* Clear all filters */}
                        {(listSearch || filterRole !== 'all' || filterAttachment || startDate || endDate) && (
                            <button
                                type="button"
                                onClick={() => { 
                                    setListSearch(''); 
                                    setFilterRole('all'); 
                                    setFilterAttachment(false);
                                    setStartDate('');
                                    setEndDate('');
                                }}
                                className="text-xs text-red-400 hover:text-red-600 px-2"
                            >
                                Clear filters
                            </button>
                        )}
                        {/* Refresh Button */}
                        <button
                            type="button"
                            onClick={loadCirculars}
                            disabled={loading}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition shrink-0"
                            title="Refresh List"
                        >
                            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Second row of filters - Date Range */}
                <div className="flex flex-wrap items-center gap-3 mb-5 pb-4 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">Date Range:</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="rounded-lg border border-gray-200 text-xs px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-600 font-medium"
                            title="Start Date"
                        />
                        <span className="text-gray-300 text-xs">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="rounded-lg border border-gray-200 text-xs px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-600 font-medium"
                            title="End Date"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Loading circulars...
                    </div>
                ) : filteredCirculars.length === 0 ? (
                    <p className="text-sm text-gray-400 italic py-4 text-center">
                        {circulars.length === 0 ? 'No circulars available.' : 'No circulars match your filters.'}
                    </p>
                ) : (
                    <div className="space-y-4">
                        {filteredCirculars.map((circular) => (
                            <div
                                key={circular.id}
                                className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition"
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900">
                                            {circular.title}
                                            {circular.scheduledDate && new Date(circular.scheduledDate) > new Date() && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                                    Scheduled
                                                </span>
                                            )}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                                            {circular.message}
                                        </p>
                                        <p className="mt-2 text-xs text-gray-400">
                                            From: {circular.createdBy} {circular.creatorRole ? `(${circular.creatorRole})` : ''} •{' '}
                                            {new Date(circular.createdAt).toLocaleString()}
                                            {circular.scheduledDate && (
                                                <span className="ml-2 text-amber-600 font-medium">
                                                    • Scheduled for: {new Date(circular.scheduledDate).toLocaleString()}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    {(user.role === 'admin' || circular.creatorId === user.id) && (
                                        <button
                                            onClick={() => handleDelete(circular.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
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

