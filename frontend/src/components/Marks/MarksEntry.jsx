import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, RefreshCw, Check, AlertCircle, X as CloseIcon } from 'lucide-react';
import { marksAPI, gradesAPI, masterAPI } from '../../services/api';
import BulkUploadModal from '../common/BulkUploadModal';

// Memoized Row Component
const StudentMarkRow = React.memo(({ student, onMarkChange }) => {
    return (
        <tr className="hover:bg-blue-50/30 transition-colors">
            <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700 font-bold">
                        {student.student_name.charAt(0)}
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">{student.student_name}</p>
                        <p className="text-xs text-gray-500">{student.registration_number}</p>
                    </div>
                </div>
            </td>
            <td className="py-4 px-6">
                <div className="relative">
                    <input
                        type="number"
                        value={student.marks_obtained}
                        onChange={(e) => onMarkChange(student.student_id, 'marks_obtained', e.target.value)}
                        disabled={student.is_absent}
                        className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm font-bold disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">/ {student.max_marks}</span>
                </div>
            </td>
            <td className="py-4 px-6 text-center">
                <input
                    type="checkbox"
                    checked={student.is_absent}
                    onChange={(e) => onMarkChange(student.student_id, 'is_absent', e.target.checked)}
                    className="w-6 h-6 rounded-lg border-gray-200 text-red-600 focus:ring-red-100 transition-all cursor-pointer"
                />
            </td>
            <td className="py-4 px-6">
                <input
                    type="text"
                    value={student.remarks}
                    onChange={(e) => onMarkChange(student.student_id, 'remarks', e.target.value)}
                    placeholder="Note..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm"
                />
            </td>
        </tr>
    );
});

