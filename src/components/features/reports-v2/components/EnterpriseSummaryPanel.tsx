import React, { ReactNode } from 'react';

export interface EnterpriseSummaryPanelProps {
  title: string;
  children: ReactNode;
}

export const EnterpriseSummaryPanel: React.FC<EnterpriseSummaryPanelProps> = ({ title, children }) => {
  return (
    <div style={{
      backgroundColor: 'var(--bg-subtle)',
      border: '1px solid var(--border-main)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--spacing-md)'
    }}>
      <h4 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        {title}
      </h4>
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
        {children}
      </div>
    </div>
  );
};
