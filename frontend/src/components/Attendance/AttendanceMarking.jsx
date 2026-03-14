import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Save, RefreshCw, Check, X as CloseIcon, Upload } from 'lucide-react';
import { attendanceAPI, masterAPI } from '../../services/api';
import BulkUploadModal from '../common/BulkUploadModal';

const AttendanceMarking = () => {
    const navigate = useNavigate();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [classId, setClassId] = useState('');
    const [sectionId, setSectionId] = useState('');
    const [session, setSession] = useState('Morning');
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [showBulkModal, setShowBulkModal] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await masterAPI.getClasses();
            const sortedClasses = response.data.data.sort((a, b) => {
                // Extract numbers from class names for proper sorting
                const getClassNumber = (className) => {
                    const match = className.match(/(\d+)/);
                    return match ? parseInt(match[1]) : 999;
                };

                const aNum = getClassNumber(a.class_name);
                const bNum = getClassNumber(b.class_name);

                if (aNum !== bNum) {
                    return aNum - bNum;
                }

                // If numbers are the same, sort alphabetically
                return a.class_name.localeCompare(b.class_name);
            });
            setClasses(sortedClasses);
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        }
    };

    const fetchSections = async (clsId) => {
        try {
            const response = await masterAPI.getSections(clsId);
            const sortedSections = response.data.data.sort((a, b) => {
                // Sort sections alphabetically (A, B, C, etc.)
                return a.section_name.localeCompare(b.section_name);
            });
            setSections(sortedSections);
        } catch (error) {
            console.error('Failed to fetch sections:', error);
            setSections([]);
        }
    };

    useEffect(() => {
        if (classId) {
            fetchSections(classId);
        } else {
            setSections([]);
            setSectionId('');
        }
        // Reset section when class changes
        setSectionId('');
    }, [classId]);

    const fetchStudents = React.useCallback(async () => {
        try {
            setLoading(true);
            const response = await attendanceAPI.getByClass(classId, sectionId, { date, session });
            const records = response.data.data.attendance
                .filter(r => !r.session || r.session === session)
                .map(record => ({
                    student_id: record.id,
                    roll_number: record.roll_number,
                    student_name: record.student_name,
                    status: record.status || 'Present'
                }));
            setStudents(records);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoading(false);
        }
    }, [classId, sectionId, date, session]);

    useEffect(() => {
        if (classId && sectionId && date && session) {
            fetchStudents();
        }
    }, [classId, sectionId, date, session, fetchStudents]);

    const handleBulkUpload = async (file) => {
        const response = await attendanceAPI.bulkUpload(file);
        // Refresh if the uploaded data matches current view
        if (classId && sectionId) {
            fetchStudents();
        }
        return response;
    };

    const handleStatusChange = React.useCallback((studentId, status) => {
        setStudents(prev => prev.map(s =>
            s.student_id === studentId ? { ...s, status } : s
        ));
    }, []);

    const handleMarkAll = React.useCallback((status) => {
        setStudents(prev => prev.map(s => ({ ...s, status })));
    }, []);

    const handleSave = React.useCallback(async () => {
        if (students.length === 0) return;

        try {
            setSaving(true);
            const attendance_records = students.map(s => ({
                student_id: s.student_id,
                status: s.status
            }));

            await attendanceAPI.markBulk({
                class_id: parseInt(classId),
                section_id: parseInt(sectionId),
                attendance_date: date,
                session,
                attendance_records
            });

            setMessage({ type: 'success', text: 'Attendance saved successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Failed to save attendance:', error);
            setMessage({ type: 'error', text: 'Failed to save attendance. Please try again.' });
        } finally {
            setSaving(false);
        }
    }, [students, classId, sectionId, date, session]);

    // Memoized Row Component
    const StudentAttendanceRow = React.memo(({ student, onStatusChange }) => {
        return (
            <tr className="hover:bg-blue-50/30 transition-colors">
                <td className="py-4 px-6 font-bold text-gray-900">{student.student_name}</td>
                <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onStatusChange(student.student_id, 'Present')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-bold transition-all ${student.status === 'Present'
                                ? 'bg-green-100 text-green-700 ring-2 ring-green-500'
                                : 'bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-600'
                                }`}
                        >
                            <Check className="w-4 h-4" />
                            Present
                        </button>
                        <button
                            onClick={() => onStatusChange(student.student_id, 'Absent')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-bold transition-all ${student.status === 'Absent'
                                ? 'bg-red-100 text-red-700 ring-2 ring-red-500'
                                : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600'
                                }`}
                        >
                            <CloseIcon className="w-4 h-4" />
                            Absent
                        </button>
                    </div>
                </td>
            </tr>
        );
    });

    // Memoized Card Component for Mobile
    const StudentAttendanceCard = React.memo(({ student, onStatusChange }) => {
        return (
            <div key={student.student_id} className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${student.status === 'Absent' ? 'border-red-100 bg-red-50/10' : 'border-gray-100'}`}>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                        {student.student_name.charAt(0)}
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">{student.student_name}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => onStatusChange(student.student_id, 'Present')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${student.status === 'Present'
                            ? 'bg-green-600 text-white shadow-lg shadow-green-100 scale-[1.02]'
                            : 'bg-gray-50 text-gray-400'
                            }`}
                    >
                        <Check className="w-4 h-4" />
                        Present
                    </button>
                    <button
                        onClick={() => onStatusChange(student.student_id, 'Absent')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${student.status === 'Absent'
                            ? 'bg-red-600 text-white shadow-lg shadow-red-100 scale-[1.02]'
                            : 'bg-gray-50 text-gray-400'
                            }`}
                    >
                        <CloseIcon className="w-4 h-4" />
                        Absent
                    </button>
                </div>
            </div>
        );
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition mb-6 group"
                    >
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 group-hover:border-blue-200 group-hover:bg-blue-50 transition">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Back to Dashboard</span>
                    </button>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
                        </div>
                        <button
                            onClick={() => setShowBulkModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                            <Upload className="w-4 h-4" />
                            Bulk Upload
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    {message && (
                        <div className={`mb-4 p-4 rounded-lg flex items-center justify-between ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            <span className="font-medium">{message.text}</span>
                            <button onClick={() => setMessage(null)}><CloseIcon size={18} /></button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 ml-1">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                Selection Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Session</label>
                            <select
                                value={session}
                                onChange={(e) => setSession(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm bg-white"
                            >
                                <option value="Morning">Morning</option>
                                <option value="Afternoon">Afternoon</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Class</label>
                            <select
                                value={classId}
                                onChange={(e) => setClassId(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm bg-white"
                            >
                                <option value="">Select a Class</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.class_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Section</label>
                            <select
                                value={sectionId}
                                onChange={(e) => setSectionId(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm bg-white"
                            >
                                <option value="">Select a Section</option>
                                {sections.map(s => (
                                    <option key={s.id} value={s.id}>{s.section_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="border-t pt-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Student Roll Call</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Mark attendance for each student below</p>
                            </div>
                            <div className="flex w-full sm:w-auto gap-2">
                                <button
                                    onClick={() => handleMarkAll('Present')}
                                    disabled={loading || students.length === 0}
                                    className="flex-1 sm:flex-none px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 transition-all font-bold text-xs uppercase tracking-wider disabled:opacity-50"
                                >
                                    Mark All Present
                                </button>
                                <button
                                    onClick={() => handleMarkAll('Absent')}
                                    disabled={loading || students.length === 0}
                                    className="flex-1 sm:flex-none px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition-all font-bold text-xs uppercase tracking-wider disabled:opacity-50"
                                >
                                    Mark All Absent
                                </button>
                            </div>
                        </div>

                        {!classId || !sectionId ? (
                            <p className="text-gray-600 text-center py-8">
                                Please select class and section to view students
                            </p>
                        ) : loading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                                <p className="text-gray-600">Loading students...</p>
                            </div>
                        ) : students.length === 0 ? (
                            <p className="text-gray-600 text-center py-8 font-medium">
                                No students found in this class/section.
                            </p>
                        ) : (
                            <div>
                                {/* Desktop Table */}
                                <div className="hidden sm:block overflow-hidden rounded-2xl border border-gray-100">
                                    <table className="w-full">
                                        <thead className="bg-gray-50/50">
                                            <tr>
                                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Student</th>
                                                <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Attendance Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {students.map((student) => (
                                                <StudentAttendanceRow
                                                    key={student.student_id}
                                                    student={student}
                                                    onStatusChange={handleStatusChange}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="sm:hidden space-y-4">
                                    {students.map((student) => (
                                        <StudentAttendanceCard
                                            key={student.student_id}
                                            student={student}
                                            onStatusChange={handleStatusChange}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-10 flex justify-center sm:justify-end">
                        <button
                            onClick={handleSave}
                            disabled={loading || saving || students.length === 0}
                            className={`w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-4 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all font-bold shadow-xl shadow-gray-200 active:scale-95 disabled:opacity-50 ${saving ? 'cursor-not-allowed' : ''}`}
                        >
                            {saving ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Saving Attendance...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Finalize Attendance
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </main>

            {showBulkModal && (
                <BulkUploadModal
                    title="Bulk Upload Attendance"
                    onUpload={handleBulkUpload}
                    onCancel={() => setShowBulkModal(false)}
                    templateLink="http://localhost:3001/templates/attendance_bulk_template.csv"
                />
            )}
        </div>
    );
};

export default AttendanceMarking;
