import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { feesAPI, masterAPI } from '../../services/api';
import { Search, DollarSign, Send, AlertCircle, LogIn, ArrowLeft } from 'lucide-react';

const FeeManagement = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    // Payment Modal State
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchFees();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass]);

    const fetchClasses = async () => {
        try {
            const response = await masterAPI.getClasses();
            setClasses(response.data.data || []);
            if (response.data.data?.length > 0) {
                setSelectedClass(response.data.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchFees = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await feesAPI.getClassStatus({ class: selectedClass });
            setStudents(response.data.data || []);
        } catch (error) {
            console.error('Error fetching fees:', error);
            // Handle authentication errors gracefully
            if (error.response?.status === 403) {
                setError('Access denied. Please log in as an administrator to view fee data.');
                setStudents([]);
            } else if (error.response?.status === 401) {
                setError('Your session has expired. Please log in again.');
                setStudents([]);
            } else {
                setError('Failed to load fee data. Please try again later.');
                setStudents([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePayment = async (e) => {
        e.preventDefault();

        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            alert('Please enter a valid payment amount');
            return;
        }

        setIsUpdating(true);

        try {
            if (selectedStudent.fee_id) {
                // Update existing fee record
                const newPaidAmount = parseFloat(selectedStudent.paid_amount || 0) + parseFloat(paymentAmount);

                console.log('Updating fee:', {
                    feeId: selectedStudent.fee_id,
                    currentPaid: selectedStudent.paid_amount,
                    paymentAmount: paymentAmount,
                    newPaidAmount: newPaidAmount
                });

                const response = await feesAPI.update(selectedStudent.fee_id, {
                    paidAmount: newPaidAmount
                });

                console.log('Payment update response:', response.data);
            } else {
                // Create new fee record
                const totalFeeInput = document.getElementById('totalFeeInput');
                const totalFee = totalFeeInput ? parseFloat(totalFeeInput.value) : 0;

                if (!totalFee || totalFee <= 0) {
                    alert('Please enter a valid total fee amount');
                    return;
                }

                console.log('Creating new fee:', {
                    studentId: selectedStudent.id,
                    totalFee: totalFee,
                    paidAmount: parseFloat(paymentAmount)
                });

                const response = await feesAPI.create({
                    studentId: selectedStudent.id,
                    totalFee: totalFee,
                    paidAmount: parseFloat(paymentAmount),
                    academicYear: new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString()
                });

                console.log('Fee creation response:', response.data);
            }

            alert('Payment updated successfully');

            // Close modal and reset state
            setIsModalOpen(false);
            setPaymentAmount('');
            setSelectedStudent(null);

            // Refresh the fee data
            console.log('Refreshing fee data...');
            await fetchFees();
            console.log('Fee data refreshed');
        } catch (error) {
            console.error('Error updating payment:', error);
            alert('Failed to update payment: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSendReminder = async (feeId) => {
        if (!confirm('Send fee reminder to parent?')) return;
        try {
            await feesAPI.sendReminder(feeId);
            alert('Reminder sent successfully');
        } catch (error) {
            console.error('Error sending reminder:', error);
            alert('Failed to send reminder');
        }
    };

    const filteredStudents = students.filter(student =>
        student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.roll_number && student.roll_number.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
                    <p className="text-gray-500">Track and manage student fees</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Student</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or roll no..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                    <div className="flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <h3 className="text-red-800 font-bold text-lg mb-2">Access Denied</h3>
                            <p className="text-red-700 mb-3">{error}</p>
                            <div className="bg-white rounded-lg p-4 border border-red-100">
                                <p className="text-sm font-semibold text-gray-700 mb-2">To access fee management:</p>
                                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                                    <li>Log out if you're currently logged in</li>
                                    <li>Log in with admin credentials:</li>
                                </ol>
                                <div className="mt-3 bg-gray-50 rounded p-3 border border-gray-200">
                                    <p className="text-xs font-mono text-gray-700">
                                        <span className="font-semibold">Email:</span> admin@school.com<br />
                                        <span className="font-semibold">Password:</span> admin123
                                    </p>
                                </div>
                                <Link
                                    to="/login"
                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                                >
                                    <LogIn className="w-4 h-4" />
                                    Go to Login Page
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Fee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No students found</td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{student.first_name} {student.last_name}</div>
                                            <div className="text-xs text-gray-500">{student.class_name} - {student.section_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.roll_number || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ₹{student.total_fee || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                            ₹{student.paid_amount || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                            ₹{student.pending_amount || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${student.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                                    student.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'}`}>
                                                {student.payment_status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setSelectedStudent(student);
                                                    setIsModalOpen(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                                title="Add Payment"
                                            >
                                                <DollarSign className="w-5 h-5" />
                                            </button>
                                            {student.pending_amount > 0 && (
                                                <button
                                                    onClick={() => handleSendReminder(student.fee_id)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title="Send Reminder"
                                                >
                                                    <Send className="w-5 h-5" />
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

            {/* Payment Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Record Fee Payment</h2>
                        <div className="mb-4">
                            <p className="text-gray-600">Student: <span className="font-semibold">{selectedStudent?.first_name} {selectedStudent?.last_name}</span></p>
                            <p className="text-gray-600">Pending Amount: <span className="font-semibold text-red-600">₹{selectedStudent?.pending_amount}</span></p>
                        </div>
                        <form onSubmit={handleUpdatePayment}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max={selectedStudent?.pending_amount}
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {!selectedStudent?.fee_id && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Fee Amount</label>
                                    <input
                                        id="totalFeeInput"
                                        type="number"
                                        required
                                        min={paymentAmount}
                                        placeholder="Enter total annual fee"
                                        className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            )}
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={isUpdating}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUpdating ? 'Processing...' : 'Record Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeeManagement;
