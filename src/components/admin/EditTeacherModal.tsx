import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/services';
import type { TeacherResponseDto } from '../../types';
import { X, ImagePlus } from 'lucide-react';

interface EditTeacherModalProps {
  open: boolean;
  teacher: TeacherResponseDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditTeacherModal: React.FC<EditTeacherModalProps> = ({ open, teacher, onClose, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !teacher) return;
    setFullName(teacher.fullName);
    setDepartment(teacher.department ?? '');
    setSpecialization(teacher.specialization ?? '');
    setIsActive(teacher.isActive);
    setAvatar(null);
    setError(null);
  }, [open, teacher]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('FullName', fullName.trim());
      if (department.trim()) fd.append('Department', department.trim());
      if (specialization.trim()) fd.append('Specialization', specialization.trim());
      fd.append('IsActive', isActive ? 'true' : 'false');
      if (avatar) fd.append('Avatar', avatar);

      const res = await adminApi.updateTeacher(teacher.id, fd);
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

  if (!open || !teacher) return null;

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={handleClose}>
      <div className="admin-modal" role="dialog" aria-labelledby="edit-teacher-title" onClick={(ev) => ev.stopPropagation()}>
        <div className="admin-modal-accent" aria-hidden />
        <div className="admin-modal-body">
          <div className="admin-modal-head">
            <div>
              <h2 id="edit-teacher-title" className="admin-modal-title">
                Sửa giảng viên
              </h2>
              <p className="admin-modal-sub">
                Email đăng nhập: <strong>{teacher.email}</strong> (không đổi từ đây)
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
                <label className="admin-label" htmlFor="edit-teacher-name">
                  Họ và tên *
                </label>
                <input
                  id="edit-teacher-name"
                  className="input-field"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label className="admin-label" htmlFor="edit-teacher-dept">
                  Khoa / bộ môn
                </label>
                <input
                  id="edit-teacher-dept"
                  className="input-field"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
              <div>
                <label className="admin-label" htmlFor="edit-teacher-spec">
                  Chuyên môn
                </label>
                <input
                  id="edit-teacher-spec"
                  className="input-field"
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                />
              </div>
              <div className="admin-field-full">
                <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  Tài khoản đang hoạt động
                </label>
              </div>
              <div className="admin-field-full">
                <label className="admin-label" htmlFor="edit-teacher-avatar">
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
                    id="edit-teacher-avatar"
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
