import React from 'react';

export interface EnterpriseDataSourceCardProps {
  collections: string[];
  latencyMs: number;
  syncStatus: 'SYNCED' | 'SYNCING' | 'OFFLINE';
}

export const EnterpriseDataSourceCard: React.FC<EnterpriseDataSourceCardProps> = ({ collections, latencyMs, syncStatus }) => {
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-main)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--spacing-md)'
    }}>
      <h4 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Database Sources</h4>
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap', marginBottom: 'var(--spacing-md)' }}>
        {collections.map(c => (
          <span key={c} style={{ fontSize: 'var(--text-xs)', background: 'var(--bg-subtle)', border: '1px solid var(--border-main)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-main)' }}>
            {c}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
        <span style={{ color: 'var(--text-muted)' }}>Latency: {latencyMs}ms</span>
        <span style={{ 
          color: syncStatus === 'SYNCED' ? 'var(--color-success)' : syncStatus === 'OFFLINE' ? 'var(--color-danger)' : 'var(--color-warning)',
          fontWeight: 600
        }}>
          {syncStatus}
        </span>
      </div>
    </div>
  );
};
