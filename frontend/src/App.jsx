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
import Reports from './components/Reports/Reports';
import FeeManagement from './components/Fees/FeeManagement';
import ClassFeeStructure from './components/Fees/ClassFeeStructure';
import AIPredictions from './components/AI/AIPredictions';
import QuickActionPanel from './components/quick-action/QuickActionPanel';
import Circulars from './components/Circulars/Circulars';
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
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <StudentList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/students/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <StudentDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <AttendanceMarking />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance/reports"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
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
              <ProtectedRoute allowedRoles={['admin']}>
                <TeacherManagement />
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
            path="/fees"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
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
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <AIPredictions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quick-action"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <QuickActionPanel />
              </ProtectedRoute>
            }
          />

          <Route
            path="/circulars"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
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