import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import AdminDashboard from './components/dashboard/AdminDashboard';
import TeacherDashboard from './components/dashboard/TeacherDashboard';
import StudentList from './components/Students/StudentList';
import StudentDetails from './components/Students/StudentDetails';
import AttendanceMarking from './components/Attendance/AttendanceMarking';
import AttendanceReports from './components/Reports/AttendanceReports';
import MarksEntry from './components/Marks/MarksEntry';
import TeacherManagement from './components/dashboard/TeacherManagement';
import HodManagement from './components/dashboard/HodManagement';
import HODDashboard from './components/dashboard/HODDashboard';
import SubjectsFaculty from './components/hod/SubjectsFaculty';
import AttendanceTracking from './components/hod/AttendanceTracking';
import ReviewMarks from './components/hod/ReviewMarks';
import Reports from './components/Reports/Reports';
import FeeManagement from './components/Fees/FeeManagement';
import ClassFeeStructure from './components/Fees/ClassFeeStructure';
import AIPredictions from './components/AI/AIPredictions';
import QuickActionPanel from './components/quick-action/QuickActionPanel';
import Circulars from './components/Circulars/Circulars';
import StudentAnalyticsReport from './components/Reports/StudentAnalyticsReport';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// DashboardRouter based on role
const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'hod':
      return <HODDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/students"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'hod']}>
                <StudentList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/students/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'hod']}>
                <StudentDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'hod']}>
                <AttendanceMarking />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance/reports"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'hod']}>
                <AttendanceReports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/marks"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <MarksEntry />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teachers"
            element={
              <ProtectedRoute allowedRoles={['admin', 'hod']}>
                <TeacherManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hods"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <HodManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hod/subjects"
            element={
              <ProtectedRoute allowedRoles={['hod']}>
                <SubjectsFaculty />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/attendance"
            element={
              <ProtectedRoute allowedRoles={['hod']}>
                <AttendanceTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/marks"
            element={
              <ProtectedRoute allowedRoles={['hod']}>
                <ReviewMarks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/analytics"
            element={
              <ProtectedRoute allowedRoles={['hod']}>
                <div className="p-8 text-center text-gray-500">Department Analytics Coming Soon</div>
              </ProtectedRoute>
            }
          />


          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports/student-analytics"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'hod']}>
                <StudentAnalyticsReport />
              </ProtectedRoute>
            }
          />

          <Route
            path="/fees"
            element={
              <ProtectedRoute allowedRoles={['admin', 'hod']}>
                <FeeManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/class-fee-structure"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ClassFeeStructure />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ai-predictions"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'hod']}>
                <AIPredictions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quick-action"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'hod']}>
                <QuickActionPanel />
              </ProtectedRoute>
            }
          />

          <Route
            path="/circulars"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'hod']}>
                <Circulars />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;