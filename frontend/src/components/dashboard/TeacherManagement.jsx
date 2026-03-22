import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teachersAPI, masterAPI } from '../../services/api';
import { Users, BookOpen, Plus, Trash2, CheckCircle2, AlertCircle, Loader2, Upload, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import BulkUploadModal from '../common/BulkUploadModal';

const TeacherManagement = () => {
    const navigate = useNavigate();
    const [teachers, setTeachers] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // View state
    const [viewMode, setViewMode] = useState('assignments'); // 'assignments' or 'teachers'

    // Form state
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterSubject, setFilterSubject] = useState('');

    // Teacher creation state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [newTeacher, setNewTeacher] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
        phone: ''
    });

    // Selection state
    const [selectedTeachers, setSelectedTeachers] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [teachersRes, assignmentsRes, classesRes, subjectsRes] = await Promise.all([
                teachersAPI.getAll(),
                teachersAPI.getAssignments(),
                masterAPI.getClasses(),
                masterAPI.getSubjects()
            ]);
            setTeachers(teachersRes.data.data);
            setAssignments(assignmentsRes.data.data);
            setClasses(classesRes.data.data);
            setSubjects(subjectsRes.data.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!selectedTeacher || !selectedClass || !selectedSubject) {
            setError('Please select all fields');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            await teachersAPI.assign({
                teacher_id: selectedTeacher,
                class_id: selectedClass,
                subject_id: selectedSubject
            });
            setSuccess('Teacher assigned successfully!');
            fetchData();
            // Reset selection
            setSelectedTeacher('');
            setSelectedClass('');
            setSelectedSubject('');

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Assignment error:', err);
            setError('Failed to assign teacher.');
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (id) => {
        if (!window.confirm('Are you sure you want to remove this assignment?')) return;

        try {
            await teachersAPI.removeAssignment(id);
            setSuccess('Assignment removed successfully');
            fetchData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Remove error:', err);
            setError('Failed to remove assignment.');
        }
    };

    const handleCreateTeacher = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);

            if (isEditing) {
                await teachersAPI.update(editingId, newTeacher);
                setSuccess('Teacher updated successfully!');
            } else {
                await teachersAPI.create(newTeacher);
                setSuccess('Teacher created successfully!');
            }

            setShowCreateModal(false);
            setIsEditing(false);
            setEditingId(null);
            setNewTeacher({ username: '', email: '', password: '', full_name: '', phone: '' });
            fetchData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Teacher operation error:', err);
            setError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} teacher.`);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (teacher) => {
        setNewTeacher({
            username: teacher.username || '',
            email: teacher.email || '',
            password: '', // Don't show password
            full_name: teacher.full_name || '',
            phone: teacher.phone || ''
        });
        setEditingId(teacher.id);
        setIsEditing(true);
        setShowCreateModal(true);
    };
    
    const handleDeleteTeacher = async (id) => {
        if (!window.confirm('Are you sure you want to delete this teacher? This will also remove all their class assignments.')) return;

        try {
            setSaving(true);
            await teachersAPI.delete(id);
            setSuccess('Teacher deleted successfully');
            fetchData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Delete teacher error:', err);
            setError(err.response?.data?.message || 'Failed to delete teacher.');
        } finally {
            setSaving(false);
        }
    };

    const handleBulkDeleteTeachers = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedTeachers.length} teachers? This will also remove all their class assignments.`)) return;

        try {
            setSaving(true);
            await teachersAPI.bulkDelete(selectedTeachers);
            setSuccess(`${selectedTeachers.length} teachers deleted successfully`);
            setSelectedTeachers([]);
            fetchData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Bulk delete teachers error:', err);
            setError(err.response?.data?.message || 'Failed to delete teachers.');
        } finally {
            setSaving(false);
        }
    };

    const handleSelectTeacher = (id) => {
        setSelectedTeachers(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAllTeachers = () => {
        if (selectedTeachers.length === teachers.length) {
            setSelectedTeachers([]);
        } else {
            setSelectedTeachers(teachers.map(t => t.id));
        }
    };

    const handleBulkUpload = async (file) => {
        try {
            const response = await teachersAPI.bulkUpload(file);
            fetchData();
            return response;
        } catch (err) {
            console.error('Bulk upload error:', err);
            throw err;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600 font-medium">Loading teacher data...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition mb-6 group"
            >
                <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 group-hover:border-blue-200 group-hover:bg-blue-50 transition">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="font-medium">Back to Dashboard</span>
            </button>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Teacher Management</h1>
                    <p className="mt-2 text-lg text-gray-600">Assign teachers to classes and subjects.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                    >
                        <Upload className="w-5 h-5" />
                        Bulk Upload
                    </button>
                    <button
                        onClick={() => {
                            setIsEditing(false);
                            setNewTeacher({ username: '', email: '', password: '', full_name: '', phone: '' });
                            setShowCreateModal(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                        <Users className="w-5 h-5" />
                        Add Teacher
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-3 animate-shake">
                    <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0" />
                    <p className="text-red-700 font-medium">{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-center gap-3 animate-fade-in">
                    <CheckCircle2 className="text-green-500 w-5 h-5 flex-shrink-0" />
                    <p className="text-green-700 font-medium">{success}</p>
                </div>
            )}

            {/* View Toggle */}
            <div className="flex p-1 bg-gray-100 rounded-2xl w-fit mb-8 shadow-inner">
                <button
                    onClick={() => setViewMode('assignments')}
                    className={`px-8 py-3 rounded-xl font-bold transition-all ${viewMode === 'assignments'
                        ? 'bg-white text-blue-600 shadow-md transform scale-100'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Management & Assignments
                </button>
                <button
                    onClick={() => setViewMode('teachers')}
                    className={`px-8 py-3 rounded-xl font-bold transition-all ${viewMode === 'teachers'
                        ? 'bg-white text-blue-600 shadow-md transform scale-100'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Teachers Directory
                </button>
            </div>

            {viewMode === 'assignments' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Assignment Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
                            <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Plus className="w-6 h-6" />
                                    New Assignment
                                </h2>
                            </div>
                            <form onSubmit={handleAssign} className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700 ml-1">Select Teacher</label>
                                    <select
                                        value={selectedTeacher}
                                        onChange={(e) => setSelectedTeacher(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all bg-gray-50/50"
                                    >
                                        <option value="">Choose Teacher</option>
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.id}>{t.full_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700 ml-1">Select Class</label>
                                    <select
                                        value={selectedClass}
                                        onChange={(e) => setSelectedClass(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all bg-gray-50/50"
                                    >
                                        <option value="">Choose Class</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.class_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700 ml-1">Select Subject</label>
                                    <select
                                        value={selectedSubject}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all bg-gray-50/50"
                                    >
                                        <option value="">Choose Subject</option>
                                        {subjects.map(s => (
                                            <option key={s.id} value={s.id}>{s.subject_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-4 bg-gray-900 text-white rounded-xl hover:bg-black transition-all font-bold shadow-lg shadow-gray-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                    {saving ? 'Assigning...' : 'Assign Teacher'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Assignments List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <BookOpen className="w-6 h-6 text-blue-600" />
                                    Current Assignments
                                </h2>
                                <div className="flex items-center gap-4">
                                    <select
                                        value={filterClass}
                                        onChange={(e) => setFilterClass(e.target.value)}
                                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold focus:ring-4 focus:ring-blue-100 outline-none transition-all bg-white"
                                    >
                                        <option value="">All Classes</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.class_name}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={filterSubject}
                                        onChange={(e) => setFilterSubject(e.target.value)}
                                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold focus:ring-4 focus:ring-blue-100 outline-none transition-all bg-white"
                                    >
                                        <option value="">All Subjects</option>
                                        {subjects.map(s => (
                                            <option key={s.id} value={s.id}>{s.subject_name}</option>
                                        ))}
                                    </select>
                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
                                        {assignments.filter(a => (!filterClass || a.class_id === parseInt(filterClass)) && (!filterSubject || a.subject_id === parseInt(filterSubject))).length} Total
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Teacher</th>
                                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Class</th>
                                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Subject</th>
                                            <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest w-24">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {assignments.filter(a => (!filterClass || a.class_id === parseInt(filterClass)) && (!filterSubject || a.subject_id === parseInt(filterSubject))).length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="py-12 text-center text-gray-500 font-medium italic">
                                                    No assignments found for the filtering criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            assignments
                                                .filter(a => (!filterClass || a.class_id === parseInt(filterClass)) && (!filterSubject || a.subject_id === parseInt(filterSubject)))
                                                .map((asgn) => (
                                                    <tr key={asgn.id} className="hover:bg-blue-50/10 transition-colors group">
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                                                    {asgn.teacher_name ? asgn.teacher_name.charAt(0) : '?'}
                                                                </div>
                                                                <span className="font-bold text-gray-900">{asgn.teacher_name || 'Not Assigned'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg">
                                                                {asgn.class_name}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-lg">
                                                                {asgn.subject_name}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <button
                                                                onClick={() => handleRemove(asgn.id)}
                                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                                title="Remove Assignment"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Teachers Directory View */
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-blue-50 to-transparent">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-6 h-6 text-blue-600" />
                            Registered Teachers
                        </h2>
                        <div className="flex items-center gap-4">
                            <select
                                value={filterClass}
                                onChange={(e) => setFilterClass(e.target.value)}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold focus:ring-4 focus:ring-blue-100 outline-none transition-all bg-white"
                            >
                                <option value="">All Classes</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.class_name}</option>
                                ))}
                            </select>
                            <select
                                value={filterSubject}
                                onChange={(e) => setFilterSubject(e.target.value)}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold focus:ring-4 focus:ring-blue-100 outline-none transition-all bg-white"
                            >
                                <option value="">All Subjects</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.subject_name}</option>
                                ))}
                            </select>
                            {selectedTeachers.length > 0 && (
                                <button
                                    onClick={handleBulkDeleteTeachers}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition shadow-md"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Selected ({selectedTeachers.length})
                                </button>
                            )}
                            <span className="px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-bold rounded-full">
                                {
                                    teachers.filter(teacher => {
                                        if (!filterClass && !filterSubject) return true;
                                        const teacherAssignments = assignments.filter(a => a.teacher_id === teacher.id);
                                        return teacherAssignments.some(a => {
                                            const classMatch = !filterClass || a.class_id === parseInt(filterClass);
                                            const subjectMatch = !filterSubject || a.subject_id === parseInt(filterSubject);
                                            return classMatch && subjectMatch;
                                        });
                                    }).length
                                } Active Staff
                            </span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="py-4 px-6 text-left w-12">
                                        <input
                                            type="checkbox"
                                            checked={teachers.length > 0 && selectedTeachers.length === teachers.length}
                                            onChange={handleSelectAllTeachers}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Teacher Name</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Email Address</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Phone</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Classes & Subjects</th>
                                    <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {teachers.filter(teacher => {
                                    if (!filterClass && !filterSubject) return true;
                                    const teacherAssignments = assignments.filter(a => a.teacher_id === teacher.id);
                                    return teacherAssignments.some(a => {
                                        const classMatch = !filterClass || a.class_id === parseInt(filterClass);
                                        const subjectMatch = !filterSubject || a.subject_id === parseInt(filterSubject);
                                        return classMatch && subjectMatch;
                                    });
                                }).length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-gray-500 font-medium italic">
                                            No teachers found matching the selected filters.
                                        </td>
                                    </tr>
                                ) : (
                                    teachers.filter(teacher => {
                                        if (!filterClass && !filterSubject) return true;
                                        const teacherAssignments = assignments.filter(a => a.teacher_id === teacher.id);
                                        return teacherAssignments.some(a => {
                                            const classMatch = !filterClass || a.class_id === parseInt(filterClass);
                                            const subjectMatch = !filterSubject || a.subject_id === parseInt(filterSubject);
                                            return classMatch && subjectMatch;
                                        });
                                    }).map((teacher) => (
                                        <tr key={teacher.id} className={`hover:bg-blue-50/10 transition-colors group ${selectedTeachers.includes(teacher.id) ? 'bg-blue-50/20' : ''}`}>
                                            <td className="py-4 px-6 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTeachers.includes(teacher.id)}
                                                    onChange={() => handleSelectTeacher(teacher.id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                                                        {teacher.full_name ? teacher.full_name.charAt(0) : '?'}
                                                    </div>
                                                    <span className="font-bold text-gray-900">{teacher.full_name || 'Unnamed Teacher'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-gray-600 font-medium">
                                                {teacher.email}
                                            </td>
                                            <td className="py-4 px-6 text-gray-600 font-medium">
                                                {teacher.phone || 'N/A'}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${teacher.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {teacher.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-wrap gap-1">
                                                    {assignments
                                                        .filter(a => a.teacher_id === teacher.id)
                                                        .map((a, i) => (
                                                            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded border border-blue-100">
                                                                {a.class_name} - {a.subject_name}
                                                            </span>
                                                        ))}
                                                    {assignments.filter(a => a.teacher_id === teacher.id).length === 0 && (
                                                        <span className="text-xs text-gray-400 italic">No assignments</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(teacher)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        title="Edit Teacher"
                                                    >
                                                        <Plus className="w-5 h-5 rotate-45" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTeacher(teacher.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        title="Delete Teacher"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Teacher Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Users className="w-6 h-6" />
                                {isEditing ? 'Edit Teacher Profile' : 'Add New Teacher'}
                            </h2>
                        </div>
                        <form onSubmit={handleCreateTeacher} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Teacher ID / Username</label>
                                <input
                                    required
                                    type="text"
                                    value={newTeacher.username}
                                    onChange={(e) => setNewTeacher({ ...newTeacher, username: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                    placeholder="e.g. T001"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    value={newTeacher.full_name}
                                    onChange={(e) => setNewTeacher({ ...newTeacher, full_name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    value={newTeacher.email}
                                    onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                    placeholder="teacher@school.com"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Password {isEditing && '(Leave blank to keep current)'}</label>
                                <div className="relative">
                                    <input
                                        required={!isEditing}
                                        type={showPassword ? "text" : "password"}
                                        value={newTeacher.password}
                                        onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                        placeholder={isEditing ? '••••••••' : 'Min 6 characters'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Phone (Optional)</label>
                                <input
                                    type="text"
                                    value={newTeacher.phone}
                                    onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                    placeholder="+1 234 567 890"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 bg-gray-900 text-white rounded-xl hover:bg-black font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Teacher' : 'Create Teacher')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showBulkModal && (
                <BulkUploadModal
                    title="Bulk Upload Teachers"
                    onUpload={handleBulkUpload}
                    onCancel={() => setShowBulkModal(false)}
                    templateLink="http://localhost:3001/templates/teacher_template.csv"
                />
            )}
        </div>
    );
};

export default TeacherManagement;
