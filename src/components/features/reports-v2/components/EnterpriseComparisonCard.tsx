import React from 'react';

export interface EnterpriseComparisonCardProps {
  title: string;
  metricA: { label: string; value: string | number };
  metricB: { label: string; value: string | number };
  varianceValue: string | number;
  variancePercentage: number;
}

export const EnterpriseComparisonCard: React.FC<EnterpriseComparisonCardProps> = ({
  title, metricA, metricB, varianceValue, variancePercentage
}) => {
  const isPositive = variancePercentage >= 0;

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-main)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--spacing-md)'
    }}>
      <h4 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{title}</h4>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
        <div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{metricA.label}</span>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-main)' }}>{metricA.value}</div>
        </div>
        <span style={{ color: 'var(--text-muted)' }}>vs</span>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{metricB.label}</span>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-main)' }}>{metricB.value}</div>
        </div>
      </div>
      <div style={{ 
        backgroundColor: isPositive ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
        padding: 'var(--spacing-xs)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 'var(--text-xs)',
        color: isPositive ? 'var(--color-success)' : 'var(--color-danger)'
      }}>
        <span>Variance</span>
        <strong>{isPositive ? '+' : ''}{varianceValue} ({variancePercentage}%)</strong>
      </div>
    </div>
  );
};
