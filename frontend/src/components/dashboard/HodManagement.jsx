import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminHodAPI } from '../../services/api';
import { sharedRecordSchema } from '../../utils/recordSchema';
import { Users, Building2, Plus, Trash2, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Eye, EyeOff, MapPin, Calendar } from 'lucide-react';

const HodManagement = () => {
    const navigate = useNavigate();
    const [hods, setHods] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Form state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    
    const [newHod, setNewHod] = useState({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phone: '',
        departmentId: '',
        gender: 'Male',
        dateOfBirth: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        joiningDate: new Date().toISOString().slice(0, 10)
    });

    const [newDeptName, setNewDeptName] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [hodsRes, deptsRes] = await Promise.all([
                adminHodAPI.getAll(),
                adminHodAPI.getDepartments()
            ]);
            setHods(hodsRes.data.data || []);
            setDepartments(deptsRes.data.data || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateHod = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);

            if (isEditing) {
                await adminHodAPI.update(editingId, newHod);
                setSuccess('HOD updated successfully!');
            } else {
                await adminHodAPI.create(newHod);
                setSuccess('HOD created successfully!');
            }

            setShowCreateModal(false);
            setIsEditing(false);
            setEditingId(null);
            setNewHod({ 
                username: '', email: '', password: '', fullName: '', phone: '', departmentId: '',
                gender: 'Male', dateOfBirth: '', address: '', city: '', state: '', 
                pincode: '', joiningDate: new Date().toISOString().slice(0, 10)
            });
            fetchData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('HOD operation error:', err);
            setError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} HOD.`);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (hod) => {
        setNewHod({
            username: hod.username || '',
            email: hod.email || '',
            password: '', 
            fullName: hod.fullName || '',
            phone: hod.phone || '',
            departmentId: hod.departmentId || '',
            gender: hod.gender || 'Male',
            dateOfBirth: hod.dateOfBirth ? new Date(hod.dateOfBirth).toISOString().slice(0, 10) : '',
            address: hod.address || '',
            city: hod.city || '',
            state: hod.state || '',
            pincode: hod.pincode || '',
            joiningDate: hod.joiningDate ? new Date(hod.joiningDate).toISOString().slice(0, 10) : ''
        });
        setEditingId(hod.id);
        setIsEditing(true);
        setShowCreateModal(true);
    };
    
    const handleDeleteHod = async (id) => {
        if (!window.confirm('Are you sure you want to delete this HOD? They will be deactivated.')) return;

        try {
            setSaving(true);
            await adminHodAPI.delete(id);
            setSuccess('HOD deactivated successfully');
            fetchData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Delete HOD error:', err);
            setError(err.response?.data?.message || 'Failed to delete HOD.');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateDept = async (e) => {
        e.preventDefault();
        if (!newDeptName.trim()) return;

        try {
            setSaving(true);
            setError(null);
            await adminHodAPI.createDepartment({ departmentName: newDeptName });
            setSuccess('Department created successfully!');
            setNewDeptName('');
            setShowDeptModal(false);
            fetchData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Create department error:', err);
            setError(err.response?.data?.message || 'Failed to create department.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600 font-medium">Loading HOD data...</p>
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
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">HOD Management</h1>
                    <p className="mt-2 text-lg text-gray-600">Manage Heads of Departments.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowDeptModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                        <Building2 className="w-5 h-5" />
                        Add Department
                    </button>
                    <button
                        onClick={() => {
                            setIsEditing(false);
                            setNewHod({ 
                                username: '', email: '', password: '', fullName: '', phone: '', departmentId: '',
                                gender: 'Male', dateOfBirth: '', address: '', city: '', state: '', 
                                pincode: '', joiningDate: new Date().toISOString().slice(0, 16)
                            });
                            setShowCreateModal(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                        <Users className="w-5 h-5" />
                        Add HOD
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

            <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden animate-fade-in">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-blue-50 to-transparent">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-600" />
                        Registered HODs
                    </h2>
                    <span className="px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-bold rounded-full">
                        {hods.length} Active HODs
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">HOD Name</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Email Address</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Phone</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Department</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {hods.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-gray-500 font-medium italic">
                                        No HODs registered in the system.
                                    </td>
                                </tr>
                            ) : (
                                hods.map((hod) => (
                                    <tr key={hod.id} className="hover:bg-blue-50/10 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                                                    {hod.fullName ? hod.fullName.charAt(0) : '?'}
                                                </div>
                                                <span className="font-bold text-gray-900">{hod.fullName || 'Unnamed HOD'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-600 font-medium">
                                            {hod.email}
                                        </td>
                                        <td className="py-4 px-6 text-gray-600 font-medium">
                                            {hod.phone || 'N/A'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-lg">
                                                {hod.departmentName || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${hod.isActive
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {hod.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(hod)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    title="Edit HOD"
                                                >
                                                    <Plus className="w-5 h-5 rotate-45" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteHod(hod.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    title="Deactivate HOD"
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

            {/* Create HOD Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto">
                        <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Users className="w-6 h-6" />
                                {isEditing ? 'Edit HOD Profile' : 'Add New HOD'}
                            </h2>
                        </div>
                        <form onSubmit={handleCreateHod} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Username</label>
                                <input
                                    required
                                    type="text"
                                    value={newHod.username}
                                    onChange={(e) => setNewHod({ ...newHod, username: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                    placeholder="e.g. hod_cs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    value={newHod.fullName}
                                    onChange={(e) => setNewHod({ ...newHod, fullName: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                    placeholder="e.g. Dr. Jane Smith"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    value={newHod.email}
                                    onChange={(e) => setNewHod({ ...newHod, email: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                    placeholder="jane.smith@school.edu"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Password {isEditing && '(Leave blank to keep current)'}</label>
                                <div className="relative">
                                    <input
                                        required={!isEditing}
                                        type={showPassword ? "text" : "password"}
                                        value={newHod.password}
                                        onChange={(e) => setNewHod({ ...newHod, password: e.target.value })}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Gender</label>
                                    <select
                                        value={newHod.gender}
                                        onChange={(e) => setNewHod({ ...newHod, gender: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all bg-white"
                                    >
                                        {sharedRecordSchema['Gender'].options.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Phone</label>
                                    <input
                                        type="text"
                                        value={newHod.phone}
                                        onChange={(e) => setNewHod({ ...newHod, phone: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={newHod.dateOfBirth}
                                        onChange={(e) => setNewHod({ ...newHod, dateOfBirth: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Joining Date</label>
                                    <input
                                        type="date"
                                        value={newHod.joiningDate}
                                        onChange={(e) => setNewHod({ ...newHod, joiningDate: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Address</label>
                                <textarea
                                    value={newHod.address}
                                    onChange={(e) => setNewHod({ ...newHod, address: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none"
                                    placeholder="Street Address"
                                    rows="2"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">City</label>
                                    <select
                                        value={newHod.city}
                                        onChange={(e) => setNewHod({ ...newHod, city: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all bg-white"
                                    >
                                        <option value="">Select City</option>
                                        {sharedRecordSchema['City'].options.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">State</label>
                                    <select
                                        value={newHod.state}
                                        onChange={(e) => setNewHod({ ...newHod, state: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all bg-white"
                                    >
                                        <option value="">Select State</option>
                                        {sharedRecordSchema['State'].options.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Pincode</label>
                                    <input
                                        type="text"
                                        value={newHod.pincode}
                                        onChange={(e) => setNewHod({ ...newHod, pincode: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="Pincode"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Department</label>
                                <select
                                    value={newHod.departmentId}
                                    onChange={(e) => setNewHod({ ...newHod, departmentId: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all bg-white"
                                >
                                    <option value="">Select Department (Optional)</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.departmentName}</option>
                                    ))}
                                </select>
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
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update HOD' : 'Create HOD')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Department Modal */}
            {showDeptModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
                        <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Building2 className="w-6 h-6" />
                                Add Department
                            </h2>
                        </div>
                        <form onSubmit={handleCreateDept} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Department Name</label>
                                <input
                                    required
                                    type="text"
                                    value={newDeptName}
                                    onChange={(e) => setNewDeptName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                                    placeholder="e.g. Computer Science"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowDeptModal(false)}
                                    className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HodManagement;
