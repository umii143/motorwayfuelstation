import React from 'react';

export interface EnterpriseSectionHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

export const EnterpriseSectionHeader: React.FC<EnterpriseSectionHeaderProps> = ({ title, subtitle, rightElement }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-md)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--spacing-xs)' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 'var(--text-xl)', color: 'var(--text-main)', fontWeight: 700 }}>{title}</h2>
        {subtitle && <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      {rightElement && <div>{rightElement}</div>}
    </div>
  );
};
