import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

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
    <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="admin-modal"
        style={{ maxWidth: 400 }}
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
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(248,81,73,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={22} color="var(--error)" />
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
            <button type="button" className="admin-modal-close" onClick={onCancel} aria-label="Đóng">
              <X size={20} />
            </button>
          </div>
          <div className="admin-modal-actions" style={{ borderTop: 'none', paddingTop: 0, marginTop: '0.5rem' }}>
            <button type="button" className="admin-btn-secondary" onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </button>
            <button
              type="button"
              className="admin-btn-primary"
              style={
                danger
                  ? {
                      background: 'linear-gradient(135deg, #f85149 0%, #da3633 100%)',
                      boxShadow: '0 4px 20px rgba(248,81,73,0.25)',
                    }
                  : undefined
              }
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Đang xử lý…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
