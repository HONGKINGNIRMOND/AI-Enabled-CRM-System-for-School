import React, { useState, useEffect } from 'react';
import { X, User, Save, AlertCircle, Users } from 'lucide-react';
import { masterAPI, teachersAPI } from '../../services/api';

const StudentFormModal = ({ student = null, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        first_name: student?.first_name || '',
        last_name: student?.last_name || '',
        date_of_birth: student?.date_of_birth ? new Date(student.date_of_birth).toISOString().split('T')[0] : '',
        gender: student?.gender || 'Male',
        blood_group: student?.blood_group || '',
        phone: student?.phone || '',
        email: student?.email || '',
        address: student?.address || '',
        city: student?.city || '',
        state: student?.state || '',
        pincode: student?.pincode || '',
        admission_date: student?.admission_date ? new Date(student.admission_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        class_id: student?.class_id || '',
        section_id: student?.section_id || '',
        assigned_teacher_id: student?.assigned_teacher_id || '',
        academic_year: '2026-2027',
        father_name: student?.father_name || '',
        father_phone: student?.father_phone || '',
        father_whatsapp: student?.father_whatsapp || '',
        father_email: student?.father_email || '',
        father_occupation: student?.father_occupation || '',
        mother_name: student?.mother_name || '',
        mother_phone: student?.mother_phone || '',
        mother_whatsapp: student?.mother_whatsapp || '',
        mother_email: student?.mother_email || '',
        mother_occupation: student?.mother_occupation || ''
    });

    const [errors, setErrors] = useState({});
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [loadingSections, setLoadingSections] = useState(false);
    const [loadingTeachers, setLoadingTeachers] = useState(true);

    useEffect(() => {
        fetchClasses();
        fetchTeachers();
    }, []);

    useEffect(() => {
        if (formData.class_id) {
            fetchSections(formData.class_id);
        } else {
            setSections([]);
            setFormData(prev => ({ ...prev, section_id: '' }));
        }
    }, [formData.class_id]);

    const fetchClasses = async () => {
        try {
            const response = await masterAPI.getClasses();
            setClasses(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        } finally {
            setLoadingClasses(false);
        }
    };

    const fetchSections = async (classId) => {
        try {
            setLoadingSections(true);
            const response = await masterAPI.getSections(classId);
            setSections(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch sections:', error);
            setSections([]);
        } finally {
            setLoadingSections(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            setLoadingTeachers(true);
            const response = await teachersAPI.getAll();
            setTeachers(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch teachers:', error);
            setTeachers([]);
        } finally {
            setLoadingTeachers(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.first_name.trim()) newErrors.first_name = 'Required';
        if (!formData.last_name.trim()) newErrors.last_name = 'Required';
        if (!formData.date_of_birth) newErrors.date_of_birth = 'Required';
        if (!formData.admission_date) newErrors.admission_date = 'Required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSave(formData);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">
                                {student ? 'Update Student Profile' : 'Enroll New Student'}
                            </h2>
                            <p className="text-xs text-blue-100 font-medium">Academic Year {formData.academic_year}</p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                        <div className="md:col-span-2 flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-2xl text-xs font-bold text-blue-700 uppercase tracking-wider">
                            <AlertCircle className="w-4 h-4" />
                            General Information
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Admission Date *</label>
                            <input
                                type="date"
                                name="admission_date"
                                value={formData.admission_date}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border rounded-2xl focus:ring-4 outline-none transition-all ${errors.admission_date
                                    ? 'border-red-300 focus:ring-red-100 bg-red-50'
                                    : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400'
                                    }`}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">First Name *</label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder="John"
                                className={`w-full px-4 py-3 border rounded-2xl focus:ring-4 outline-none transition-all ${errors.first_name
                                    ? 'border-red-300 focus:ring-red-100 bg-red-50'
                                    : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400'
                                    }`}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Last Name *</label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder="Doe"
                                className={`w-full px-4 py-3 border rounded-2xl focus:ring-4 outline-none transition-all ${errors.last_name
                                    ? 'border-red-300 focus:ring-red-100 bg-red-50'
                                    : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400'
                                    }`}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Date of Birth *</label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border rounded-2xl focus:ring-4 outline-none transition-all ${errors.date_of_birth
                                    ? 'border-red-300 focus:ring-red-100 bg-red-50'
                                    : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400'
                                    }`}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Gender *</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Male', 'Female', 'Other'].map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, gender: g })}
                                        className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${formData.gender === g
                                            ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm'
                                            : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                                            }`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="md:col-span-2 flex items-center gap-2 p-3 bg-purple-50 border border-purple-100 rounded-2xl text-xs font-bold text-purple-700 uppercase tracking-wider mt-2">
                            <AlertCircle className="w-4 h-4" />
                            Academic Information
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Class</label>
                            <select
                                name="class_id"
                                value={formData.class_id}
                                onChange={handleChange}
                                disabled={loadingClasses}
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all disabled:bg-gray-100"
                            >
                                <option value="">Select Class</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.class_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Section</label>
                            <select
                                name="section_id"
                                value={formData.section_id}
                                onChange={handleChange}
                                disabled={!formData.class_id || loadingSections}
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">Select Section</option>
                                {sections.map((sec) => (
                                    <option key={sec.id} value={sec.id}>
                                        {sec.section_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Assigned Teacher</label>
                            <select
                                name="assigned_teacher_id"
                                value={formData.assigned_teacher_id || ''}
                                onChange={handleChange}
                                disabled={loadingTeachers}
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all disabled:bg-gray-100"
                            >
                                <option value="">Select Teacher (Optional)</option>
                                {teachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.full_name} ({teacher.email})
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Select a teacher to assign to this student</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Academic Year</label>
                            <input
                                type="text"
                                name="academic_year"
                                value={formData.academic_year}
                                onChange={handleChange}
                                placeholder="2025"
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Blood Group</label>
                            <select
                                name="blood_group"
                                value={formData.blood_group}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            >
                                <option value="">Select Blood Group</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>

                        <div className="md:col-span-2 flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs font-bold text-indigo-700 uppercase tracking-wider mt-2">
                            <AlertCircle className="w-4 h-4" />
                            Contact & Location
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+1 234 567 890"
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="student@example.com"
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Resident Address</label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows="2"
                                placeholder="Street, Building, Apartment..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all resize-none"
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 md:col-span-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-bold text-gray-700 ml-1">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-bold text-gray-700 ml-1">State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1 space-y-1.5">
                                <label className="block text-sm font-bold text-gray-700 ml-1">Pincode</label>
                                <input
                                    type="text"
                                    name="pincode"
                                    value={formData.pincode}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-2xl text-xs font-bold text-green-700 uppercase tracking-wider mt-2">
                            <Users className="w-4 h-4" />
                            Father Information
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Father's Name</label>
                            <input
                                type="text"
                                name="father_name"
                                value={formData.father_name}
                                onChange={handleChange}
                                placeholder="John Doe Sr."
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Father's Phone</label>
                            <input
                                type="tel"
                                name="father_phone"
                                value={formData.father_phone}
                                onChange={handleChange}
                                placeholder="+1 234 567 890"
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Father's WhatsApp</label>
                            <input
                                type="tel"
                                name="father_whatsapp"
                                value={formData.father_whatsapp}
                                onChange={handleChange}
                                placeholder="+1 234 567 890"
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Father's Email</label>
                            <input
                                type="email"
                                name="father_email"
                                value={formData.father_email}
                                onChange={handleChange}
                                placeholder="father@example.com"
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Father's Occupation</label>
                            <input
                                type="text"
                                name="father_occupation"
                                value={formData.father_occupation}
                                onChange={handleChange}
                                placeholder="Engineer, Doctor, Business, etc."
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            />
                        </div>

                        <div className="md:col-span-2 flex items-center gap-2 p-3 bg-pink-50 border border-pink-100 rounded-2xl text-xs font-bold text-pink-700 uppercase tracking-wider mt-2">
                            <Users className="w-4 h-4" />
                            Mother Information
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Mother's Name</label>
                            <input
                                type="text"
                                name="mother_name"
                                value={formData.mother_name}
                                onChange={handleChange}
                                placeholder="Jane Doe"
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Mother's Phone</label>
                            <input
                                type="tel"
                                name="mother_phone"
                                value={formData.mother_phone}
                                onChange={handleChange}
                                placeholder="+1 234 567 890"
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Mother's WhatsApp</label>
                            <input
                                type="tel"
                                name="mother_whatsapp"
                                value={formData.mother_whatsapp}
                                onChange={handleChange}
                                placeholder="+1 234 567 890"
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Mother's Email</label>
                            <input
                                type="email"
                                name="mother_email"
                                value={formData.mother_email}
                                onChange={handleChange}
                                placeholder="mother@example.com"
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Mother's Occupation</label>
                            <input
                                type="text"
                                name="mother_occupation"
                                value={formData.mother_occupation}
                                onChange={handleChange}
                                placeholder="Teacher, Nurse, Homemaker, etc."
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t flex flex-col-reverse sm:flex-row justify-end gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="w-full sm:w-auto px-8 py-3.5 text-gray-600 font-bold hover:bg-gray-100 rounded-2xl transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                        >
                            <Save className="w-5 h-5" />
                            {student ? 'Update Profile' : 'Complete Enrollment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentFormModal;
