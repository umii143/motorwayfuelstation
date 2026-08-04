import React from 'react';

export interface EnterpriseEmptyRegisterProps {
  title: string;
  message: string;
  onAction?: () => void;
  actionText?: string;
}

export const EnterpriseEmptyRegister: React.FC<EnterpriseEmptyRegisterProps> = ({ title, message, onAction, actionText }) => {
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px dashed var(--border-main)',
      borderRadius: 'var(--radius-lg)',
      padding: '48px 24px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <span style={{ fontSize: '48px', opacity: 0.5, marginBottom: 'var(--spacing-md)' }}>📭</span>
      <h3 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: 'var(--text-lg)', color: 'var(--text-main)' }}>{title}</h3>
      <p style={{ margin: '0 0 var(--spacing-md) 0', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', maxWidth: 400 }}>{message}</p>
      {onAction && actionText && (
        <button onClick={onAction} style={{
          background: 'var(--primary-main)', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', color: '#fff', fontWeight: 600
        }}>
          {actionText}
        </button>
      )}
    </div>
  );
};
