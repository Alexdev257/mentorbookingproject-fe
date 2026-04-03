import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const adminConfirmDialogLuminaCss = `
.admin-confirm-dialog-lumina.admin-modal-backdrop {
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.admin-confirm-dialog-lumina .admin-modal {
  max-width: 400px !important;
  border-radius: 20px;
  border: 1px solid #e8eaed;
  background: #ffffff;
  box-shadow: 0 24px 64px rgba(123, 97, 255, 0.12), 0 12px 32px rgba(15, 23, 42, 0.08);
}

.admin-confirm-dialog-lumina .admin-modal-accent {
  height: 4px;
  background: linear-gradient(90deg, #7b61ff 0%, #9d8bff 50%, #7b61ff 100%);
}

.admin-confirm-dialog-lumina .admin-modal-title {
  color: #1a1d26;
  font-weight: 800;
}

.admin-confirm-dialog-lumina .admin-modal-sub {
  color: #6b7280;
}

.admin-confirm-dialog-lumina .admin-modal-close {
  background: #f3f4f6;
  border: 1px solid #e8eaed;
  color: #6b7280;
  border-radius: 14px;
}

.admin-confirm-dialog-lumina .admin-modal-close:hover {
  color: #5c4ad1;
  background: rgba(123, 97, 255, 0.1);
  border-color: rgba(123, 97, 255, 0.25);
}

.admin-confirm-dialog-lumina .admin-modal-actions {
  border-top: none;
  padding-top: 0;
  margin-top: 0.5rem;
}

.admin-confirm-dialog-lumina .admin-btn-secondary {
  background: #ffffff;
  color: #374151;
  border: 1px solid #e8eaed;
  border-radius: 14px;
}

.admin-confirm-dialog-lumina .admin-btn-secondary:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.admin-confirm-dialog-lumina .admin-btn-primary {
  border-radius: 14px;
  border: none;
}

.admin-confirm-dialog-lumina .admin-btn-primary:not(.admin-btn-danger) {
  background: linear-gradient(135deg, #7b61ff 0%, #6346e8 100%);
  box-shadow: 0 4px 16px rgba(123, 97, 255, 0.35);
}

.admin-confirm-dialog-lumina .admin-btn-primary:not(.admin-btn-danger):hover:not(:disabled) {
  box-shadow: 0 6px 22px rgba(123, 97, 255, 0.45);
}

.admin-confirm-dialog-lumina .admin-btn-danger {
  background: linear-gradient(135deg, #f85149 0%, #da3633 100%);
  box-shadow: 0 4px 20px rgba(248, 81, 73, 0.25);
}

.admin-confirm-dialog-lumina .admin-btn-danger:hover:not(:disabled) {
  box-shadow: 0 6px 24px rgba(248, 81, 73, 0.35);
}

.admin-confirm-dialog-lumina .admin-btn-primary:disabled,
.admin-confirm-dialog-lumina .admin-btn-secondary:disabled {
  opacity: 0.65;
}

.admin-confirm-dialog-lumina .admin-confirm-icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: rgba(248, 81, 73, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.admin-confirm-dialog-lumina .admin-confirm-icon svg {
  color: #da3633;
}
`;

interface AdminConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AdminConfirmDialog: React.FC<AdminConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <>
      <style>{adminConfirmDialogLuminaCss}</style>

      <div
        className="admin-modal-backdrop admin-confirm-dialog-lumina"
        role="presentation"
        onClick={onCancel}
      >
        <div
          className="admin-modal"
          role="alertdialog"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-desc"
          onClick={(ev) => ev.stopPropagation()}
        >
          <div className="admin-modal-accent" aria-hidden />
          <div className="admin-modal-body">
            <div className="admin-modal-head">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                {danger ? (
                  <div className="admin-confirm-icon">
                    <AlertTriangle size={22} strokeWidth={1.85} />
                  </div>
                ) : null}

                <div>
                  <h2 id="confirm-title" className="admin-modal-title">
                    {title}
                  </h2>
                  <p id="confirm-desc" className="admin-modal-sub" style={{ marginTop: '0.35rem' }}>
                    {message}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={onCancel}
                aria-label="Đóng"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={onCancel}
                disabled={loading}
              >
                {cancelLabel}
              </button>

              <button
                type="button"
                className={`admin-btn-primary ${danger ? 'admin-btn-danger' : ''}`}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? 'Đang xử lý…' : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};