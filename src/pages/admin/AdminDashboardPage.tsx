import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserCheck, Users, ChevronRight, Shield } from 'lucide-react';

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const first = user?.fullName?.split(/\s+/)[0] ?? 'Admin';

  return (
    <div className="admin-page">
      <div className="admin-dash-hero">
        <p className="admin-eyebrow">Bảng điều khiển</p>
        <h1 className="admin-title">Xin chào, {first}</h1>
        <p className="admin-desc">
          Quản lý tài khoản giảng viên và sinh viên, theo dõi hoạt động nền tảng từ một giao diện gọn gàng.
        </p>
      </div>

      <div
        className="admin-panel"
        style={{
          padding: '1.25rem 1.35rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div
          className="admin-shortcut-icon"
          style={{
            background: 'linear-gradient(135deg, rgba(88,166,255,0.25) 0%, rgba(31,111,235,0.12) 100%)',
          }}
        >
          <Shield size={26} color="var(--brand-primary)" />
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Quyền quản trị</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Bạn đang đăng nhập với vai trò Admin. Các thao tác dưới đây chỉ dành cho người quản lý hệ thống.
          </p>
        </div>
      </div>

      <p className="admin-eyebrow" style={{ marginBottom: '0.75rem' }}>
        Truy cập nhanh
      </p>
      <div className="admin-shortcuts">
        <Link to="/admin/teachers" className="admin-shortcut-card">
          <div
            className="admin-shortcut-icon"
            style={{
              background: 'linear-gradient(135deg, rgba(88,166,255,0.2) 0%, rgba(88,166,255,0.05) 100%)',
            }}
          >
            <UserCheck size={26} color="var(--brand-primary)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3>Giảng viên</h3>
            <p>Xem danh sách, tìm kiếm và thêm tài khoản mentor mới.</p>
          </div>
          <ChevronRight size={22} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </Link>

        <Link to="/admin/students" className="admin-shortcut-card">
          <div
            className="admin-shortcut-icon"
            style={{
              background: 'linear-gradient(135deg, rgba(63,185,80,0.2) 0%, rgba(63,185,80,0.05) 100%)',
            }}
          >
            <Users size={26} color="var(--success)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3>Sinh viên</h3>
            <p>Quản lý mã SV, trạng thái và tạo tài khoản mentee.</p>
          </div>
          <ChevronRight size={22} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
