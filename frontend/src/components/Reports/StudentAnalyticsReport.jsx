import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    ArrowLeft, 
    Filter, 
    Download, 
    Search, 
    Users, 
    Activity, 
    UserCheck,
    BookOpen,
    CheckSquare,
    Square,
    RotateCw,
    RefreshCcw
} from 'lucide-react';
import { reportsAPI, masterAPI } from '../../services/api';

const StudentAnalyticsReport = () => {
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    
    // Selection & Display state
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);

    // Filter activation state
    const [enabledFilters, setEnabledFilters] = useState({
        attendance: false,
        performance: false,
        subject: false
    });

    // Filters values
    const [filters, setFilters] = useState({
        academic_year: '',
        class_id: '',
        section_id: '',
        subject_ids: [], // Changed from subject_id to array
        min_attendance: '',
        max_attendance: '',
        min_performance: '',
        max_performance: '',
        min_subject_performance: '',
        max_subject_performance: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (filters.class_id) {
            fetchSections(filters.class_id);
            fetchSubjects(filters.class_id);
            // Clear subjects when class changes
            setFilters(prev => ({ ...prev, subject_ids: [] }));
        } else {
            setSections([]);
            setSubjects([]);
            setFilters(prev => ({ ...prev, subject_ids: [] }));
        }
    }, [filters.class_id]);

    const fetchInitialData = async () => {
        try {
            const classesRes = await masterAPI.getClasses();
            setClasses(classesRes.data.data || []);
            
            const yearsRes = await masterAPI.getAcademicYears();
            const years = yearsRes.data.data || [];
            setAcademicYears(years);
            if (years.length > 0) {
                setFilters(prev => ({ ...prev, academic_year: years[0] }));
            }
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
        }
    };

    const fetchSections = async (classId) => {
        try {
            const response = await masterAPI.getSections(classId);
            setSections(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch sections:', error);
        }
    };

    const resetFilters = () => {
        setFilters({
            academic_year: academicYears[0] || '',
            class_id: '',
            section_id: '',
            subject_ids: [],
            min_attendance: '',
            max_attendance: '',
            min_performance: '',
            max_performance: '',
            min_subject_performance: '',
            max_subject_performance: ''
        });
        setEnabledFilters({
            attendance: false,
            performance: false,
            subject: false
        });
        setStudents([]);
        setSelectedStudents([]);
    };

    const fetchSubjects = async (classId) => {
        try {
            const response = await masterAPI.getSubjects(classId);
            setSubjects(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch subjects:', error);
        }
    };

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // Only send active filters
            const activeParams = { 
                academic_year: filters.academic_year,
                class_id: filters.class_id,
                section_id: filters.section_id
            };

            if (enabledFilters.attendance) {
                activeParams.min_attendance = filters.min_attendance;
                activeParams.max_attendance = filters.max_attendance;
            }
            if (enabledFilters.performance) {
                activeParams.min_performance = filters.min_performance;
                activeParams.max_performance = filters.max_performance;
            }
            if (enabledFilters.subject) {
                activeParams.subject_ids = filters.subject_ids.join(','); // Pass as comma separated list
                activeParams.min_subject_performance = filters.min_subject_performance;
                activeParams.max_subject_performance = filters.max_subject_performance;
            }

            const response = await reportsAPI.getStudentAnalytics(activeParams);
            const data = response.data.data || [];
            setStudents(data);
            setSelectedStudents([]); // Reset selection on new search
        } catch (error) {
            console.error('Failed to fetch student analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSubjectToggle = (subjectId) => {
        setFilters(prev => {
            const ids = prev.subject_ids.includes(subjectId)
                ? prev.subject_ids.filter(id => id !== subjectId)
                : [...prev.subject_ids, subjectId];
            return { ...prev, subject_ids: ids };
        });
    };

    const handleSelectAllSubjects = () => {
        if (filters.subject_ids.length === subjects.length) {
            setFilters(prev => ({ ...prev, subject_ids: [] }));
        } else {
            setFilters(prev => ({ ...prev, subject_ids: subjects.map(s => s.id.toString()) }));
        }
    };

    const toggleFilter = (filterKey) => {
        setEnabledFilters(prev => ({ ...prev, [filterKey]: !prev[filterKey] }));
    };

    const handleSelectStudent = (studentId) => {
        setSelectedStudents(prev => 
            prev.includes(studentId) 
                ? prev.filter(id => id !== studentId) 
                : [...prev, studentId]
        );
    };

    const handleSelectAll = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(s => s.id));
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const classObj = classes.find(c => c.id.toString() === filters.class_id);
            const sectionObj = sections.find(s => s.id.toString() === filters.section_id);

            const exportParams = {
                academic_year: filters.academic_year,
                class_id: filters.class_id,
                section_id: filters.section_id,
                class_name: classObj?.class_name,
                section_name: sectionObj?.section_name,
                show_attendance: enabledFilters.attendance,
                show_performance: enabledFilters.performance,
                show_subject: enabledFilters.subject
            };

            if (enabledFilters.attendance) {
                exportParams.min_attendance = filters.min_attendance;
                exportParams.max_attendance = filters.max_attendance;
            }
            if (enabledFilters.performance) {
                exportParams.min_performance = filters.min_performance;
                exportParams.max_performance = filters.max_performance;
            }
            if (enabledFilters.subject) {
                exportParams.subject_ids = filters.subject_ids.join(',');
                exportParams.min_subject_performance = filters.min_subject_performance;
                exportParams.max_subject_performance = filters.max_subject_performance;
            }

            // If specific students are selected, only export those
            if (selectedStudents.length > 0) {
                exportParams.student_ids = selectedStudents.join(',');
            }

            const response = await reportsAPI.exportStudentAnalytics(exportParams);
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Student_Analytics_${filters.academic_year}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to export PDF:', error);
        } finally {
            setExporting(false);
        }
    };

    // Helper to get selected subject names from data or filters
    const getActiveSubjectsInResults = () => {
        if (!enabledFilters.subject) return [];
        return subjects
            .filter(s => filters.subject_ids.includes(s.id.toString()))
            .map(s => s.subject_name)
            .sort();
    };

    const totalColumns = 4 + 
        (enabledFilters.attendance ? 1 : 0) + 
        (enabledFilters.performance ? 1 : 0) + 
        (enabledFilters.subject ? 1 : 0) + 
        getActiveSubjectsInResults().length;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/reports" className="text-gray-600 hover:text-gray-900">
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-900">Detailed Student Analytics</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            {selectedStudents.length > 0 && (
                                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                    {selectedStudents.length} Selected
                                </span>
                            )}
                            <button 
                                onClick={handleExport}
                                disabled={exporting || students.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                <Download className="w-4 h-4" />
                                {exporting ? 'Generating PDF...' : selectedStudents.length > 0 ? 'Export Selected' : 'Export All Results'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex items-center gap-2 mb-6">
                        <Filter className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">Filter Students</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Class and Section */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                <select 
                                    name="class_id"
                                    value={filters.class_id}
                                    onChange={handleFilterChange}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select Class</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                                <select 
                                    name="academic_year"
                                    value={filters.academic_year}
                                    onChange={handleFilterChange}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {academicYears.map(year => <option key={year} value={year}>{year}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                <select 
                                    name="section_id"
                                    value={filters.section_id}
                                    onChange={handleFilterChange}
                                    disabled={!filters.class_id}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                                >
                                    <option value="">All Sections</option>
                                    {sections.map(s => <option key={s.id} value={s.id}>{s.section_name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Attendance Range */}
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                    type="checkbox"
                                    checked={enabledFilters.attendance}
                                    onChange={() => toggleFilter('attendance')}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className={`text-sm font-semibold ${enabledFilters.attendance ? 'text-gray-900' : 'text-gray-400'}`}>Attendance Filter</span>
                            </label>
                            
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    name="min_attendance"
                                    placeholder="Min %"
                                    value={filters.min_attendance}
                                    onChange={handleFilterChange}
                                    disabled={!enabledFilters.attendance}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                />
                                <span className="text-gray-400">-</span>
                                <input 
                                    type="number" 
                                    name="max_attendance"
                                    placeholder="Max %"
                                    value={filters.max_attendance}
                                    onChange={handleFilterChange}
                                    disabled={!enabledFilters.attendance}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* Overall Performance */}
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    checked={enabledFilters.performance}
                                    onChange={() => toggleFilter('performance')}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className={`text-sm font-semibold ${enabledFilters.performance ? 'text-gray-900' : 'text-gray-400'}`}>Overall Perf. Filter</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    name="min_performance"
                                    placeholder="Min %"
                                    value={filters.min_performance}
                                    onChange={handleFilterChange}
                                    disabled={!enabledFilters.performance}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                />
                                <span className="text-gray-400">-</span>
                                <input 
                                    type="number" 
                                    name="max_performance"
                                    placeholder="Max %"
                                    value={filters.max_performance}
                                    onChange={handleFilterChange}
                                    disabled={!enabledFilters.performance}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* Subject Specific */}
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    checked={enabledFilters.subject}
                                    onChange={() => toggleFilter('subject')}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className={`text-sm font-semibold ${enabledFilters.subject ? 'text-gray-900' : 'text-gray-400'}`}>Subject Analysis</span>
                                {enabledFilters.subject && filters.class_id && subjects.length > 0 && (
                                    <button 
                                        onClick={handleSelectAllSubjects}
                                        className="text-[10px] uppercase font-bold text-blue-600 hover:text-blue-800 ml-auto border border-blue-100 px-1.5 py-0.5 rounded bg-white shadow-sm"
                                    >
                                        {filters.subject_ids.length === subjects.length ? 'Clear All' : 'Select All'}
                                    </button>
                                )}
                            </label>
                            
                            <div className={`mt-2 border border-gray-200 rounded-lg bg-white overflow-y-auto h-24 p-2 ${!enabledFilters.subject || !filters.class_id ? 'opacity-50 grayscale' : ''}`}>
                                {!filters.class_id ? (
                                    <p className="text-xs text-gray-400 italic">Select a class first</p>
                                ) : subjects.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">No subjects found</p>
                                ) : (
                                    subjects.map(s => (
                                        <label key={s.id} className="flex items-center gap-2 py-1 hover:bg-gray-50 cursor-pointer">
                                            <input 
                                                type="checkbox"
                                                checked={filters.subject_ids.includes(s.id.toString())}
                                                onChange={() => handleSubjectToggle(s.id.toString())}
                                                disabled={!enabledFilters.subject}
                                                className="w-3 h-3 text-blue-600 rounded border-gray-300"
                                            />
                                            <span className="text-xs text-gray-700 truncate">{s.subject_name}</span>
                                        </label>
                                    ))
                                )}
                            </div>

                            <div className="flex items-center gap-2 mt-auto">
                                <input 
                                    type="number" 
                                    name="min_subject_performance"
                                    placeholder="Min %"
                                    value={filters.min_subject_performance}
                                    onChange={handleFilterChange}
                                    disabled={!enabledFilters.subject || filters.subject_ids.length === 0}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs disabled:opacity-50"
                                />
                                <span className="text-gray-400">-</span>
                                <input 
                                    type="number" 
                                    name="max_subject_performance"
                                    placeholder="Max %"
                                    value={filters.max_subject_performance}
                                    onChange={handleFilterChange}
                                    disabled={!enabledFilters.subject || filters.subject_ids.length === 0}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="lg:col-span-4 flex justify-end gap-3">
                            <button 
                                onClick={resetFilters}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm font-semibold"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                <span>Reset Filters</span>
                            </button>
                            <button 
                                onClick={fetchAnalytics}
                                disabled={loading}
                                className="flex items-center justify-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition shadow-lg disabled:opacity-50"
                            >
                                {loading ? (
                                    <RotateCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Search className="w-5 h-5" />
                                )}
                                <span className="font-bold">{loading ? 'Refreshing...' : 'Apply Active Filters'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-gray-900 text-lg">Analysis Results</h3>
                                    <button 
                                        onClick={fetchAnalytics}
                                        disabled={loading || !filters.class_id}
                                        title="Refresh Results"
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-30"
                                    >
                                        <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedStudents.length > 0 ? 'bg-blue-100 text-blue-700 animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
                                    {selectedStudents.length} Selected
                                </span>
                                <button 
                                    onClick={handleSelectAll}
                                    disabled={students.length === 0}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:text-gray-400 border border-blue-200 px-2 py-0.5 rounded bg-white shadow-sm"
                                >
                                    {selectedStudents.length === students.length ? 'Deselect All' : 'Select All Result'}
                                </button>
                                {selectedStudents.length > 0 && (
                                    <label className="flex items-center gap-2 cursor-pointer bg-blue-600 text-white px-3 py-0.5 rounded-full text-xs font-bold hover:bg-blue-700 transition shadow-sm">
                                        <input 
                                            type="checkbox"
                                            checked={showSelectedOnly}
                                            onChange={(e) => setShowSelectedOnly(e.target.checked)}
                                            className="w-3.5 h-3.5 rounded border-none focus:ring-0"
                                        />
                                        <span>Show Only Ticked ({selectedStudents.length})</span>
                                    </label>
                                )}
                            </div>
                            {getActiveSubjectsInResults().length > 0 && (
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-purple-600" />
                                    <span>Analyzing Performance in: <span className="font-semibold text-purple-700">{getActiveSubjectsInResults().join(', ')}</span></span>
                                </p>
                            )}
                        </div>
                        <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">{students.length} students found</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="checkbox"
                                                checked={students.length > 0 && selectedStudents.length === students.length}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                            <span>Select</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                                    {enabledFilters.attendance && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                                    )}
                                    {enabledFilters.performance && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Perf.</th>
                                    )}
                                    {enabledFilters.subject && (
                                        <th className="px-6 py-3 text-left text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50/50">
                                            Subject Analysis
                                        </th>
                                    )}
                                    {getActiveSubjectsInResults().map(subjectName => (
                                        <th key={subjectName} className="px-6 py-3 text-left text-xs font-medium text-purple-600 uppercase tracking-wider">
                                            {subjectName}
                                        </th>
                                    ))}
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={totalColumns} className="px-6 py-12 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                            <p className="mt-2 text-gray-500">Fetching analysis...</p>
                                        </td>
                                    </tr>
                                ) : students.filter(s => !showSelectedOnly || selectedStudents.includes(s.id)).length > 0 ? (
                                    students
                                        .filter(s => !showSelectedOnly || selectedStudents.includes(s.id))
                                        .map((student) => {
                                            const activeSubjectNames = getActiveSubjectsInResults();
                                            const totalScore = activeSubjectNames.reduce((acc, name) => acc + (parseFloat(student.subject_performances[name]) || 0), 0);
                                            const analysisAvg = activeSubjectNames.length > 0 ? (totalScore / activeSubjectNames.length).toFixed(1) : 0;

                                            return (
                                                <tr 
                                                    key={student.id} 
                                                    className={`hover:bg-gray-50 transition-colors ${selectedStudents.includes(student.id) ? 'bg-blue-50/30' : ''}`}
                                                    onClick={() => handleSelectStudent(student.id)}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                        <input 
                                                            type="checkbox"
                                                            checked={selectedStudents.includes(student.id)}
                                                            onChange={() => handleSelectStudent(student.id)}
                                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {student.student_name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {student.roll_number}
                                                    </td>
                                                    {enabledFilters.attendance && (
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-sm font-bold ${student.attendance_percentage < 75 ? 'text-red-600' : 'text-green-600'}`}>
                                                                    {student.attendance_percentage}%
                                                                </span>
                                                                <div className="w-16 h-1.5 bg-gray-100 rounded-full">
                                                                    <div 
                                                                        className={`h-1.5 rounded-full ${student.attendance_percentage < 75 ? 'bg-red-500' : 'bg-green-500'}`}
                                                                        style={{ width: `${student.attendance_percentage}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    )}
                                                    {enabledFilters.performance && (
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-sm font-bold ${student.overall_performance < 40 ? 'text-red-600' : 'text-indigo-600'}`}>
                                                                    {student.overall_performance}%
                                                                </span>
                                                                <div className="w-16 h-1.5 bg-gray-100 rounded-full">
                                                                    <div 
                                                                        className={`h-1.5 rounded-full ${student.overall_performance < 40 ? 'bg-red-500' : 'bg-indigo-500'}`}
                                                                        style={{ width: `${student.overall_performance}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    )}
                                                    {enabledFilters.subject && (
                                                        <td className="px-6 py-4 whitespace-nowrap bg-blue-50/20">
                                                            {activeSubjectNames.length > 0 ? (
                                                                <span className={`text-sm font-bold ${parseFloat(analysisAvg) < 40 ? 'text-red-700' : 'text-blue-700'}`}>
                                                                    {analysisAvg}%
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic font-medium">No Subjects Filtered</span>
                                                            )}
                                                        </td>
                                                    )}
                                                    {activeSubjectNames.map(subjectName => (
                                                        <td key={subjectName} className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`text-sm font-bold ${student.subject_performances[subjectName] < 40 ? 'text-red-600' : 'text-purple-600'}`}>
                                                                {student.subject_performances[subjectName] || 0}%
                                                            </span>
                                                        </td>
                                                    ))}
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                            student.overall_performance >= 75 ? 'bg-green-100 text-green-700' :
                                                            student.overall_performance >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                            {student.overall_performance >= 75 ? 'Excellent' :
                                                             student.overall_performance >= 50 ? 'Average' : 'Critical'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )
                                ) : (
                                    <tr>
                                        <td colSpan={totalColumns} className="px-6 py-12 text-center text-gray-500">
                                            No students found matching the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary Statistics */}
                {students.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Students</p>
                                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                                <UserCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Avg. Attendance</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {(students.reduce((acc, s) => acc + parseFloat(s.attendance_percentage), 0) / students.length).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Avg. Performance</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {(students.reduce((acc, s) => acc + parseFloat(s.overall_performance), 0) / students.length).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Subject Wise Statistics */}
                {students.length > 0 && getActiveSubjectsInResults().length > 0 && (
                    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
                            <h3 className="text-sm font-bold text-purple-900 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                Subject-Wise Performance Summary
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {getActiveSubjectsInResults().map(subjectName => {
                                const avg = (students.reduce((acc, s) => acc + (parseFloat(s.subject_performances[subjectName]) || 0), 0) / students.length).toFixed(1);
                                return (
                                    <div key={subjectName} className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm text-center">
                                        <p className="text-xs text-gray-500 mb-1 truncate" title={subjectName}>{subjectName}</p>
                                        <p className={`text-lg font-bold ${parseFloat(avg) < 40 ? 'text-red-600' : 'text-purple-600'}`}>
                                            {avg}%
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default StudentAnalyticsReport;
