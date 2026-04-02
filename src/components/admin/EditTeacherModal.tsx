import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/services';
import type { TeacherResponseDto } from '../../types';
import { X, ImagePlus } from 'lucide-react';

const editTeacherModalLuminaCss = `
.edit-teacher-modal-lumina.admin-modal-backdrop {
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.edit-teacher-modal-lumina .admin-modal {
  max-width: 520px;
  border-radius: 20px;
  border: 1px solid #e8eaed;
  background: #ffffff;
  box-shadow: 0 24px 64px rgba(123, 97, 255, 0.12), 0 12px 32px rgba(15, 23, 42, 0.08);
}

.edit-teacher-modal-lumina .admin-modal-accent {
  height: 4px;
  background: linear-gradient(90deg, #7b61ff 0%, #9d8bff 50%, #7b61ff 100%);
}

.edit-teacher-modal-lumina .admin-modal-title {
  color: #1a1d26;
  font-weight: 800;
}

.edit-teacher-modal-lumina .admin-modal-sub {
  color: #6b7280;
}

.edit-teacher-modal-lumina .admin-modal-close {
  background: #f3f4f6;
  border: 1px solid #e8eaed;
  color: #6b7280;
  border-radius: 14px;
}

.edit-teacher-modal-lumina .admin-modal-close:hover {
  color: #5c4ad1;
  background: rgba(123, 97, 255, 0.1);
  border-color: rgba(123, 97, 255, 0.25);
}

.edit-teacher-modal-lumina .admin-label {
  color: #4b5563;
}

.edit-teacher-modal-lumina .input-field {
  background: #f9fafb;
  border: 1px solid #e8eaed;
  border-radius: 14px;
  color: #1a1d26;
}

.edit-teacher-modal-lumina .input-field:focus {
  border-color: rgba(123, 97, 255, 0.55);
  background: #ffffff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(123, 97, 255, 0.15);
}

.edit-teacher-modal-lumina .admin-alert-error {
  margin-bottom: 1rem;
  background: rgba(254, 226, 226, 0.85);
  border: 1px solid rgba(248, 113, 113, 0.35);
  color: #b91c1c;
}

.edit-teacher-modal-lumina .admin-file-zone {
  border: 1px dashed rgba(123, 97, 255, 0.35);
  border-radius: 16px;
  padding: 1rem 1.15rem;
  background: rgba(123, 97, 255, 0.04);
}

.edit-teacher-modal-lumina .admin-file-zone:focus-within {
  border-color: #7b61ff;
  background: rgba(123, 97, 255, 0.08);
}

.edit-teacher-modal-lumina .admin-file-zone input[type='file'] {
  color: #6b7280;
}

.edit-teacher-modal-lumina .edit-teacher-file-hint-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.65rem;
}

.edit-teacher-modal-lumina .edit-teacher-file-hint-row svg {
  color: #7b61ff;
  flex-shrink: 0;
}

.edit-teacher-modal-lumina .edit-teacher-file-hint-text {
  font-size: 0.8125rem;
  color: #6b7280;
}

.edit-teacher-modal-lumina .admin-modal-actions {
  border-top: 1px solid #e8eaed;
}

.edit-teacher-modal-lumina .admin-btn-secondary {
  background: #ffffff;
  color: #374151;
  border: 1px solid #e8eaed;
  border-radius: 14px;
}

.edit-teacher-modal-lumina .admin-btn-secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.edit-teacher-modal-lumina .admin-btn-primary {
  background: linear-gradient(135deg, #7b61ff 0%, #6346e8 100%);
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(123, 97, 255, 0.35);
  border: none;
}

.edit-teacher-modal-lumina .admin-btn-primary:hover:not(:disabled) {
  box-shadow: 0 6px 22px rgba(123, 97, 255, 0.45);
}

.edit-teacher-modal-lumina .admin-btn-primary:disabled {
  opacity: 0.65;
}
`;

interface EditTeacherModalProps {
  open: boolean;
  teacher: TeacherResponseDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditTeacherModal: React.FC<EditTeacherModalProps> = ({
  open,
  teacher,
  onClose,
  onSuccess,
}) => {
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
    <>
      <style>{editTeacherModalLuminaCss}</style>

      <div
        className="admin-modal-backdrop edit-teacher-modal-lumina"
        role="presentation"
        onClick={handleClose}
      >
        <div
          className="admin-modal"
          role="dialog"
          aria-labelledby="edit-teacher-title"
          onClick={(ev) => ev.stopPropagation()}
        >
          <div className="admin-modal-accent" aria-hidden />
          <div className="admin-modal-body">
            <div className="admin-modal-head">
              <div>
                <h2 id="edit-teacher-title" className="admin-modal-title">
                  Sửa giảng viên
                </h2>
                <p className="admin-modal-sub">
                  Email đăng nhập: <strong>{teacher.email}</strong>
                </p>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={handleClose}
                aria-label="Đóng"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {error ? <div className="admin-alert-error">{error}</div> : null}

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
                  <label
                    className="admin-label"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    Tài khoản đang hoạt động
                  </label>
                </div>

                <div className="admin-field-full">
                  <label className="admin-label" htmlFor="edit-teacher-avatar">
                    Ảnh đại diện mới (tùy chọn)
                  </label>

                  <div className="admin-file-zone">
                    <div className="edit-teacher-file-hint-row">
                      <ImagePlus size={20} strokeWidth={1.75} />
                      <span className="edit-teacher-file-hint-text">
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
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={handleClose}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="admin-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Đang lưu…' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};