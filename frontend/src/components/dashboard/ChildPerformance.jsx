import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { attendanceAPI, marksAPI, masterAPI, studentsAPI } from '../../services/api';
import { ArrowLeft, Book, Calendar, Clock, BookOpen, Award, TrendingUp, UserCheck, Droplet, User, Phone, Mail, MapPin, Star, BarChart3, Target } from 'lucide-react';

const ChildPerformance = () => {
    const { id } = useParams();
    const [student, setStudent] = useState(null);
    const [attendanceData, setAttendanceData] = useState(null);
    const [academicData, setAcademicData] = useState({ subjects: [], marks: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const response = await studentsAPI.getById(id);
                setStudent(response.data.data.student);

                // Concurrent fetches
                const [attendanceRes, subjectsRes, marksRes] = await Promise.all([
                    attendanceAPI.getByStudent(id),
                    masterAPI.getSubjects(response.data.data.student.class_id),
                    marksAPI.getByStudent(id)
                ]);

                setAttendanceData(attendanceRes.data.data);
                setAcademicData({
                    subjects: subjectsRes.data.data,
                    marks: marksRes.data.data.marks
                });
            } catch (err) {
                console.error('Failed to fetch child data:', err);
                setError('Failed to load child information.');
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-semibold">Loading performance data...</p>
                </div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-gray-200">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Child Not Found</h2>
                    <p className="text-gray-600 mb-8">{error || "We couldn't find the record for this child."}</p>
                    <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-sm">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const displayValue = (val) => val || <span className="text-gray-400 italic">Not set</span>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-12">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg transition-all text-gray-500 hover:text-indigo-600">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                                    {student.first_name} {student.last_name}
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md">
                                        Performance Report
                                    </span>
                                    <span className="text-gray-300">•</span>
                                    <p className="text-sm text-gray-500">Class {student.class_name} • Section {student.section_name}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Summary */}
                    <div className="space-y-6">
                        {/* Attendance Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-indigo-600" />
                                Attendance Overview
                            </h3>
                            {attendanceData ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-indigo-700">{attendanceData.summary?.attendance_percentage || 0}%</p>
                                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mt-1">Overall Attendance</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                <p className="text-xs font-semibold text-green-700 uppercase">Present</p>
                                            </div>
                                            <p className="text-lg font-bold text-gray-900">{attendanceData.summary?.present_days || 0}</p>
                                            <p className="text-xs text-gray-500">Days</p>
                                        </div>
                                        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                <p className="text-xs font-semibold text-red-700 uppercase">Absent</p>
                                            </div>
                                            <p className="text-lg font-bold text-gray-900">{attendanceData.summary?.absent_days || 0}</p>
                                            <p className="text-xs text-gray-500">Days</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-6 text-sm italic">No attendance data available</p>
                            )}
                        </div>

                        {/* Student Profile Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-indigo-600" />
                                Student Information
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Registration No</p>
                                        <p className="font-semibold text-gray-900">{student.registration_number}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Admission Date</p>
                                        <p className="font-semibold text-gray-900">{student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                                        <Droplet className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Blood Group</p>
                                        <p className="font-semibold text-gray-900">{displayValue(student.blood_group)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Academic Performance */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-indigo-600" />
                                    Academic Performance
                                </h3>
                            </div>

                            {academicData.subjects.length > 0 ? (
                                <div className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-b border-gray-100">
                                                <tr>
                                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</th>
                                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Teacher</th>
                                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Exam Name</th>
                                                    <th className="text-center py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Marks</th>
                                                    <th className="text-center py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">%</th>
                                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {academicData.subjects.map((subject) => {
                                                    const subjectMarks = academicData.marks.filter(m => m.subject_id === subject.id || m.class_subject_id === subject.class_subject_id);

                                                    if (subjectMarks.length === 0) {
                                                        return (
                                                            <tr key={subject.id} className="hover:bg-gray-50 transition-colors">
                                                                <td className="py-4 px-6">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                                                            <BookOpen className="w-4 h-4" />
                                                                        </div>
                                                                        <p className="font-semibold text-gray-900">{subject.subject_name}</p>
                                                                    </div>
                                                                </td>
                                                                <td className="py-4 px-6">
                                                                    <p className="text-xs text-gray-500">Teacher: {subject.teacher_name || 'Not assigned'}</p>
                                                                </td>
                                                                <td colSpan="4" className="py-4 px-6 text-center text-gray-400 italic text-xs">
                                                                    No marks entered yet
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    return subjectMarks.map((mark, mIdx) => (
                                                        <tr key={`${subject.id}-${mIdx}`} className="hover:bg-gray-50 transition-colors">
                                                            {mIdx === 0 && (
                                                                <>
                                                                    <td className="py-4 px-6" rowSpan={subjectMarks.length}>
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                                                                <BookOpen className="w-4 h-4" />
                                                                            </div>
                                                                            <p className="font-semibold text-gray-900">{subject.subject_name}</p>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-4 px-6" rowSpan={subjectMarks.length}>
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-7 h-7 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center font-bold text-[10px]">
                                                                                {subject.teacher_name?.charAt(0) || '?'}
                                                                            </div>
                                                                            <span className="text-xs text-gray-600">{subject.teacher_name || 'Not assigned'}</span>
                                                                        </div>
                                                                    </td>
                                                                </>
                                                            )}
                                                            <td className="py-4 px-6">
                                                                <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-100 px-2 py-1 rounded">
                                                                    {mark.exam_name}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-6 text-center">
                                                                <span className={`text-sm font-bold ${mark.is_absent ? 'text-red-500' : 'text-indigo-600'}`}>
                                                                    {mark.is_absent ? 'ABSENT' : `${parseFloat(mark.marks_obtained)} / ${parseFloat(mark.max_marks)}`}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-6 text-center">
                                                                {!mark.is_absent && (
                                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${(mark.marks_obtained / mark.max_marks) >= 0.35 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                        }`}>
                                                                        {Math.round((mark.marks_obtained / mark.max_marks) * 100)}%
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <p className="text-xs text-gray-600 italic max-w-[150px] truncate" title={mark.remarks}>
                                                                    {mark.remarks ? `"${mark.remarks}"` : '-'}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    ));
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Book className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="text-gray-500 font-medium">Academic records not available yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ChildPerformance;
