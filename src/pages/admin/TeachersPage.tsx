import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/services';
import type { TeacherResponseDto } from '../../types';
import { Plus, Search, Edit2, Trash2, UserCircle } from 'lucide-react';
import { AddTeacherModal } from '../../components/admin/AddTeacherModal';
import { EditTeacherModal } from '../../components/admin/EditTeacherModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

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
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Quản trị"
        title="Giảng viên"
        description="Danh sách mentor trên hệ thống: tìm kiếm theo tên, email hoặc khoa. Thêm tài khoản mới khi cần."
        actions={
          <button type="button" className="admin-btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={20} strokeWidth={2.25} />
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
              <Search size={18} />
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
                        <UserCircle size={28} />
                      </div>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                        Chưa có dữ liệu
                      </p>
                      <p style={{ fontSize: '0.875rem' }}>
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
                          <div style={{ fontWeight: 650 }}>{teacher.fullName}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                            {teacher.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{teacher.department || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{teacher.specialization || '—'}</td>
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
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="admin-icon-btn"
                          title="Vô hiệu hóa"
                          onClick={() => setDeleteTarget(teacher)}
                        >
                          <Trash2 size={16} />
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
  );
};

export default TeachersPage;
