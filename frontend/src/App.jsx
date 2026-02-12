import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import AdminDashboard from './components/dashboard/AdminDashboard';
import TeacherDashboard from './components/dashboard/TeacherDashboard';
import ParentDashboard from './components/dashboard/ParentDashboard';
import ChildPerformance from './components/dashboard/ChildPerformance';
import StudentList from './components/Students/StudentList';
import StudentDetails from './components/Students/StudentDetails';
import AttendanceMarking from './components/Attendance/AttendanceMarking';
import AttendanceReports from './components/Reports/AttendanceReports';
import MarksEntry from './components/Marks/MarksEntry';
import TeacherManagement from './components/Dashboard/TeacherManagement';
import Reports from './components/Reports/Reports';
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
    case 'parent':
      return <ParentDashboard />;
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
            path="/child-performance/:id"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ChildPerformance />
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;