// Memoized Card Component for Mobile
const StudentMarkCard = React.memo(({ student, onMarkChange }) => {
    return (
        <div className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${student.is_absent ? 'border-red-100 bg-red-50/10' : 'border-gray-100'}`}>
            <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-lg">
                    {student.student_name.charAt(0)}
                </div>
                <div className="flex-1">
                    <p className="font-bold text-gray-900">{student.student_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400">{student.registration_number}</span>
                    </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Absent</span>
                    <input
                        type="checkbox"
                        checked={student.is_absent}
                        onChange={(e) => onMarkChange(student.student_id, 'is_absent', e.target.checked)}
                        className="w-6 h-6 rounded-lg border-gray-200 text-red-600 focus:ring-red-100"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Marks Obtained</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={student.marks_obtained}
                            onChange={(e) => onMarkChange(student.student_id, 'marks_obtained', e.target.value)}
                            disabled={student.is_absent}
                            className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-bold disabled:bg-gray-50"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">/ {student.max_marks}</span>
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Remarks</label>
                    <input
                        type="text"
                        value={student.remarks}
                        onChange={(e) => onMarkChange(student.student_id, 'remarks', e.target.value)}
                        placeholder="Add a remark..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm"
                    />
                </div>
            </div>
        </div>
    );
});

const MarksEntry = () => {
    const [classId, setClassId] = useState('');
    const [sectionId, setSectionId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [examId, setExamId] = useState('');
    const [academicYear, setAcademicYear] = useState('2025-2026');
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [exams, setExams] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [message, setMessage] = useState(null);
    const [classSubjectId, setClassSubjectId] = useState(null);

    useEffect(() => {
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        try {
            const [classesRes, examsRes] = await Promise.all([
                masterAPI.getClasses(),
                masterAPI.getExamTypes()
            ]);
            setClasses(classesRes.data.data);
            setExams(examsRes.data.data);
        } catch (error) {
            console.error('Failed to fetch master data:', error);
        }
    };

    useEffect(() => {
        if (classId) {
            fetchSubjects(classId);
            fetchSections(classId);
        } else {
            setSubjects([]);
            setSections([]);
        }
        setSubjectId('');
        setSectionId('');
    }, [classId]);

    const fetchSections = async (cid) => {
        try {
            const response = await masterAPI.getSections(cid);
            setSections(response.data.data);
        } catch (error) {
            console.error('Failed to fetch sections:', error);
            setSections([]);
        }
    };

    const fetchSubjects = async (cid) => {
        try {
            const response = await masterAPI.getSubjects(cid);
            setSubjects(response.data.data);
        } catch (error) {
            console.error('Failed to fetch subjects:', error);
            setSubjects([]);
        }
    };

    useEffect(() => {
        if (classId && subjectId && examId) {
            fetchMarks();
        }
    }, [classId, sectionId, subjectId, examId, academicYear]);

    const fetchMarks = async () => {
        try {
            setLoading(true);
            const response = await marksAPI.getByClass(classId, subjectId, examId, {
                academic_year: academicYear,
                section_id: sectionId || undefined
            });
            setClassSubjectId(response.data.data.class_subject_id);
            const records = response.data.data.marks.map(record => ({
                student_id: record.student_id,
                registration_number: record.registration_number,
                student_name: record.student_name,
                roll_number: record.roll_number,
                marks_obtained: record.marks_obtained !== null && record.marks_obtained !== undefined ? record.marks_obtained : '',
                max_marks: record.max_marks || 100,
                is_absent: record.is_absent || false,
                remarks: record.remarks || ''
            }));
            setStudents(records);
        } catch (error) {
            console.error('Failed to fetch marks:', error);
            setMessage({ type: 'error', text: 'Failed to load students. Please ensure subject is assigned to class.' });
        } finally {
            setLoading(false);
        }
    };

    const handleMarkChange = React.useCallback((studentId, field, value) => {
        setStudents(prev => prev.map(s =>
            s.student_id === studentId ? { ...s, [field]: value } : s
        ));
    }, []);

    const handleSave = React.useCallback(async () => {
        if (students.length === 0) return;
        if (!classSubjectId) {
            setMessage({ type: 'error', text: 'Error: Class-Subject mapping not found. Please try reloading.' });
            return;
        }

        try {
            setSaving(true);
            const results = await Promise.all(students.map(async (s) => {
                try {
                    await marksAPI.enter({
                        student_id: s.student_id,
                        class_subject_id: classSubjectId,
                        exam_type_id: parseInt(examId),
                        academic_year: academicYear,
                        marks_obtained: s.marks_obtained === '' ? 0 : parseFloat(s.marks_obtained),
                        max_marks: parseFloat(s.max_marks),
                        is_absent: s.is_absent,
                        remarks: s.remarks || ''
                    });
                    return { success: true };
                } catch (err) {
                    const backendError = err.response?.data;
                    let errorMessage = backendError?.message || err.message;
                    if (backendError?.errors && backendError.errors.length > 0) {
                        errorMessage = `${backendError.message}: ${backendError.errors[0].field} - ${backendError.errors[0].message}`;
                    }
                    return {
                        success: false,
                        error: errorMessage,
                        student: s.student_name
                    };
                }
            }));

            const failures = results.filter(r => !r.success);
            if (failures.length > 0) {
                const errorMsg = `Failed for ${failures.length} students. Error: ${failures[0].error}`;
                setMessage({ type: 'error', text: errorMsg });
            } else {
                setMessage({ type: 'success', text: 'Marks saved successfully!' });
                fetchMarks();
            }
        } catch (error) {
            console.error('Failed to save marks:', error);
            setMessage({ type: 'error', text: 'Failed to save marks. Check console for details.' });
        } finally {
            setSaving(false);
        }
    }, [students, classId, subjectId, examId, academicYear, classSubjectId]);

    const handleCalculateGrades = React.useCallback(async () => {
        try {
            setCalculating(true);
            await gradesAPI.calculate(academicYear);
            setMessage({ type: 'success', text: 'Grades calculated successfully for all students!' });
        } catch (error) {
            console.error('Failed to calculate grades:', error);
            setMessage({ type: 'error', text: 'Failed to calculate grades.' });
        } finally {
            setCalculating(false);
        }
    }, [academicYear]);

    const handleBulkUpload = React.useCallback(async (file) => {
        const response = await marksAPI.bulkUpload(file, classSubjectId, examId, academicYear);
        fetchMarks();
        return response;
    }, [classSubjectId, examId, academicYear]);



    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/" className="text-gray-600 hover:text-gray-900">
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-900">Enter Marks</h1>
                        </div>
                        <button
                            onClick={() => {
                                if (!classSubjectId || !examId) {
                                    setMessage({ 
                                        type: 'error', 
                                        text: 'Please select Class, Subject, and Exam Type before uploading marks.' 
                                    });
                                    return;
                                }
                                setShowBulkModal(true);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition ${
                                !classSubjectId || !examId 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-green-600 hover:bg-green-700'
                            }`}
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
                        <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            <span className="font-medium">{message.text}</span>
                            <button onClick={() => setMessage(null)}><CloseIcon size={18} /></button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Class</label>
                            <select
                                value={classId}
                                onChange={(e) => setClassId(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm bg-white"
                            >
                                <option value="">Select Class</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.class_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Section (Optional)</label>
                            <select
                                value={sectionId}
                                onChange={(e) => setSectionId(e.target.value)}
                                disabled={!classId}
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm bg-white disabled:bg-gray-50"
                            >
                                <option value="">All Sections</option>
                                {sections.map(s => (
                                    <option key={s.id} value={s.id}>{s.section_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Subject</label>
                            <select
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                                disabled={!classId}
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm bg-white disabled:bg-gray-50"
                            >
                                <option value="">{classId ? (subjects.length > 0 ? 'Select Subject' : 'No subjects assigned') : 'Select Class First'}</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.subject_name}</option>
                                ))}
                            </select>
                            {classId && subjects.length === 0 && (
                                <p className="text-xs text-orange-600 mt-1 ml-1 font-medium flex items-center gap-1">
                                    <AlertCircle size={14} />
                                    Assign subjects in Teacher Management
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Exam Type</label>
                            <select
                                value={examId}
                                onChange={(e) => setExamId(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm bg-white"
                            >
                                <option value="">Select Exam</option>
                                {exams.map(e => (
                                    <option key={e.id} value={e.id}>{e.exam_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Academic Year</label>
                            <select
                                value={academicYear}
                                onChange={(e) => setAcademicYear(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm bg-white"
                            >
                                <option value="2025-2026">2025-2026</option>
                                <option value="2024-2025">2024-2025</option>
                            </select>
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        {!classId || !subjectId || !examId ? (
                            <p className="text-gray-600 text-center py-8">
                                Please select class, subject, and exam type to view students
                            </p>
                        ) : loading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                                <p className="text-gray-600">Loading student records...</p>
                            </div>
                        ) : students.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-600">No students found for selection.</p>
                            </div>
                        ) : (
                            <div>
                                {/* Desktop Table */}
                                <div className="hidden sm:block overflow-hidden rounded-2xl border border-gray-100">
                                    <table className="w-full">
                                        <thead className="bg-gray-50/50">
                                            <tr>
                                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Student</th>
                                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest w-40">Marks Obtained</th>
                                                <th className="text-center py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest w-24">Absent</th>
                                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {students.map((student) => (
                                                <StudentMarkRow
                                                    key={student.student_id}
                                                    student={student}
                                                    onMarkChange={handleMarkChange}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="sm:hidden space-y-4">
                                    {students.map((student) => (
                                        <StudentMarkCard
                                            key={student.student_id}
                                            student={student}
                                            onMarkChange={handleMarkChange}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-10 flex flex-col sm:flex-row justify-center sm:justify-end gap-4">
                        <button
                            onClick={handleCalculateGrades}
                            disabled={loading || calculating}
                            className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-gray-900 text-gray-900 rounded-2xl hover:bg-gray-50 transition-all font-bold shadow-lg shadow-gray-100 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {calculating ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                                <RefreshCw className="w-5 h-5" />
                            )}
                            {calculating ? 'Calculating...' : 'Calculate All Grades'}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading || saving || students.length === 0}
                            className={`w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-4 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all font-bold shadow-xl shadow-gray-200 active:scale-95 disabled:opacity-50 ${saving ? 'cursor-not-allowed' : ''}`}
                        >
                            {saving ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Saving Marks...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Save Progress
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </main>

            {showBulkModal && (
                <BulkUploadModal
                    title="Bulk Upload Marks"
                    onUpload={handleBulkUpload}
                    onCancel={() => setShowBulkModal(false)}
                    templateLink="http://localhost:3001/templates/marks_template.csv"
                />
            )}
        </div>
    );
};

export default MarksEntry;
