import React, { useState, useEffect } from 'react';
import { DollarSign, Edit2, Save, X, Plus, ArrowLeft, Trash2, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ClassFeeStructure = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [feeStructures, setFeeStructures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(null);
    const [editValues, setEditValues] = useState({});
    const [message, setMessage] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newFee, setNewFee] = useState({ fee_type: '', amount: '', description: '' });
    const [circulating, setCirculating] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchFeeStructures();
        }
    }, [selectedClass]);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/master/classes');
            setClasses(response.data.data);
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        }
    };

    const fetchFeeStructures = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/class-fee-structure/class/${selectedClass}`);
            setFeeStructures(response.data.data.feeStructures);
        } catch (error) {
            console.error('Failed to fetch fee structures:', error);
            setMessage({ type: 'error', text: 'Failed to load fee structures' });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (fee) => {
        setEditing(fee.id);
        setEditValues({
            amount: fee.amount,
            description: fee.description
        });
    };

    const handleSave = async (feeId) => {
        try {
            await api.put(`/class-fee-structure/${feeId}`, editValues);
            setMessage({ type: 'success', text: 'Fee structure updated successfully' });
            setEditing(null);
            fetchFeeStructures();
        } catch (error) {
            console.error('Failed to update fee structure:', error);
            setMessage({ type: 'error', text: 'Failed to update fee structure' });
        }
    };

    const handleCancel = () => {
        setEditing(null);
        setEditValues({});
    };

    const handleAddFee = async () => {
        try {
            if (!newFee.fee_type || !newFee.amount) {
                setMessage({ type: 'error', text: 'Please fill in all required fields' });
                return;
            }

            await api.post('/class-fee-structure', {
                class_id: selectedClass,
                fee_type: newFee.fee_type,
                amount: parseFloat(newFee.amount),
                description: newFee.description
            });

            setMessage({ type: 'success', text: 'Fee structure added successfully' });
            setShowAddForm(false);
            setNewFee({ fee_type: '', amount: '', description: '' });
            fetchFeeStructures();
        } catch (error) {
            console.error('Failed to add fee structure:', error);
            setMessage({ type: 'error', text: 'Failed to add fee structure' });
        }
    };

    const getTotalFee = () => {
        return feeStructures.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
    };

    const handleDelete = async (feeId) => {
        if (!window.confirm('Are you sure you want to delete this fee type?')) {
            return;
        }

        try {
            await api.delete(`/class-fee-structure/${feeId}`);
            setMessage({ type: 'success', text: 'Fee structure deleted successfully' });
            fetchFeeStructures();
        } catch (error) {
            console.error('Failed to delete fee structure:', error);
            setMessage({ type: 'error', text: 'Failed to delete fee structure' });
        }
    };

    const handleCirculate = async () => {
        if (!selectedClass) {
            setMessage({ type: 'error', text: 'Please select a class first' });
            return;
        }

        if (!window.confirm('This will apply the current fee structure to all classes. Continue?')) {
            return;
        }

        try {
            setCirculating(true);

            // Get current class fee structure
            const currentFees = feeStructures;

            // Apply to all classes
            for (const cls of classes) {
                if (cls.id !== parseInt(selectedClass)) {
                    for (const fee of currentFees) {
                        await api.post('/class-fee-structure', {
                            class_id: cls.id,
                            fee_type: fee.fee_type,
                            amount: fee.amount,
                            description: fee.description
                        });
                    }
                }
            }

            setMessage({ type: 'success', text: 'Fee structure circulated to all classes successfully' });
        } catch (error) {
            console.error('Failed to circulate fee structure:', error);
            setMessage({ type: 'error', text: 'Failed to circulate fee structure' });
        } finally {
            setCirculating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <DollarSign className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Class Fee Structure</h1>
                                <p className="text-sm text-gray-500">Manage class-wise fee configurations</p>
                            </div>
                        </div>
                    </div>

                    {message && (
                        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Select Class</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full md:w-64 px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none"
                        >
                            <option value="">Choose a class</option>
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.class_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedClass && (
                        <>
                            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                                <h2 className="text-lg font-bold text-gray-900">Fee Types</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCirculate}
                                        disabled={circulating || feeStructures.length === 0}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                        <Send className="w-4 h-4" />
                                        {circulating ? 'Circulating...' : 'Circulate to All Classes'}
                                    </button>
                                    <button
                                        onClick={() => setShowAddForm(!showAddForm)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Fee Type
                                    </button>
                                </div>
                            </div>

                            {showAddForm && (
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <h3 className="font-bold text-gray-900 mb-4">Add New Fee Type</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type *</label>
                                            <input
                                                type="text"
                                                value={newFee.fee_type}
                                                onChange={(e) => setNewFee({ ...newFee, fee_type: e.target.value })}
                                                placeholder="e.g., Exam Fee"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                                            <input
                                                type="number"
                                                value={newFee.amount}
                                                onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
                                                placeholder="1000"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <input
                                                type="text"
                                                value={newFee.description}
                                                onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
                                                placeholder="Optional description"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleAddFee}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowAddForm(false);
                                                setNewFee({ fee_type: '', amount: '', description: '' });
                                            }}
                                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="text-left py-3 px-4 font-bold text-gray-700 text-sm">Fee Type</th>
                                                    <th className="text-left py-3 px-4 font-bold text-gray-700 text-sm">Amount (₹)</th>
                                                    <th className="text-left py-3 px-4 font-bold text-gray-700 text-sm">Description</th>
                                                    <th className="text-right py-3 px-4 font-bold text-gray-700 text-sm">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {feeStructures.map((fee) => (
                                                    <tr key={fee.id} className="hover:bg-gray-50">
                                                        <td className="py-4 px-4 font-medium text-gray-900">{fee.fee_type}</td>
                                                        <td className="py-4 px-4">
                                                            {editing === fee.id ? (
                                                                <input
                                                                    type="number"
                                                                    value={editValues.amount}
                                                                    onChange={(e) => setEditValues({ ...editValues, amount: e.target.value })}
                                                                    className="w-32 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                />
                                                            ) : (
                                                                <span className="text-gray-900">₹{parseFloat(fee.amount).toFixed(2)}</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            {editing === fee.id ? (
                                                                <input
                                                                    type="text"
                                                                    value={editValues.description}
                                                                    onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                                                                    className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                />
                                                            ) : (
                                                                <span className="text-gray-600">{fee.description || '-'}</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4 text-right">
                                                            {editing === fee.id ? (
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        onClick={() => handleSave(fee.id)}
                                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                                        title="Save"
                                                                    >
                                                                        <Save className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={handleCancel}
                                                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                                                        title="Cancel"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        onClick={() => handleEdit(fee)}
                                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(fee.id)}
                                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50">
                                                <tr>
                                                    <td className="py-4 px-4 font-bold text-gray-900">Total</td>
                                                    <td className="py-4 px-4 font-bold text-gray-900">₹{getTotalFee().toFixed(2)}</td>
                                                    <td colSpan="2"></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClassFeeStructure;
