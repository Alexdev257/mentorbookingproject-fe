import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/services';
import type { TeacherResponseDto } from '../../types';
import { Plus, Search, Edit2, Trash2, UserCircle } from 'lucide-react';
import { AddTeacherModal } from '../../components/admin/AddTeacherModal';
import { EditTeacherModal } from '../../components/admin/EditTeacherModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

const teachersPageLuminaCss = `
.teachers-page-lumina {
  --lumina-purple: #7b61ff;
  --lumina-purple-soft: rgba(123, 97, 255, 0.12);
  --lumina-purple-text: #5c4ad1;
  --lumina-surface: #ffffff;
  --lumina-border: #e8eaed;
  --lumina-text: #1a1d26;
  --lumina-muted: #6b7280;
  --lumina-shadow: 0 1px 3px rgba(15, 23, 42, 0.05), 0 6px 20px rgba(123, 97, 255, 0.06);
}

.teachers-page-lumina .admin-eyebrow {
  color: var(--lumina-purple);
}

.teachers-page-lumina .admin-title {
  background: none;
  -webkit-text-fill-color: var(--lumina-text);
  color: var(--lumina-text);
  -webkit-background-clip: unset;
  background-clip: border-box;
}

.teachers-page-lumina .admin-desc {
  color: var(--lumina-muted);
  max-width: none;
  white-space: nowrap;
}

@media (max-width: 960px) {
  .teachers-page-lumina .admin-desc {
    white-space: normal;
    max-width: 36rem;
  }
}

.teachers-page-lumina .admin-btn-primary {
  background: linear-gradient(135deg, #7b61ff 0%, #6346e8 100%);
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(123, 97, 255, 0.35);
  border: none;
}

.teachers-page-lumina .admin-btn-primary:hover:not(:disabled) {
  box-shadow: 0 6px 22px rgba(123, 97, 255, 0.45);
}

.teachers-page-lumina .admin-panel {
  border-radius: 18px;
  border: 1px solid var(--lumina-border);
  background: var(--lumina-surface);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: var(--lumina-shadow);
  overflow: hidden;
}

.teachers-page-lumina .admin-toolbar {
  padding: 1.1rem 1.35rem;
  border-bottom: 1px solid var(--lumina-border);
  background: #fafbfc;
}

.teachers-page-lumina .admin-search-wrap .input-field {
  background: #f3f4f6;
  border: 1px solid var(--lumina-border);
  border-radius: 14px;
  color: var(--lumina-text);
  padding-left: 2.75rem;
}

.teachers-page-lumina .admin-search-wrap .input-field:focus {
  border-color: rgba(123, 97, 255, 0.45);
  background: #ffffff;
  outline: none;
  box-shadow: 0 0 0 3px var(--lumina-purple-soft);
}

.teachers-page-lumina .admin-search-icon {
  color: var(--lumina-muted);
}

.teachers-page-lumina .admin-chip {
  background: #f3f4f6;
  border: 1px solid var(--lumina-border);
  color: var(--lumina-muted);
  border-radius: 12px;
}

.teachers-page-lumina .admin-table thead th {
  background: #f8f9fb;
  color: var(--lumina-muted);
  border-bottom: 1px solid var(--lumina-border);
  font-weight: 700;
}

.teachers-page-lumina .admin-table tbody tr {
  border-bottom: 1px solid var(--lumina-border);
  background: var(--lumina-surface);
}

.teachers-page-lumina .admin-table tbody tr:hover {
  background: rgba(123, 97, 255, 0.04);
}

.teachers-page-lumina .admin-table td {
  color: var(--lumina-text);
}

.teachers-page-lumina .teachers-lumina-muted {
  color: var(--lumina-muted) !important;
}

.teachers-page-lumina .teachers-lumina-cell-name {
  font-weight: 650;
  color: var(--lumina-text);
}

.teachers-page-lumina .teachers-lumina-cell-meta {
  font-size: 0.8125rem;
  color: var(--lumina-muted);
  margin-top: 0.1rem;
}

.teachers-page-lumina .admin-avatar {
  background: var(--lumina-purple-soft);
  color: var(--lumina-purple-text);
  border: 2px solid rgba(123, 97, 255, 0.22);
}

.teachers-page-lumina .admin-icon-btn {
  background: #ffffff;
  border: 1px solid var(--lumina-border);
  color: var(--lumina-muted);
  border-radius: 12px;
}

.teachers-page-lumina .admin-icon-btn:hover {
  color: var(--lumina-purple-text);
  background: var(--lumina-purple-soft);
  border-color: rgba(123, 97, 255, 0.3);
}

.teachers-page-lumina .status-active {
  background: rgba(34, 197, 94, 0.14);
  color: #15803d;
}

.teachers-page-lumina .status-inactive {
  background: rgba(248, 113, 113, 0.14);
  color: #b91c1c;
}

.teachers-page-lumina .admin-empty {
  color: var(--lumina-muted);
}

.teachers-page-lumina .admin-empty-icon {
  background: var(--lumina-purple-soft);
  color: var(--lumina-purple);
  border-radius: 14px;
}

.teachers-page-lumina .teachers-lumina-empty-title {
  font-weight: 600;
  color: var(--lumina-text);
  margin-bottom: 0.35rem;
}

.teachers-page-lumina .teachers-lumina-empty-sub {
  font-size: 0.875rem;
}

.teachers-page-lumina .admin-skeleton-bar {
  background: linear-gradient(
    90deg,
    #f3f4f6 0%,
    rgba(123, 97, 255, 0.1) 50%,
    #f3f4f6 100%
  );
  background-size: 200% 100%;
}
`;

const TeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState<TeacherResponseDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeacherResponseDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTeachers = async () => {
    try {
      const response = await adminApi.getAllTeachers(1, 100);
      if (response.isSuccess) {
        setTeachers(response.data.items);
      }
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const filteredTeachers = teachers.filter(
    (t) =>
      t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <style>{teachersPageLuminaCss}</style>
      <div className="admin-page teachers-page-lumina">
        <AdminPageHeader
          eyebrow="Quản trị"
          title="Giảng viên"
          description="Danh sách mentor trên hệ thống: tìm kiếm theo tên, email hoặc khoa. Thêm tài khoản mới khi cần."
          actions={
            <button type="button" className="admin-btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={20} strokeWidth={1.75} />
              Thêm giảng viên
            </button>
          }
        />

        <AddTeacherModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSuccess={() => {
            setLoading(true);
            void fetchTeachers();
          }}
        />

        <EditTeacherModal
          open={!!editTeacher}
          teacher={editTeacher}
          onClose={() => setEditTeacher(null)}
          onSuccess={() => {
            setLoading(true);
            void fetchTeachers();
          }}
        />

        <AdminConfirmDialog
          open={!!deleteTarget}
          title="Vô hiệu hóa giảng viên?"
          message={
            deleteTarget
              ? `Tài khoản "${deleteTarget.fullName}" sẽ được đánh dấu ngưng hoạt động (soft delete).`
              : ''
          }
          confirmLabel="Vô hiệu hóa"
          loading={deleteLoading}
          onCancel={() => !deleteLoading && setDeleteTarget(null)}
          onConfirm={async () => {
            if (!deleteTarget) return;
            setDeleteLoading(true);
            try {
              const res = await adminApi.deleteTeacher(deleteTarget.id);
              if (res.isSuccess) {
                setDeleteTarget(null);
                setLoading(true);
                await fetchTeachers();
              } else {
                window.alert(res.message || 'Không xóa được');
              }
            } catch {
              window.alert('Lỗi mạng hoặc máy chủ');
            } finally {
              setDeleteLoading(false);
            }
          }}
        />

        <div className="admin-panel">
          <div className="admin-toolbar">
            <div className="admin-search-wrap">
              <span className="admin-search-icon">
                <Search size={18} strokeWidth={1.75} />
              </span>
              <input
                type="text"
                className="input-field"
                placeholder="Tìm theo tên, email, khoa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Tìm giảng viên"
              />
            </div>
            <span className="admin-chip">
              {loading ? '…' : `${filteredTeachers.length} / ${teachers.length} hiển thị`}
            </span>
          </div>

          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Giảng viên</th>
                  <th>Khoa</th>
                  <th>Chuyên môn</th>
                  <th>Trạng thái</th>
                  <th style={{ width: '108px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="admin-skeleton" aria-busy="true">
                        <div className="admin-skeleton-bar" />
                        <div className="admin-skeleton-bar" style={{ maxWidth: 220 }} />
                        <div className="admin-skeleton-bar" style={{ maxWidth: 180 }} />
                      </div>
                    </td>
                  </tr>
                ) : filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="admin-empty">
                        <div className="admin-empty-icon">
                          <UserCircle size={28} strokeWidth={1.75} />
                        </div>
                        <p className="teachers-lumina-empty-title">Chưa có dữ liệu</p>
                        <p className="teachers-lumina-empty-sub">
                          Thử đổi từ khóa tìm kiếm hoặc thêm giảng viên mới.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div className="admin-avatar">
                            {teacher.avatarUrl ? (
                              <img src={teacher.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              teacher.fullName.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="teachers-lumina-cell-name">{teacher.fullName}</div>
                            <div className="teachers-lumina-cell-meta">{teacher.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="teachers-lumina-muted">{teacher.department || '—'}</td>
                      <td className="teachers-lumina-muted">{teacher.specialization || '—'}</td>
                      <td>
                        <span className={`status-badge ${teacher.isActive ? 'status-active' : 'status-inactive'}`}>
                          {teacher.isActive ? 'Hoạt động' : 'Ngưng'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="admin-icon-btn"
                            title="Chỉnh sửa"
                            onClick={() => setEditTeacher(teacher)}
                          >
                            <Edit2 size={16} strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn"
                            title="Vô hiệu hóa"
                            onClick={() => setDeleteTarget(teacher)}
                          >
                            <Trash2 size={16} strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeachersPage;
