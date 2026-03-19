import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, UserCheck, Calendar, BookOpen, LogOut, Star } from 'lucide-react';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '6px', background: 'var(--brand-gradient)', borderRadius: '8px' }}>
              <BookOpen size={20} />
            </div>
            MentorBooking
          </h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {/* Admin Links */}
          {user?.role === 1 && (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', margin: '1rem 0 0.5rem' }}>Admin</p>
              <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={20} /> Dashboard
              </NavLink>
              <NavLink to="/admin/teachers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <UserCheck size={20} /> Teachers
              </NavLink>
              <NavLink to="/admin/students" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Users size={20} /> Students
              </NavLink>
            </>
          )}

          {/* Mentor/Teacher Links */}
          {user?.role === 2 && (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', margin: '1rem 0 0.5rem' }}>Mentor</p>
              <NavLink to="/mentor/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={20} /> Dashboard
              </NavLink>
              <NavLink to="/mentor/slots" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Calendar size={20} /> My Slots
              </NavLink>
              <NavLink to="/mentor/bookings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <BookOpen size={20} /> Requests
              </NavLink>
            </>
          )}

          {/* Mentee/Student Links */}
          {user?.role === 3 && (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', margin: '1rem 0 0.5rem' }}>Student</p>
              <NavLink to="/mentee/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={20} /> Dashboard
              </NavLink>
              <NavLink to="/mentee/browse" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Users size={20} /> Browse Mentors
              </NavLink>
              <NavLink to="/mentee/bookings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Calendar size={20} /> My Bookings
              </NavLink>
              <NavLink to="/mentee/reviews" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Star size={20} /> My Reviews
              </NavLink>
            </>
          )}
        </nav>

        <div style={{ borderTop: '1px solid var(--bg-tertiary)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifySelf: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
              {user?.fullName?.charAt(0)}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.fullName}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {user?.role === 1 ? 'Admin' : user?.role === 2 ? 'Mentor' : 'Student'}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="nav-link" style={{ width: '100%', border: 'none', background: 'transparent' }}>
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
