import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/services';
import type { StudentResponseDto } from '../../types';
import { X, ImagePlus } from 'lucide-react';

interface EditStudentModalProps {
  open: boolean;
  student: StudentResponseDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({ open, student, onClose, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !student) return;
    setFullName(student.fullName);
    setStudentCode(student.studentCode ?? '');
    setIsActive(student.isActive);
    setAvatar(null);
    setError(null);
  }, [open, student]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('FullName', fullName.trim());
      if (studentCode.trim()) fd.append('StudentCode', studentCode.trim());
      fd.append('IsActive', isActive ? 'true' : 'false');
      if (avatar) fd.append('Avatar', avatar);

      const res = await adminApi.updateStudent(student.id, fd);
      if (res.isSuccess) {
        onSuccess();
        onClose();
      } else {
        const detail = res.listErrors?.map((x) => x.detail).filter(Boolean).join(' · ');
        setError(detail || res.message || 'Không cập nhật được');
      }
    } catch {
      setError('Lỗi mạng hoặc máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !student) return null;

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={handleClose}>
      <div className="admin-modal" role="dialog" aria-labelledby="edit-student-title" onClick={(ev) => ev.stopPropagation()}>
        <div className="admin-modal-accent" aria-hidden />
        <div className="admin-modal-body">
          <div className="admin-modal-head">
            <div>
              <h2 id="edit-student-title" className="admin-modal-title">
                Sửa sinh viên
              </h2>
              <p className="admin-modal-sub">
                Email: <strong>{student.email}</strong>
              </p>
            </div>
            <button type="button" className="admin-modal-close" onClick={handleClose} aria-label="Đóng">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {error ? <div className="admin-alert-error" style={{ marginBottom: '1rem' }}>{error}</div> : null}

            <div className="admin-form-grid admin-form-grid--2">
              <div className="admin-field-full">
                <label className="admin-label" htmlFor="edit-student-name">
                  Họ và tên *
                </label>
                <input
                  id="edit-student-name"
                  className="input-field"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="admin-field-full">
                <label className="admin-label" htmlFor="edit-student-code">
                  Mã sinh viên
                </label>
                <input
                  id="edit-student-code"
                  className="input-field"
                  type="text"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                />
              </div>
              <div className="admin-field-full">
                <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  Tài khoản đang hoạt động
                </label>
              </div>
              <div className="admin-field-full">
                <label className="admin-label" htmlFor="edit-student-avatar">
                  Ảnh đại diện mới (tùy chọn)
                </label>
                <div className="admin-file-zone">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
                    <ImagePlus size={20} color="var(--brand-primary)" />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      Để trống nếu giữ ảnh hiện tại
                    </span>
                  </div>
                  <input
                    id="edit-student-avatar"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
            </div>

            <div className="admin-modal-actions">
              <button type="button" className="admin-btn-secondary" onClick={handleClose}>
                Hủy
              </button>
              <button type="submit" className="admin-btn-primary" disabled={submitting}>
                {submitting ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
