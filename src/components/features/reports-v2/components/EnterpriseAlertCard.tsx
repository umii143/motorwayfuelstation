import React from 'react';

export interface EnterpriseAlertCardProps {
  type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export const EnterpriseAlertCard: React.FC<EnterpriseAlertCardProps> = ({ type, title, message, actionText, onAction }) => {
  let bgColor = 'var(--bg-app)';
  let borderColor = 'var(--border-main)';
  let textColor = 'var(--text-main)';
  let icon = 'ℹ️';

  switch (type) {
    case 'WARNING':
      bgColor = 'rgba(243, 156, 18, 0.05)';
      borderColor = 'var(--color-warning)';
      textColor = 'var(--color-warning)';
      icon = '⚠️';
      break;
    case 'CRITICAL':
      bgColor = 'rgba(231, 76, 60, 0.05)';
      borderColor = 'var(--color-danger)';
      textColor = 'var(--color-danger)';
      icon = '🚨';
      break;
    case 'SUCCESS':
      bgColor = 'rgba(46, 204, 113, 0.05)';
      borderColor = 'var(--color-success)';
      textColor = 'var(--color-success)';
      icon = '✅';
      break;
    case 'INFO':
    default:
      borderColor = 'var(--color-primary)';
      textColor = 'var(--color-primary)';
      break;
  }

  return (
    <div style={{
      backgroundColor: bgColor,
      borderLeft: `4px solid ${borderColor}`,
      padding: 'var(--spacing-md)',
      borderRadius: 'var(--radius-sm)',
      display: 'flex',
      gap: 'var(--spacing-md)',
      alignItems: 'flex-start'
    }}>
      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-sm)', color: textColor }}>{title}</h4>
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>{message}</p>
      </div>
      {actionText && onAction && (
        <button onClick={onAction} style={{
          background: 'transparent', border: `1px solid ${borderColor}`, color: textColor,
          padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--text-xs)'
        }}>
          {actionText}
        </button>
      )}
    </div>
  );
};
