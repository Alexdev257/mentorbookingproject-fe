import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/services';
import type { StudentResponseDto } from '../../types';
import { Plus, Search, Edit2, Trash2, GraduationCap } from 'lucide-react';
import { AddStudentModal } from '../../components/admin/AddStudentModal';
import { EditStudentModal } from '../../components/admin/EditStudentModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

const studentsPageLuminaCss = `
.students-page-lumina {
  --lumina-purple: #7c3aed;
  --lumina-purple-soft: rgba(124, 58, 237, 0.12);
  --lumina-purple-text: #6d28d9;
  --lumina-surface: #ffffff;
  --lumina-border: #e5e7eb;
  --lumina-text: #111827;
  --lumina-muted: #6b7280;
  --lumina-shadow: 0 1px 3px rgba(15, 23, 42, 0.05), 0 6px 20px rgba(124, 58, 237, 0.06);
}

.students-page-lumina .admin-eyebrow {
  color: var(--lumina-purple);
}

.students-page-lumina .admin-title {
  background: none;
  -webkit-text-fill-color: var(--lumina-text);
  color: var(--lumina-text);
  -webkit-background-clip: unset;
  background-clip: border-box;
}

.students-page-lumina .admin-desc {
  color: var(--lumina-muted);
  max-width: none;
  white-space: nowrap;
}

@media (max-width: 960px) {
  .students-page-lumina .admin-desc {
    white-space: normal;
    max-width: 36rem;
  }
}

.students-page-lumina .admin-btn-primary {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.35);
  border: none;
}

.students-page-lumina .admin-btn-primary:hover:not(:disabled) {
  box-shadow: 0 6px 22px rgba(124, 58, 237, 0.45);
}

.students-page-lumina .admin-panel {
  border-radius: 20px;
  border: 1px solid var(--lumina-border);
  background: var(--lumina-surface);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: var(--lumina-shadow);
  overflow: hidden;
}

.students-page-lumina .admin-toolbar {
  padding: 1.1rem 1.35rem;
  border-bottom: 1px solid var(--lumina-border);
  background: #f9fafb;
}

.students-page-lumina .admin-search-wrap .input-field {
  background: #f3f4f6;
  border: 1px solid var(--lumina-border);
  border-radius: 999px;
  color: var(--lumina-text);
  padding-left: 2.75rem;
}

.students-page-lumina .admin-search-wrap .input-field:focus {
  border-color: rgba(124, 58, 237, 0.45);
  background: #ffffff;
  outline: none;
  box-shadow: 0 0 0 3px var(--lumina-purple-soft);
}

.students-page-lumina .admin-search-icon {
  color: var(--lumina-muted);
}

.students-page-lumina .admin-chip {
  background: #f3f4f6;
  border: 1px solid var(--lumina-border);
  color: var(--lumina-muted);
  border-radius: 12px;
}

.students-page-lumina .admin-table thead th {
  background: #f3f4f6;
  color: var(--lumina-muted);
  border-bottom: 1px solid var(--lumina-border);
  font-weight: 700;
}

.students-page-lumina .admin-table tbody tr {
  border-bottom: 1px solid var(--lumina-border);
  background: var(--lumina-surface);
}

.students-page-lumina .admin-table tbody tr:hover {
  background: rgba(124, 58, 237, 0.04);
}

.students-page-lumina .admin-table td {
  color: var(--lumina-text);
  padding-top: 1.05rem;
  padding-bottom: 1.05rem;
}

.students-page-lumina .students-lumina-muted {
  color: var(--lumina-muted) !important;
}

.students-page-lumina .students-lumina-cell-name {
  font-weight: 650;
  color: var(--lumina-text);
}

.students-page-lumina .admin-avatar,
.students-page-lumina .admin-avatar--square {
  background: var(--lumina-purple-soft);
  border: 2px solid rgba(124, 58, 237, 0.2);
  border-radius: 14px;
}

.students-page-lumina .admin-avatar--square svg {
  color: var(--lumina-purple);
}

.students-page-lumina .code-pill {
  font-family: ui-monospace, monospace;
  background: rgba(124, 58, 237, 0.1);
  color: var(--lumina-purple-text);
  border: 1px solid rgba(124, 58, 237, 0.22);
  border-radius: 10px;
}

.students-page-lumina .admin-icon-btn {
  background: #ffffff;
  border: 1px solid var(--lumina-border);
  color: var(--lumina-muted);
  border-radius: 12px;
}

.students-page-lumina .admin-icon-btn:hover {
  color: var(--lumina-purple-text);
  background: var(--lumina-purple-soft);
  border-color: rgba(124, 58, 237, 0.3);
}

.students-page-lumina .status-active {
  background: var(--lumina-purple);
  color: #ffffff;
}

.students-page-lumina .status-inactive {
  background: rgba(248, 113, 113, 0.14);
  color: #b91c1c;
}

.students-page-lumina .admin-empty {
  color: var(--lumina-muted);
}

.students-page-lumina .admin-empty-icon {
  background: var(--lumina-purple-soft);
  color: var(--lumina-purple);
  border-radius: 16px;
}

.students-page-lumina .students-lumina-empty-title {
  font-weight: 600;
  color: var(--lumina-text);
  margin-bottom: 0.35rem;
}

.students-page-lumina .students-lumina-empty-sub {
  font-size: 0.875rem;
}

.students-page-lumina .admin-skeleton-bar {
  background: linear-gradient(
    90deg,
    #f3f4f6 0%,
    rgba(124, 58, 237, 0.1) 50%,
    #f3f4f6 100%
  );
  background-size: 200% 100%;
}
`;

