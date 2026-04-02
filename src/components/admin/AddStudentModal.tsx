import React, { useState } from 'react';
import { adminApi } from '../../api/services';
import { X, ImagePlus } from 'lucide-react';

const addStudentModalLuminaCss = `
.add-student-modal-lumina.admin-modal-backdrop {
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.add-student-modal-lumina .admin-modal {
  max-width: 520px;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  box-shadow: 0 24px 64px rgba(124, 58, 237, 0.12), 0 12px 32px rgba(15, 23, 42, 0.08);
}

.add-student-modal-lumina .admin-modal-accent {
  height: 4px;
  background: linear-gradient(90deg, #7c3aed 0%, #a78bfa 50%, #7c3aed 100%);
}

.add-student-modal-lumina .admin-modal-title {
  color: #111827;
  font-weight: 800;
}

.add-student-modal-lumina .admin-modal-sub {
  color: #6b7280;
}

.add-student-modal-lumina .admin-modal-close {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  border-radius: 14px;
}

.add-student-modal-lumina .admin-modal-close:hover {
  color: #6d28d9;
  background: rgba(124, 58, 237, 0.1);
  border-color: rgba(124, 58, 237, 0.25);
}

.add-student-modal-lumina .admin-label {
  color: #4b5563;
}

.add-student-modal-lumina .input-field {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  color: #111827;
}

.add-student-modal-lumina .input-field:focus {
  border-color: rgba(124, 58, 237, 0.55);
  background: #ffffff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
}

.add-student-modal-lumina .admin-alert-error {
  margin-bottom: 1rem;
  background: rgba(254, 226, 226, 0.85);
  border: 1px solid rgba(248, 113, 113, 0.35);
  color: #b91c1c;
}

.add-student-modal-lumina .admin-file-zone {
  border: 1px dashed rgba(124, 58, 237, 0.35);
  border-radius: 16px;
  padding: 1rem 1.15rem;
  background: rgba(124, 58, 237, 0.04);
}

.add-student-modal-lumina .admin-file-zone:focus-within {
  border-color: #7c3aed;
  background: rgba(124, 58, 237, 0.08);
}

.add-student-modal-lumina .admin-file-zone input[type='file'] {
  color: #6b7280;
}

.add-student-modal-lumina .add-student-file-hint-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.65rem;
}

.add-student-modal-lumina .add-student-file-hint-row svg {
  color: #7c3aed;
  flex-shrink: 0;
}

.add-student-modal-lumina .add-student-file-hint-text {
  font-size: 0.8125rem;
  color: #6b7280;
}

.add-student-modal-lumina .admin-modal-actions {
  border-top: 1px solid #e5e7eb;
}

.add-student-modal-lumina .admin-btn-secondary {
  background: #ffffff;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
}

.add-student-modal-lumina .admin-btn-secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.add-student-modal-lumina .admin-btn-primary {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.35);
  border: none;
}

.add-student-modal-lumina .admin-btn-primary:hover:not(:disabled) {
  box-shadow: 0 6px 22px rgba(124, 58, 237, 0.45);
}

.add-student-modal-lumina .admin-btn-primary:disabled {
  opacity: 0.65;
}
`;

interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ open, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setStudentCode('');
    setAvatar(null);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!avatar) {
      setError('Vui lòng chọn ảnh đại diện (bắt buộc khi tạo tài khoản).');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('Email', email.trim());
      fd.append('Password', password);
      fd.append('FullName', fullName.trim());
      if (studentCode.trim()) fd.append('StudentCode', studentCode.trim());
      fd.append('Avatar', avatar);

      const res = await adminApi.registerStudent(fd);
      if (res.isSuccess) {
        reset();
        onSuccess();
        onClose();
      } else {
        const detail = res.listErrors?.map((x) => x.detail).filter(Boolean).join(' · ');
        setError(detail || res.message || 'Không tạo được sinh viên');
      }
    } catch {
      setError('Lỗi mạng hoặc máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <style>{addStudentModalLuminaCss}</style>
      <div className="admin-modal-backdrop add-student-modal-lumina" role="presentation" onClick={handleClose}>
        <div className="admin-modal" role="dialog" aria-labelledby="add-student-title" onClick={(ev) => ev.stopPropagation()}>
          <div className="admin-modal-accent" aria-hidden />
          <div className="admin-modal-body">
            <div className="admin-modal-head">
              <div>
                <h2 id="add-student-title" className="admin-modal-title">
                  Thêm sinh viên
                </h2>
              </div>
              <button type="button" className="admin-modal-close" onClick={handleClose} aria-label="Đóng">
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {error ? <div className="admin-alert-error">{error}</div> : null}

              <div className="admin-form-grid admin-form-grid--2">
                <div>
                  <label className="admin-label" htmlFor="student-email">
                    Email *
                  </label>
                  <input
                    id="student-email"
                    className="input-field"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="admin-label" htmlFor="student-password">
                    Mật khẩu *
                  </label>
                  <input
                    id="student-password"
                    className="input-field"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="admin-field-full">
                  <label className="admin-label" htmlFor="student-name">
                    Họ và tên *
                  </label>
                  <input
                    id="student-name"
                    className="input-field"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="admin-field-full">
                  <label className="admin-label" htmlFor="student-code">
                    Mã sinh viên
                  </label>
                  <input
                    id="student-code"
                    className="input-field"
                    type="text"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                  />
                </div>
                <div className="admin-field-full">
                  <label className="admin-label" htmlFor="student-avatar">
                    Ảnh đại diện *
                  </label>
                  <div className="admin-file-zone">
                    <div className="add-student-file-hint-row">
                      <ImagePlus size={20} strokeWidth={1.75} />
                      <span className="add-student-file-hint-text">
                        PNG, JPG — tối đa theo giới hạn máy chủ
                      </span>
                    </div>
                    <input
                      id="student-avatar"
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
                  {submitting ? 'Đang lưu…' : 'Tạo sinh viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
