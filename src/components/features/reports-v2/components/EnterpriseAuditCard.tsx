import React from 'react';

export interface EnterpriseAuditCardProps {
  hash: string;
  executionTimeMs: number;
  integrityStatus: 'VERIFIED' | 'COMPROMISED' | 'PENDING';
  timestamp: string;
}

export const EnterpriseAuditCard: React.FC<EnterpriseAuditCardProps> = ({ hash, executionTimeMs, integrityStatus, timestamp }) => {
  const isVerified = integrityStatus === 'VERIFIED';
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-main)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--spacing-md)',
      fontFamily: 'monospace'
    }}>
      <h4 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Execution Audit</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--text-main)' }}>
        <div><span style={{ color: 'var(--text-muted)' }}>Hash:</span> {hash}</div>
        <div><span style={{ color: 'var(--text-muted)' }}>Time:</span> {timestamp}</div>
        <div><span style={{ color: 'var(--text-muted)' }}>Exec:</span> {executionTimeMs}ms</div>
      </div>
      <div style={{ 
        marginTop: 'var(--spacing-sm)', 
        padding: '4px 8px', 
        borderRadius: 4, 
        backgroundColor: isVerified ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
        color: isVerified ? 'var(--color-success)' : 'var(--color-danger)',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 'var(--text-xs)'
      }}>
        {integrityStatus}
      </div>
    </div>
  );
};
