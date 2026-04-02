import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserCheck, Users, ChevronRight, Shield } from 'lucide-react';

/* Giao diện tối giản, ưu tiên viền & type — tránh stack gradient/shadow kiểu template */
const adminDashboardLuminaCss = `
.admin-dashboard-lumina {
  --dash-fg: #0f172a;
  --dash-muted: #64748b;
  --dash-line: #e2e8f0;
  --dash-line-strong: #cbd5e1;
  --dash-accent: #4f46e5;
  --dash-surface: #ffffff;
  --dash-subtle: #f8fafc;
}

.admin-dashboard-lumina .admin-dash-welcome {
  margin-bottom: 1.5rem;
  padding: 1.5rem 1.5rem 1.6rem;
  background: var(--dash-surface);
  border: 1px solid var(--dash-line);
  border-radius: 10px;
}

.admin-dashboard-lumina .admin-dash-welcome .admin-eyebrow {
  color: var(--dash-muted);
  font-weight: 600;
  font-size: 0.6875rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.admin-dashboard-lumina .admin-dash-welcome .admin-title {
  background: none;
  -webkit-text-fill-color: var(--dash-fg);
  color: var(--dash-fg);
  -webkit-background-clip: unset;
  background-clip: border-box;
  font-size: clamp(1.5rem, 2.5vw, 1.75rem);
  font-weight: 700;
  letter-spacing: -0.028em;
  line-height: 1.2;
  margin-bottom: 0.45rem;
}

.admin-dashboard-lumina .admin-dash-welcome .admin-desc {
  color: var(--dash-muted);
  font-size: 0.9375rem;
  line-height: 1.55;
  max-width: none;
  white-space: nowrap;
}

@media (max-width: 960px) {
  .admin-dashboard-lumina .admin-dash-welcome .admin-desc {
    white-space: normal;
    max-width: 40rem;
  }
}

.admin-dashboard-lumina .admin-dash-notice.admin-panel {
  border-radius: 10px;
  border: 1px solid var(--dash-line);
  background: var(--dash-subtle);
  box-shadow: none;
  padding: 1rem 1.25rem;
  margin-bottom: 1.75rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  border-left: 3px solid var(--dash-accent);
}

.admin-dashboard-lumina .admin-dash-notice .admin-shortcut-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: var(--dash-surface);
  border: 1px solid var(--dash-line);
  color: var(--dash-accent);
  box-shadow: none;
}

.admin-dashboard-lumina .admin-dash-panel-body {
  flex: 1;
  min-width: 200px;
}

.admin-dashboard-lumina .admin-dash-panel-title {
  font-size: 0.9375rem;
  font-weight: 600;
  margin-bottom: 0.2rem;
  color: var(--dash-fg);
}

.admin-dashboard-lumina .admin-dash-panel-text {
  font-size: 0.8125rem;
  color: var(--dash-muted);
  line-height: 1.5;
}

.admin-dashboard-lumina .admin-dash-section-title {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dash-muted);
  margin: 0 0 0.65rem;
}

.admin-dashboard-lumina .admin-dash-shortcuts-grid.admin-shortcuts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  width: 100%;
}

@media (max-width: 700px) {
  .admin-dashboard-lumina .admin-dash-shortcuts-grid.admin-shortcuts {
    grid-template-columns: 1fr;
  }
}

.admin-dashboard-lumina .admin-dash-row-link.admin-shortcut-card {
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  padding: 1.45rem 1.35rem;
  min-height: 5.35rem;
  width: 100%;
  box-sizing: border-box;
  border-radius: 10px;
  border: 1px solid var(--dash-line);
  background: var(--dash-surface);
  box-shadow: none;
  transition: background 0.15s ease, border-color 0.15s ease;
  text-decoration: none;
  color: inherit;
}

.admin-dashboard-lumina .admin-dash-row-link:hover {
  background: var(--dash-subtle);
  border-color: var(--dash-line-strong);
  transform: none;
  box-shadow: none;
}

.admin-dashboard-lumina .admin-dash-row-link .admin-shortcut-icon {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  flex-shrink: 0;
}

.admin-dashboard-lumina .admin-dash-lumina-icon--teachers {
  background: var(--dash-subtle);
  color: var(--dash-accent);
  border: 1px solid var(--dash-line);
  box-shadow: none;
}

.admin-dashboard-lumina .admin-dash-lumina-icon--students {
  background: var(--dash-subtle);
  color: #0d9488;
  border: 1px solid var(--dash-line);
  box-shadow: none;
}

.admin-dashboard-lumina .admin-dash-row-link .admin-dash-card-body {
  flex: 1;
  min-width: 0;
  padding: 0;
}

.admin-dashboard-lumina .admin-dash-row-link h3 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--dash-fg);
  margin: 0 0 0.15rem;
  letter-spacing: -0.02em;
}

.admin-dashboard-lumina .admin-dash-row-link p {
  font-size: 0.8125rem;
  color: var(--dash-muted);
  line-height: 1.45;
  margin: 0;
}

.admin-dashboard-lumina .admin-dash-row-link .admin-dash-chevron {
  flex-shrink: 0;
  color: var(--dash-muted);
  opacity: 0.7;
}

.admin-dashboard-lumina .admin-dash-row-link:hover .admin-dash-chevron {
  color: var(--dash-fg);
  opacity: 1;
  transform: none;
  background: none;
  width: auto;
  height: auto;
  border-radius: 0;
}
`;

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const first = user?.fullName?.split(/\s+/)[0] ?? 'Admin';

  return (
    <>
      <style>{adminDashboardLuminaCss}</style>
      <div className="admin-page admin-dashboard-lumina">
        <div className="admin-dash-hero admin-dash-welcome">
          <p className="admin-eyebrow">Bảng điều khiển</p>
          <h1 className="admin-title">Xin chào, {first}</h1>
          <p className="admin-desc">
            Quản lý tài khoản giảng viên và sinh viên, theo dõi hoạt động nền tảng từ một giao diện gọn gàng.
          </p>
        </div>

        <div className="admin-panel admin-dash-notice">
          <div className="admin-shortcut-icon" aria-hidden>
            <Shield size={22} strokeWidth={1.75} />
          </div>
          <div className="admin-dash-panel-body">
            <h2 className="admin-dash-panel-title">Quyền quản trị</h2>
            <p className="admin-dash-panel-text">
              Bạn đang đăng nhập với vai trò Admin. Các thao tác dưới đây chỉ dành cho người quản lý hệ thống.
            </p>
          </div>
        </div>

        <p className="admin-dash-section-title">Truy cập nhanh</p>
        <div className="admin-shortcuts admin-dash-shortcuts-grid">
          <Link to="/admin/teachers" className="admin-shortcut-card admin-dash-row-link">
            <div className="admin-shortcut-icon admin-dash-lumina-icon--teachers">
              <UserCheck size={22} strokeWidth={1.75} />
            </div>
            <div className="admin-dash-card-body">
              <h3>Giảng viên</h3>
              <p>Xem danh sách, tìm kiếm và thêm tài khoản mentor mới.</p>
            </div>
            <ChevronRight size={18} strokeWidth={2} className="admin-dash-chevron" />
          </Link>

          <Link to="/admin/students" className="admin-shortcut-card admin-dash-row-link">
            <div className="admin-shortcut-icon admin-dash-lumina-icon--students">
              <Users size={22} strokeWidth={1.75} />
            </div>
            <div className="admin-dash-card-body">
              <h3>Sinh viên</h3>
              <p>Quản lý mã SV, trạng thái và tạo tài khoản mentee.</p>
            </div>
            <ChevronRight size={18} strokeWidth={2} className="admin-dash-chevron" />
          </Link>
        </div>
      </div>
    </>
  );
};

export default AdminDashboardPage;
