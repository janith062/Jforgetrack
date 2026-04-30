import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import RoleGuard from './components/RoleGuard';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Forbidden from './pages/Forbidden';
import DevTokens from './pages/DevTokens';

// Mentor Pages
import Dashboard from './pages/Dashboard';
import MarkAttendance from './pages/MarkAttendance';
import History from './pages/History';
import Materials from './pages/Materials';
import UploadCSV from './pages/UploadCSV';
import SearchResults from './pages/SearchResults';
import Settings from './pages/Settings';

// Placeholders for Phase 4/5
const MyAttendance = () => <div className="text-display-lg">My Attendance</div>;
const Upcoming = () => <div className="text-display-lg">Upcoming Sessions</div>;
const StudentMaterials = () => <div className="text-display-lg">Materials (Read-Only)</div>;

function App() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div className="app-main flex items-center justify-center text-white font-bold text-xl">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/403" element={<Forbidden />} />
      <Route path="/dev-tokens" element={<DevTokens />} />

      {/* Main App Routes */}
      <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
        {/* Index Redirect based on role */}
        <Route index element={<RoleGuard allowedRoles={['mentor', 'student']}><Navigate to={role === 'mentor' ? '/dashboard' : '/me/attendance'} replace /></RoleGuard>} />

        {/* Mentor Routes */}
        <Route path="dashboard" element={<RoleGuard allowedRoles={['mentor']}><Dashboard /></RoleGuard>} />
        <Route path="attendance" element={<RoleGuard allowedRoles={['mentor']}><MarkAttendance /></RoleGuard>} />
        <Route path="history" element={<RoleGuard allowedRoles={['mentor']}><History /></RoleGuard>} />
        <Route path="materials" element={<RoleGuard allowedRoles={['mentor']}><Materials /></RoleGuard>} />
        <Route path="upload" element={<RoleGuard allowedRoles={['mentor']}><UploadCSV /></RoleGuard>} />
        <Route path="search" element={<RoleGuard allowedRoles={['mentor']}><SearchResults /></RoleGuard>} />
        <Route path="settings" element={<RoleGuard allowedRoles={['mentor']}><Settings /></RoleGuard>} />

        {/* Student Routes */}
        <Route path="me/attendance" element={<RoleGuard allowedRoles={['student']}><MyAttendance /></RoleGuard>} />
        <Route path="me/upcoming" element={<RoleGuard allowedRoles={['student']}><Upcoming /></RoleGuard>} />
        <Route path="me/materials" element={<RoleGuard allowedRoles={['student']}><StudentMaterials /></RoleGuard>} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
