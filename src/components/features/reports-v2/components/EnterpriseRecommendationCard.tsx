import React from 'react';

export interface EnterpriseRecommendationCardProps {
  actionText: string;
  impact: string;
  onApply?: () => void;
  onDismiss?: () => void;
}

export const EnterpriseRecommendationCard: React.FC<EnterpriseRecommendationCardProps> = ({ actionText, impact, onApply, onDismiss }) => {
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-main)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--spacing-md)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>💡 Recommendation</h4>
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{actionText}</p>
        <div style={{ marginTop: 4, fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 600 }}>Expected Impact: {impact}</div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
        {onDismiss && <button onClick={onDismiss} style={{ background: 'transparent', border: '1px solid var(--border-main)', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', color: 'var(--text-muted)' }}>Dismiss</button>}
        {onApply && <button onClick={onApply} style={{ background: 'var(--primary-main)', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', color: '#fff', fontWeight: 600 }}>Apply</button>}
      </div>
    </div>
  );
};
