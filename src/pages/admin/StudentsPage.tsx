import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/services';
import type { StudentResponseDto } from '../../types';
import { Plus, Search, Edit2, Trash2, GraduationCap } from 'lucide-react';
import { AddStudentModal } from '../../components/admin/AddStudentModal';
import { EditStudentModal } from '../../components/admin/EditStudentModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

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
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Quản trị"
        title="Sinh viên"
        description="Theo dõi mentee: mã sinh viên, email và trạng thái tài khoản. Thêm sinh viên mới khi cần."
        actions={
          <button type="button" className="admin-btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={20} strokeWidth={2.25} />
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
              <Search size={18} />
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
                        <GraduationCap size={28} />
                      </div>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                        Chưa có dữ liệu
                      </p>
                      <p style={{ fontSize: '0.875rem' }}>Thử đổi bộ lọc hoặc thêm sinh viên mới.</p>
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
                            <GraduationCap size={20} color="var(--brand-primary)" />
                          )}
                        </div>
                        <div style={{ fontWeight: 650 }}>{student.fullName}</div>
                      </div>
                    </td>
                    <td>
                      <span className="code-pill">{student.studentCode || '—'}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{student.email}</td>
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
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="admin-icon-btn"
                          title="Vô hiệu hóa"
                          onClick={() => setDeleteTarget(student)}
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

export default StudentsPage;
