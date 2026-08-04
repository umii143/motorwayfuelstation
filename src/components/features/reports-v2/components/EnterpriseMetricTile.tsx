import React from 'react';

export interface EnterpriseMetricTileProps {
  label: string;
  value: string | number;
  status?: 'SUCCESS' | 'WARNING' | 'DANGER' | 'NEUTRAL';
  icon?: string;
}

export const EnterpriseMetricTile: React.FC<EnterpriseMetricTileProps> = ({ label, value, status = 'NEUTRAL', icon }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'SUCCESS': return 'var(--color-success)';
      case 'WARNING': return 'var(--color-warning)';
      case 'DANGER': return 'var(--color-danger)';
      default: return 'var(--text-main)';
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-app)',
      border: '1px solid var(--border-main)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--spacing-sm)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--spacing-sm)'
    }}>
      {icon && <span style={{ fontSize: '1.2rem', opacity: 0.7 }}>{icon}</span>}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: getStatusColor() }}>{value}</span>
      </div>
    </div>
  );
};
