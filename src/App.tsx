import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/auth/LoginPage';
import PolicyPage from './pages/public/PolicyPage';
import TeachersPage from './pages/admin/TeachersPage';
import StudentsPage from './pages/admin/StudentsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import SlotsPage from './pages/mentor/SlotsPage';
import BookingRequestsPage from './pages/mentor/BookingRequestsPage';
import MentorDashboardPage from './pages/mentor/MentorDashboardPage';
import MentorReviewsPage from './pages/mentor/MentorReviewsPage';
import MentorMeetingsPage from './pages/mentor/MentorMeetingsPage';
import BrowseMentorsPage from './pages/mentee/BrowseMentorsPage';
import BookMentorPage from './pages/mentee/BookMentorPage';
import MyBookingsPage from './pages/mentee/MyBookingsPage';
import MenteeDashboardPage from './pages/mentee/MenteeDashboardPage';
import MyReviewsPage from './pages/mentee/MyReviewsPage';
import MenteeMeetingsPage from './pages/mentee/MenteeMeetingsPage';
import './App.css';
import './admin-theme.css';

const HomeRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 1) return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 2) return <Navigate to="/mentor/dashboard" replace />;
  if (user?.role === 3) return <Navigate to="/mentee/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/policies" element={<PolicyPage />} />

          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<HomeRedirect />} />
            
            {/* Admin Routes */}
            <Route path="admin/dashboard" element={<ProtectedRoute allowedRoles={[1]}><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="admin/teachers" element={<ProtectedRoute allowedRoles={[1]}><TeachersPage /></ProtectedRoute>} />
            <Route path="admin/students" element={<ProtectedRoute allowedRoles={[1]}><StudentsPage /></ProtectedRoute>} />
            
            {/* Mentor Routes */}
            <Route path="mentor/dashboard" element={<ProtectedRoute allowedRoles={[2]}><MentorDashboardPage /></ProtectedRoute>} />
            <Route path="mentor/slots" element={<ProtectedRoute allowedRoles={[2]}><SlotsPage /></ProtectedRoute>} />
            <Route path="mentor/bookings" element={<ProtectedRoute allowedRoles={[2]}><BookingRequestsPage /></ProtectedRoute>} />
            <Route path="mentor/reviews" element={<ProtectedRoute allowedRoles={[2]}><MentorReviewsPage /></ProtectedRoute>} />
            <Route path="mentor/meetings" element={<ProtectedRoute allowedRoles={[2]}><MentorMeetingsPage /></ProtectedRoute>} />
            
            {/* Mentee Routes */}
            <Route path="mentee/dashboard" element={<ProtectedRoute allowedRoles={[3]}><MenteeDashboardPage /></ProtectedRoute>} />
            <Route path="mentee/browse" element={<ProtectedRoute allowedRoles={[3]}><BrowseMentorsPage /></ProtectedRoute>} />
            <Route path="mentee/book/:mentorId" element={<ProtectedRoute allowedRoles={[3]}><BookMentorPage /></ProtectedRoute>} />
            <Route path="mentee/bookings" element={<ProtectedRoute allowedRoles={[3]}><MyBookingsPage /></ProtectedRoute>} />
            <Route path="mentee/reviews" element={<ProtectedRoute allowedRoles={[3]}><MyReviewsPage /></ProtectedRoute>} />
            <Route path="mentee/meetings" element={<ProtectedRoute allowedRoles={[3]}><MenteeMeetingsPage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
