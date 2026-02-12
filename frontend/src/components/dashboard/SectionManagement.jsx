import React, { useState, useEffect } from 'react';
import { teachersAPI } from '../../services/api';
import { Users, BookOpen, Plus, Trash2, CheckCircle2, AlertCircle, Loader2, UserCheck } from 'lucide-react';

const SectionManagement = () => {
    const [sections, setSections] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Form state
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [sectionsRes, teachersRes] = await Promise.all([
                teachersAPI.getClassTeachers(),
                teachersAPI.getAll()
            ]);
            setSections(sectionsRes.data.data || []);
            setTeachers(teachersRes.data.data || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignClassTeacher = async (e) => {
        e.preventDefault();
        if (!selectedSection || !selectedTeacher) {
            setError('Please select both section and teacher');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            await teachersAPI.assignClassTeacher({
                section_id: selectedSection,
                teacher_id: selectedTeacher
            });
            setSuccess('Class teacher assigned successfully!');
            fetchData();
            // Reset selection
            setSelectedSection('');
            setSelectedTeacher('');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Assignment error:', err);
            setError(err.response?.data?.message || 'Failed to assign class teacher.');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveClassTeacher = async (sectionId) => {
        if (!window.confirm('Are you sure you want to remove this class teacher assignment?')) return;

        try {
            await teachersAPI.removeClassTeacher(sectionId);
            setSuccess('Class teacher removed successfully');
            fetchData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Remove error:', err);
            setError('Failed to remove class teacher.');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600 font-medium">Loading section data...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Section Management</h1>
                    <p className="mt-2 text-lg text-gray-600">Manage class teachers and section assignments.</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Assignment Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
                        <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <UserCheck className="w-6 h-6" />
                                Assign Class Teacher
                            </h2>
                        </div>
                        <form onSubmit={handleAssignClassTeacher} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 ml-1">Select Section</label>
                                <select
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all bg-gray-50/50"
                                >
                                    <option value="">Choose Section</option>
                                    {sections.map(section => (
                                        <option key={section.section_id} value={section.section_id}>
                                            {section.class_name} - {section.section_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 ml-1">Select Teacher</label>
                                <select
                                    value={selectedTeacher}
                                    onChange={(e) => setSelectedTeacher(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all bg-gray-50/50"
                                >
                                    <option value="">Choose Teacher</option>
                                    {teachers.map(teacher => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.full_name} ({teacher.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-4 bg-gray-900 text-white rounded-xl hover:bg-black transition-all font-bold shadow-lg shadow-gray-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserCheck className="w-5 h-5" />}
                                {saving ? 'Assigning...' : 'Assign Class Teacher'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Sections List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <BookOpen className="w-6 h-6 text-blue-600" />
                                Section Class Teachers
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {sections.filter(s => s.class_teacher_id).length} sections with assigned teachers
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Class & Section</th>
                                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Class Teacher</th>
                                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                        <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sections.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="py-12 text-center text-gray-500 font-medium italic">
                                                No sections found.
                                            </td>
                                        </tr>
                                    ) : (
                                        sections.map((section) => (
                                            <tr key={`${section.class_name}-${section.section_name}`} className="hover:bg-blue-50/10 transition-colors group">
                                                <td className="py-4 px-6">
                                                    <div>
                                                        <span className="font-bold text-gray-900">{section.class_name}</span>
                                                        <span className="mx-2 text-gray-300">•</span>
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg">
                                                            {section.section_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {section.class_teacher_id ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                                                {section.teacher_name?.charAt(0) || '?'}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900">{section.teacher_name}</div>
                                                                <div className="text-xs text-gray-500">{section.teacher_email}</div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic">No teacher assigned</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${section.class_teacher_id
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {section.class_teacher_id ? 'Assigned' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    {section.class_teacher_id && (
                                                        <button
                                                            onClick={() => handleRemoveClassTeacher(section.section_id)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Remove Class Teacher"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    )}
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
        </div>
    );
};

export default SectionManagement;