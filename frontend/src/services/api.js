import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    getProfile: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout')
};

// Students API
export const studentsAPI = {
    getAll: (params) => api.get('/students', { params }),
    getById: (id) => api.get(`/students/${id}`),
    create: (data) => api.post('/students', data),
    update: (id, data) => api.put(`/students/${id}`, data),
    delete: (id) => api.delete(`/students/${id}`),
    bulkUpload: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/students/bulk-upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

// Attendance API
export const attendanceAPI = {
    mark: (data) => api.post('/attendance', data),
    markBulk: (data) => api.post('/attendance/bulk', data),
    bulkUpload: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/attendance/bulk-upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    getByStudent: (id, params) => api.get(`/attendance/student/${id}`, { params }),
    getByClass: (classId, sectionId, params) =>
        api.get(`/attendance/class/${classId}/section/${sectionId}`, { params }),
    getSummary: (params) => api.get('/attendance/summary', { params })
};

// Marks API
export const marksAPI = {
    enter: (data) => api.post('/marks', data),
    bulkUpload: (file, classSubjectId, examTypeId, academicYear) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('class_subject_id', classSubjectId);
        formData.append('exam_type_id', examTypeId);
        formData.append('academic_year', academicYear);
        return api.post('/marks/bulk-upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    getByStudent: (id, params) => api.get(`/marks/student/${id}`, { params }),
    getByClass: (classId, subjectId, examId, params) =>
        api.get(`/marks/class/${classId}/subject/${subjectId}/exam/${examId}`, { params }),
    update: (id, data) => api.put(`/marks/${id}`, data)
};

// Grades API
export const gradesAPI = {
    calculate: (academicYear) => api.post('/grades/calculate', { academic_year: academicYear }),
    calculateStudent: (studentId, classSubjectId, academicYear) =>
        api.post(`/grades/calculate/${studentId}/${classSubjectId}`, { academic_year: academicYear }),
    getByStudent: (id, params) => api.get(`/grades/student/${id}`, { params })
};

// Reports API
export const reportsAPI = {
    getProgressCard: (studentId, params) => api.get(`/reports/progress-card/${studentId}`, { params }),
    getClassPerformance: (classId, params) => api.get(`/reports/class-performance/${classId}`, { params }),
    getAttendanceSummary: (params) => api.get('/reports/attendance-summary', { params }),
    getAcademicAnalytics: (params) => api.get('/reports/academic-analytics', { params })
};

// Master Data API
export const masterAPI = {
    getClasses: () => api.get('/master/classes'),
    getSections: (classId) => api.get('/master/sections', { params: classId ? { class_id: classId } : {} }),
    getSubjects: (classId) => api.get('/master/subjects', { params: classId ? { class_id: classId } : {} }),
    getExamTypes: () => api.get('/master/exam-types')
};

// Teachers API
export const teachersAPI = {
    getAll: () => api.get('/teachers'),
    create: (data) => api.post('/teachers', data),
    bulkUpload: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/teachers/bulk', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    update: (id, data) => api.put(`/teachers/${id}`, data),
    getAssignments: () => api.get('/teachers/assignments'),
    assign: (data) => api.post('/teachers/assign', data),
    removeAssignment: (id) => api.delete(`/teachers/assign/${id}`),
    getClassTeachers: () => api.get('/teachers/class-teachers'),
    assignClassTeacher: (data) => api.post('/teachers/assign-class-teacher', data),
    removeClassTeacher: (sectionId) => api.delete(`/teachers/assign-class-teacher/${sectionId}`)
};

// Parent API
export const parentsAPI = {
    getChildren: () => api.get('/parents/my-children')
};

// Leads API
export const leadsAPI = {
    getAll: (params) => api.get('/leads', { params }),
    getById: (id) => api.get(`/leads/${id}`),
    create: (data) => api.post('/leads', data),
    update: (id, data) => api.put(`/leads/${id}`, data),
    delete: (id) => api.delete(`/leads/${id}`),
    assign: (id, agentId) => api.post(`/leads/${id}/assign`, { agentId }),
    bulkUpload: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/leads/bulk-upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

export default api;
