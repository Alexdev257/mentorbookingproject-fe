import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/auth/LoginPage';
import TeachersPage from './pages/admin/TeachersPage';
import StudentsPage from './pages/admin/StudentsPage';
import SlotsPage from './pages/mentor/SlotsPage';
import BookingRequestsPage from './pages/mentor/BookingRequestsPage';
import BrowseMentorsPage from './pages/mentee/BrowseMentorsPage';
import BookMentorPage from './pages/mentee/BookMentorPage';
import MyBookingsPage from './pages/mentee/MyBookingsPage';
import './App.css';

// Placeholder Pages for now
const Dashboard = ({ title }: { title: string }) => {
  const { user } = useAuth();
  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Welcome back, {user?.fullName.split(' ')[0]}!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Here's what's happening with your {title.toLowerCase()} today.</p>
      </div>
      
      <div className="dashboard-grid">
        <div className="glass-card" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.1) 0%, rgba(31, 111, 235, 0.05) 100%)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Active Sessions</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            <span style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>12</span>
            <span style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: 600, paddingBottom: '0.5rem' }}>+2.5%</span>
          </div>
        </div>
        <div className="glass-card" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(219, 171, 9, 0.1) 0%, rgba(219, 171, 9, 0.05) 100%)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Pending Requests</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            <span style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>{title.includes('Admin') ? '4' : '3'}</span>
            <span style={{ color: 'var(--warning)', fontSize: '0.875rem', fontWeight: 600, paddingBottom: '0.5rem' }}>Attention needed</span>
          </div>
        </div>
        <div className="glass-card" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(63, 185, 80, 0.1) 0%, rgba(63, 185, 80, 0.05) 100%)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Completion Rate</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            <span style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>94%</span>
            <span style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: 600, paddingBottom: '0.5rem' }}>Excellent</span>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: '2.5rem', padding: '2.5rem', textAlign: 'center', borderStyle: 'dashed', borderWidth: '2px' }}>
        <h2 style={{ marginBottom: '1rem' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
           <button className="btn-primary" style={{ background: 'var(--bg-tertiary)' }}>View Reports</button>
           <button className="btn-primary">Manage Portal</button>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            
            {/* Admin Routes */}
            <Route path="admin/dashboard" element={<ProtectedRoute allowedRoles={[1]}><Dashboard title="Admin Dashboard" /></ProtectedRoute>} />
            <Route path="admin/teachers" element={<ProtectedRoute allowedRoles={[1]}><TeachersPage /></ProtectedRoute>} />
            <Route path="admin/students" element={<ProtectedRoute allowedRoles={[1]}><StudentsPage /></ProtectedRoute>} />
            
            {/* Mentor Routes */}
            <Route path="mentor/dashboard" element={<ProtectedRoute allowedRoles={[2]}><Dashboard title="Mentor Dashboard" /></ProtectedRoute>} />
            <Route path="mentor/slots" element={<ProtectedRoute allowedRoles={[2]}><SlotsPage /></ProtectedRoute>} />
            <Route path="mentor/bookings" element={<ProtectedRoute allowedRoles={[2]}><BookingRequestsPage /></ProtectedRoute>} />
            
            {/* Mentee Routes */}
            <Route path="mentee/dashboard" element={<ProtectedRoute allowedRoles={[3]}><Dashboard title="Mentee Dashboard" /></ProtectedRoute>} />
            <Route path="mentee/browse" element={<ProtectedRoute allowedRoles={[3]}><BrowseMentorsPage /></ProtectedRoute>} />
            <Route path="mentee/book/:mentorId" element={<ProtectedRoute allowedRoles={[3]}><BookMentorPage /></ProtectedRoute>} />
            <Route path="mentee/bookings" element={<ProtectedRoute allowedRoles={[3]}><MyBookingsPage /></ProtectedRoute>} />
            <Route path="mentee/reviews" element={<ProtectedRoute allowedRoles={[3]}><Dashboard title="My Reviews" /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
