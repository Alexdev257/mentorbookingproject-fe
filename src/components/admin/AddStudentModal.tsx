import React, { useState } from 'react';
import { adminApi } from '../../api/services';
import { X, ImagePlus } from 'lucide-react';

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
    <div className="admin-modal-backdrop" role="presentation" onClick={handleClose}>
      <div className="admin-modal" role="dialog" aria-labelledby="add-student-title" onClick={(ev) => ev.stopPropagation()}>
        <div className="admin-modal-accent" aria-hidden />
        <div className="admin-modal-body">
          <div className="admin-modal-head">
            <div>
              <h2 id="add-student-title" className="admin-modal-title">
                Thêm sinh viên
              </h2>
              <p className="admin-modal-sub">
                Tạo tài khoản mentee: thông tin đăng nhập và ảnh đại diện (theo cấu hình API hiện tại).
              </p>
            </div>
            <button type="button" className="admin-modal-close" onClick={handleClose} aria-label="Đóng">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {error ? <div className="admin-alert-error" style={{ marginBottom: '1rem' }}>{error}</div> : null}

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
                    <ImagePlus size={20} color="var(--brand-primary)" />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
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
  );
};
