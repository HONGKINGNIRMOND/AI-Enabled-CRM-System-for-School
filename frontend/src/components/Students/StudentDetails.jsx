import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { studentsAPI, attendanceAPI, marksAPI, masterAPI, gradesAPI } from '../../services/api';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Book, User, GraduationCap, Droplet, Clock, Trash2, Ban, CheckCircle, UserCheck, TrendingUp, BookOpen, Award } from 'lucide-react';

const StudentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [attendanceData, setAttendanceData] = useState(null);
    const [academicData, setAcademicData] = useState({ subjects: [], marks: [], grades: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            await fetchStudentDetails();
            fetchAttendanceData();
        };
        fetchAllData();
    }, [id]);

    useEffect(() => {
        if (student && student.class_id) {
            fetchAcademicData();
        }
    }, [student]);

    const fetchAcademicData = async () => {
        try {
            // Use the student's academic year from their enrollment
            const academicYear = student.academic_year || '2026-2027';
            const [subjectsRes, marksRes, gradesRes] = await Promise.all([
                masterAPI.getSubjects(student.class_id),
                marksAPI.getByStudent(id, { academic_year: academicYear }),
                gradesAPI.getByStudent(id, { academic_year: academicYear })
            ]);
            setAcademicData({
                subjects: subjectsRes.data.data,
                marks: marksRes.data.data.marks,
                grades: gradesRes.data.data.grades || []
            });
        } catch (error) {
            console.error('Failed to fetch academic data:', error);
        }
    };

    const fetchAttendanceData = async () => {
        try {
            const response = await attendanceAPI.getByStudent(id);
            setAttendanceData(response.data.data);
        } catch (error) {
            console.error('Failed to fetch attendance data:', error);
            setAttendanceData(null);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
            try {
                await studentsAPI.delete(id);
                navigate('/students');
            } catch (error) {
                console.error('Failed to delete student:', error);
                alert('Failed to delete student');
            }
        }
    };

    const handleToggleStatus = async () => {
        try {
            await studentsAPI.update(id, { is_active: !student.is_active });
            fetchStudentDetails();
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update student status');
        }
    };

    const fetchStudentDetails = async () => {
        try {
            setLoading(true);
            const response = await studentsAPI.getById(id);
            // API returns { success: true, data: { student: {...} } }
            setStudent(response.data.data.student);
        } catch (err) {
            console.error('Failed to fetch student details:', err);
            setError('Failed to load student information.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading student profile...</p>
                </div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                        <User className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Student Not Found</h2>
                    <p className="text-gray-600 mb-6">{error || "The requested student could not be found."}</p>
                    <Link to="/students" className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Students
                    </Link>
                </div>
            </div>
        );
    }

    // Helper for safe value display
    const displayValue = (val) => val || <span className="text-gray-400 italic">Not set</span>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header / Banner */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/students')}
                                className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition group mr-2"
                            >
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 group-hover:border-blue-200 group-hover:bg-blue-50 transition">
                                    <ArrowLeft className="w-4 h-4" />
                                </div>
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{student.first_name} {student.last_name}</h1>
                                <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                                    <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg text-xs uppercase tracking-wider font-bold">
                                        Active Student
                                    </span>
                                    <span>•</span>
                                    <span>Roll No: {student.roll_number || '-'}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleToggleStatus}
                                className={`flex items-center gap-2 px-4 py-2 bg-white border rounded-lg font-medium transition-colors ${student.is_active
                                    ? 'border-orange-200 text-orange-700 hover:bg-orange-50'
                                    : 'border-green-200 text-green-700 hover:bg-green-50'}`}
                            >
                                {student.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                {student.is_active ? 'Block Student' : 'Unblock Student'}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Student
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: ID Card Style Info */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mx-auto mb-6 flex items-center justify-center text-blue-600 shadow-inner">
                                <span className="text-5xl font-bold">{student.first_name.charAt(0)}</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">{student.first_name} {student.last_name}</h2>
                            <p className="text-gray-500 font-medium mb-6">Roll No: {student.roll_number || '-'}</p>

                            <div className="grid grid-cols-2 gap-4 text-left bg-gray-50 p-4 rounded-xl">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Class</p>
                                    <p className="font-bold text-gray-900">{student.class_name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Section</p>
                                    <p className="font-bold text-gray-900">{student.section_name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Year</p>
                                    <p className="font-bold text-gray-900">{student.academic_year || '-'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-blue-600" />
                                Academic Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-500 font-medium mb-1">Admission Date</p>
                                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        {student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Detailed Info */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Personal Information */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-600" />
                                Personal Information
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Date of Birth</p>
                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Gender</p>
                                    <p className="font-medium text-gray-900">{student.gender}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Blood Group</p>
                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                        <Droplet className="w-4 h-4 text-red-500" />
                                        {displayValue(student.blood_group)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Phone className="w-5 h-5 text-green-600" />
                                Contact Details
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Phone Number</p>
                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        {displayValue(student.phone)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Email Address</p>
                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        {displayValue(student.email)}
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Address</p>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-gray-900">{displayValue(student.address)}</p>
                                            {(student.city || student.state || student.pincode) && (
                                                <p className="text-gray-500 mt-1">
                                                    {[student.city, student.state, student.pincode].filter(Boolean).join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Parent Information */}
                        {(student.father_name || student.mother_name) && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <User className="w-5 h-5 text-purple-600" />
                                    Parent Information
                                </h3>

                                <div className="space-y-8">
                                    {/* Father Information */}
                                    {student.father_name && (
                                        <div>
                                            <h4 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                                Father Details
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12 pl-4">
                                                <div>
                                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Name</p>
                                                    <p className="font-medium text-gray-900">{displayValue(student.father_name)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Phone</p>
                                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-gray-400" />
                                                        {displayValue(student.father_phone)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">WhatsApp</p>
                                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-green-500" />
                                                        {displayValue(student.father_whatsapp)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Email</p>
                                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-gray-400" />
                                                        {displayValue(student.father_email)}
                                                    </p>
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Occupation</p>
                                                    <p className="font-medium text-gray-900">{displayValue(student.father_occupation)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Mother Information */}
                                    {student.mother_name && (
                                        <div>
                                            <h4 className="text-sm font-bold text-pink-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
                                                Mother Details
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12 pl-4">
                                                <div>
                                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Name</p>
                                                    <p className="font-medium text-gray-900">{displayValue(student.mother_name)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Phone</p>
                                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-gray-400" />
                                                        {displayValue(student.mother_phone)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">WhatsApp</p>
                                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-green-500" />
                                                        {displayValue(student.mother_whatsapp)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Email</p>
                                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-gray-400" />
                                                        {displayValue(student.mother_email)}
                                                    </p>
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Occupation</p>
                                                    <p className="font-medium text-gray-900">{displayValue(student.mother_occupation)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Attendance Information */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-blue-600" />
                                Attendance Overview
                            </h3>

                            {attendanceData ? (
                                <div>
                                    {/* Attendance Summary Stats */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-blue-800">{attendanceData.summary?.total_days || 0}</p>
                                            <p className="text-sm text-blue-600 font-medium">Total Days</p>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-green-800">{attendanceData.summary?.present_days || 0}</p>
                                            <p className="text-sm text-green-600 font-medium">Present</p>
                                        </div>
                                        <div className="bg-red-50 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-red-800">{attendanceData.summary?.absent_days || 0}</p>
                                            <p className="text-sm text-red-600 font-medium">Absent</p>
                                        </div>
                                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-purple-800">{attendanceData.summary?.attendance_percentage || 0}%</p>
                                            <p className="text-sm text-purple-600 font-medium">Attendance</p>
                                        </div>
                                    </div>

                                    {/* Recent Attendance Records */}
                                    {attendanceData.attendance && attendanceData.attendance.length > 0 && (
                                        <div>
                                            <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-600" />
                                                Recent Attendance (Last 10 days)
                                            </h4>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Session</th>
                                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Remarks</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {attendanceData.attendance.slice(0, 10).map((record, index) => (
                                                            <tr key={index} className="hover:bg-gray-50">
                                                                <td className="py-3 px-4 font-medium">
                                                                    {new Date(record.attendance_date).toLocaleDateString()}
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                                        {record.session || 'Morning'}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.status === 'Present'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : record.status === 'Absent'
                                                                            ? 'bg-red-100 text-red-800'
                                                                            : record.status === 'Late'
                                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                                : 'bg-blue-100 text-blue-800'
                                                                        }`}>
                                                                        {record.status}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-4 text-gray-600">
                                                                    {record.remarks || '-'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No attendance data available</p>
                                </div>
                            )}
                        </div>

                        {/* Academic Performance & Subject Teachers */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-600" />
                                Academic Performance
                            </h3>

                            {academicData.subjects.length > 0 ? (
                                <div className="space-y-6">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="text-left py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[10px]">Subject</th>
                                                    <th className="text-left py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[10px]">Teacher</th>
                                                    <th className="text-left py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[10px]">Exam Name</th>
                                                    <th className="text-center py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[10px]">Marks</th>
                                                    <th className="text-center py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[10px]">Grade</th>
                                                    <th className="text-center py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[10px]">%</th>
                                                    <th className="text-left py-3 px-4 font-bold text-gray-700 uppercase tracking-wider text-[10px]">Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {academicData.subjects.map((subject) => {
                                                    const subjectMarks = academicData.marks.filter(m => m.class_subject_id === (subject.class_subject_id || subject.id));

                                                    if (subjectMarks.length === 0) {
                                                        return (
                                                            <tr key={subject.id} className="hover:bg-gray-50/50 transition-colors">
                                                                <td className="py-4 px-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                                                            <BookOpen className="w-3.5 h-3.5" />
                                                                        </div>
                                                                        <span className="font-bold text-gray-900">{subject.subject_name}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-4 px-4">
                                                                    <div className="flex items-center gap-2 text-gray-600">
                                                                        <div className="w-7 h-7 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center font-bold text-[10px]">
                                                                            {subject.teacher_name?.charAt(0) || '?'}
                                                                        </div>
                                                                        <span className="font-medium text-xs">{subject.teacher_name || 'Not assigned'}</span>
                                                                    </div>
                                                                </td>
                                                                <td colSpan="4" className="py-4 px-4 text-center text-gray-400 italic text-xs">
                                                                    No marks entered yet
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    return subjectMarks.map((mark, midx) => (
                                                        <tr key={`${subject.id}-${midx}`} className="hover:bg-gray-50/50 transition-colors">
                                                            {midx === 0 && (
                                                                <>
                                                                    <td className="py-4 px-4" rowSpan={subjectMarks.length}>
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                                                                <BookOpen className="w-3.5 h-3.5" />
                                                                            </div>
                                                                            <span className="font-bold text-gray-900">{subject.subject_name}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-4 px-4" rowSpan={subjectMarks.length}>
                                                                        <div className="flex items-center gap-2 text-gray-600">
                                                                            <div className="w-7 h-7 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center font-bold text-[10px]">
                                                                                {subject.teacher_name?.charAt(0) || '?'}
                                                                            </div>
                                                                            <span className="font-medium text-xs">{subject.teacher_name || 'Not assigned'}</span>
                                                                        </div>
                                                                    </td>
                                                                </>
                                                            )}
                                                            <td className="py-4 px-4">
                                                                <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                                                    {mark.exam_name}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4 text-center">
                                                                <span className={`text-sm font-bold ${mark.is_absent ? 'text-red-500' : 'text-blue-600'}`}>
                                                                    {mark.is_absent ? 'ABSENT' : `${parseFloat(mark.marks_obtained)} / ${parseFloat(mark.max_marks)}`}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4 text-center">
                                                                {(() => {
                                                                    const gradeInfo = academicData.grades.find(g => g.class_subject_id === (subject.class_subject_id || subject.id));
                                                                    return gradeInfo ? (
                                                                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold">
                                                                            {gradeInfo.grade_name}
                                                                        </span>
                                                                    ) : '-';
                                                                })()}
                                                            </td>
                                                            <td className="py-4 px-4 text-center">
                                                                {!mark.is_absent && (
                                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${(mark.marks_obtained / mark.max_marks) >= 0.35 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                        }`}>
                                                                        {Math.round((mark.marks_obtained / mark.max_marks) * 100)}%
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <p className="text-xs text-gray-600 italic max-w-[200px] truncate" title={mark.remarks}>
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
                                <div className="text-center py-12 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                                    <Book className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium">Academic curriculum not assigned</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentDetails;
