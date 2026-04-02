import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, UserCheck, Calendar, BookOpen, LogOut, Star, Video } from 'lucide-react';

const layoutShellCss = `
.layout-shell {
  --lumina-purple: #6366f1;
  --lumina-purple-soft: rgba(99, 102, 241, 0.14);
  --lumina-purple-text: #4f46e5;
  --lumina-border: #e2e8f0;
  --lumina-text: #1e293b;
  --lumina-text-muted: #64748b;
  --lumina-canvas: #f8f9fd;
}

.layout-shell.app-container {
  min-height: 100vh;
}

.layout-shell .sidebar {
  width: 268px;
  background: #ffffff;
  border-right: 1px solid var(--lumina-border);
  padding: 1.5rem 1rem 1.25rem;
  gap: 1.25rem;
  box-shadow: 4px 0 32px rgba(99, 102, 241, 0.06);
}

.layout-shell .sidebar.sidebar--admin,
.layout-shell .sidebar.sidebar--mentor {
  border-right: 1px solid var(--lumina-border);
  box-shadow: none;
}

.layout-shell .main-content {
  background: var(--lumina-canvas);
  padding: 1.75rem 2rem;
}

.layout-shell .layout-sidebar-brand h2 {
  color: var(--lumina-text);
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.layout-shell .layout-sidebar-brand-icon {
  padding: 0.5rem;
  background: var(--lumina-purple-soft);
  border-radius: 18px;
  color: var(--lumina-purple);
  display: flex;
  align-items: center;
  justify-content: center;
}

.layout-shell .layout-nav {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.layout-shell .layout-nav-label {
  color: var(--lumina-text-muted);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  margin: 1rem 0 0.4rem 0.5rem;
  letter-spacing: 0.08em;
}

.layout-shell .nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 1rem;
  border-radius: 18px;
  color: var(--lumina-text-muted);
  font-weight: 500;
  font-size: 0.9375rem;
  border: 1px solid transparent;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.layout-shell .nav-link:hover {
  background: #f3f4f6;
  color: var(--lumina-text);
}

.layout-shell .nav-link.active {
  background: var(--lumina-purple-soft);
  color: var(--lumina-purple-text);
  border-color: transparent;
  box-shadow: inset 3px 0 0 0 var(--lumina-purple);
  padding-left: calc(1rem - 3px);
  font-weight: 600;
}

.layout-shell .layout-user-rail {
  border-top: 1px solid var(--lumina-border);
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.layout-shell .layout-user-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 0.5rem;
}

.layout-shell .layout-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--lumina-purple-soft);
  color: var(--lumina-purple-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  flex-shrink: 0;
  border: 1px solid var(--lumina-border);
}

.layout-shell .layout-user-meta {
  overflow: hidden;
  min-width: 0;
}

.layout-shell .layout-user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--lumina-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.layout-shell .layout-user-role {
  font-size: 0.75rem;
  color: var(--lumina-text-muted);
}

.layout-shell button.nav-link {
  width: 100%;
  border: 1px solid var(--lumina-border);
  background: #ffffff;
  color: var(--lumina-text-muted);
  justify-content: center;
  border-radius: 18px;
}

.layout-shell button.nav-link:hover {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}
`;

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <style>{layoutShellCss}</style>
      <div className="app-container layout-shell">
        <aside
          className={`sidebar${user?.role === 1 ? ' sidebar--admin' : ''}${user?.role === 2 ? ' sidebar--mentor' : ''}`}
        >
          <div className="sidebar-brand layout-sidebar-brand">
            <h2>
              <div className="layout-sidebar-brand-icon">
                <BookOpen size={20} strokeWidth={1.75} />
              </div>
              MentorBooking
            </h2>
          </div>

          <nav className="layout-nav">
            {/* Admin Links */}
            {user?.role === 1 && (
              <>
                <p className="layout-nav-label">Quản trị</p>
                <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <LayoutDashboard size={20} strokeWidth={1.75} /> Tổng quan
                </NavLink>
                <NavLink to="/admin/teachers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <UserCheck size={20} strokeWidth={1.75} /> Giảng viên
                </NavLink>
                <NavLink to="/admin/students" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Users size={20} strokeWidth={1.75} /> Sinh viên
                </NavLink>
              </>
            )}

            {/* Mentor/Teacher Links */}
            {user?.role === 2 && (
              <>
                <p className="layout-nav-label">Mentor</p>
                <NavLink to="/mentor/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <LayoutDashboard size={20} strokeWidth={1.75} /> Tổng quan
                </NavLink>
                <NavLink to="/mentor/slots" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Calendar size={20} strokeWidth={1.75} /> Lịch trống
                </NavLink>
                <NavLink
                  to="/mentor/bookings"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  title="Chấp nhận / từ chối / hủy booking từ sinh viên"
                >
                  <BookOpen size={20} strokeWidth={1.75} /> Duyệt booking
                </NavLink>
                <NavLink to="/mentor/reviews" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Star size={20} strokeWidth={1.75} /> Đánh giá nhận được
                </NavLink>
                <NavLink to="/mentor/meetings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Video size={20} strokeWidth={1.75} /> Meetings
                </NavLink>
              </>
            )}

            {/* Mentee/Student Links */}
            {user?.role === 3 && (
              <>
                <p className="layout-nav-label">Student</p>
                <NavLink to="/mentee/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <LayoutDashboard size={20} strokeWidth={1.75} /> Dashboard
                </NavLink>
                <NavLink to="/mentee/browse" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Users size={20} strokeWidth={1.75} /> Browse Mentors
                </NavLink>
                <NavLink to="/mentee/bookings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Calendar size={20} strokeWidth={1.75} /> My Bookings
                </NavLink>
                <NavLink to="/mentee/reviews" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Star size={20} strokeWidth={1.75} /> My Reviews
                </NavLink>
                <NavLink to="/mentee/meetings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Video size={20} strokeWidth={1.75} /> My Meetings
                </NavLink>
              </>
            )}
          </nav>

          <div className="layout-user-rail">
            <div className="layout-user-row">
              <div className="layout-user-avatar">{user?.fullName?.charAt(0)}</div>
              <div className="layout-user-meta">
                <p className="layout-user-name">{user?.fullName}</p>
                <p className="layout-user-role">
                  {user?.role === 1 ? 'Admin' : user?.role === 2 ? 'Mentor' : 'Student'}
                </p>
              </div>
            </div>
            <button onClick={handleLogout} className="nav-link" type="button">
              <LogOut size={20} strokeWidth={1.75} /> Logout
            </button>
          </div>
        </aside>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default Layout;
