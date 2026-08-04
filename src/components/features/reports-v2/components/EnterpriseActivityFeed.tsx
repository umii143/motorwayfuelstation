import React from 'react';

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface EnterpriseActivityFeedProps {
  activities: ActivityItem[];
}

export const EnterpriseActivityFeed: React.FC<EnterpriseActivityFeedProps> = ({ activities }) => {
  return (
    <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-main)', padding: 'var(--spacing-md)' }}>
      <h3 style={{ margin: '0 0 var(--spacing-md) 0', fontSize: 'var(--text-md)', color: 'var(--text-main)' }}>Audit Feed</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {activities.map(act => (
          <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 'var(--spacing-sm)', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 'var(--text-sm)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{act.user}</span>{' '}
              <span style={{ color: 'var(--text-muted)' }}>{act.action}</span>{' '}
              <strong style={{ color: 'var(--primary-main)' }}>{act.target}</strong>
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{act.timestamp}</div>
          </div>
        ))}
        {activities.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No recent activities.</div>}
      </div>
    </div>
  );
};