const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<StudentResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<StudentResponseDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentResponseDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      const response = await adminApi.getAllStudents(1, 100);
      if (response.isSuccess) {
        setStudents(response.data.items);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <style>{studentsPageLuminaCss}</style>
      <div className="admin-page students-page-lumina">
        <AdminPageHeader
          eyebrow="Quản trị"
          title="Sinh viên"
          description="Theo dõi mentee: mã sinh viên, email và trạng thái tài khoản. Thêm sinh viên mới khi cần."
          actions={
            <button type="button" className="admin-btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={20} strokeWidth={1.75} />
              Thêm sinh viên
            </button>
          }
        />

        <AddStudentModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSuccess={() => {
            setLoading(true);
            void fetchStudents();
          }}
        />

        <EditStudentModal
          open={!!editStudent}
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSuccess={() => {
            setLoading(true);
            void fetchStudents();
          }}
        />

        <AdminConfirmDialog
          open={!!deleteTarget}
          title="Vô hiệu hóa sinh viên?"
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
              const res = await adminApi.deleteStudent(deleteTarget.id);
              if (res.isSuccess) {
                setDeleteTarget(null);
                setLoading(true);
                await fetchStudents();
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
                placeholder="Tìm theo tên, email, mã SV..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Tìm sinh viên"
              />
            </div>
            <span className="admin-chip">
              {loading ? '…' : `${filteredStudents.length} / ${students.length} hiển thị`}
            </span>
          </div>

          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sinh viên</th>
                  <th>Mã SV</th>
                  <th>Email</th>
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
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="admin-empty">
                        <div className="admin-empty-icon">
                          <GraduationCap size={28} strokeWidth={1.75} />
                        </div>
                        <p className="students-lumina-empty-title">Chưa có dữ liệu</p>
                        <p className="students-lumina-empty-sub">Thử đổi bộ lọc hoặc thêm sinh viên mới.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div className="admin-avatar admin-avatar--square">
                            {student.avatarUrl ? (
                              <img src={student.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <GraduationCap size={20} strokeWidth={1.75} />
                            )}
                          </div>
                          <div className="students-lumina-cell-name">{student.fullName}</div>
                        </div>
                      </td>
                      <td>
                        <span className="code-pill">{student.studentCode || '—'}</span>
                      </td>
                      <td className="students-lumina-muted">{student.email}</td>
                      <td>
                        <span className={`status-badge ${student.isActive ? 'status-active' : 'status-inactive'}`}>
                          {student.isActive ? 'Hoạt động' : 'Ngưng'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="admin-icon-btn"
                            title="Chỉnh sửa"
                            onClick={() => setEditStudent(student)}
                          >
                            <Edit2 size={16} strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn"
                            title="Vô hiệu hóa"
                            onClick={() => setDeleteTarget(student)}
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

export default StudentsPage;
