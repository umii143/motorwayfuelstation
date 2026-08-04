import React, { ReactNode } from 'react';

export interface EnterpriseChartContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onExport?: () => void;
  isLoading?: boolean;
  isEmpty?: boolean;
}

export const EnterpriseChartContainer: React.FC<EnterpriseChartContainerProps> = ({
  title, subtitle, children, onExport, isLoading, isEmpty
}) => {
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-main)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--spacing-md)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 'var(--text-md)', color: 'var(--text-main)' }}>{title}</h3>
          {subtitle && <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
        {onExport && (
          <button onClick={onExport} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-main)', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontSize: 'var(--text-xs)', color: 'var(--text-main)' }}>
            Export
          </button>
        )}
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: '250px' }}>
        {isLoading ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading Chart...</div>
        ) : isEmpty ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Chart Data</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};
