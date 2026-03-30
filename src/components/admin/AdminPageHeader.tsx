import React from 'react';

interface AdminPageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  eyebrow,
  title,
  description,
  actions,
}) => (
  <div className="admin-hero">
    <div className="admin-hero-main">
      <p className="admin-eyebrow">{eyebrow}</p>
      <h1 className="admin-title">{title}</h1>
      <p className="admin-desc">{description}</p>
    </div>
    {actions ? <div style={{ display: 'flex', alignItems: 'center' }}>{actions}</div> : null}
  </div>
);
