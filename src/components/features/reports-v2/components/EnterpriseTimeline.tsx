import React, { ReactNode } from 'react';

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description?: string;
  icon?: string;
  status?: 'SUCCESS' | 'WARNING' | 'DANGER' | 'NEUTRAL';
}

export interface EnterpriseTimelineProps {
  events: TimelineEvent[];
}

export const EnterpriseTimeline: React.FC<EnterpriseTimelineProps> = ({ events }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {events.map((event, idx) => (
        <div key={event.id} style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ 
              width: 24, height: 24, borderRadius: '50%', 
              backgroundColor: 'var(--bg-subtle)', 
              border: '2px solid var(--border-main)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px'
            }}>
              {event.icon || '•'}
            </div>
            {idx !== events.length - 1 && <div style={{ width: 2, flex: 1, backgroundColor: 'var(--border-main)', margin: '4px 0' }} />}
          </div>
          <div style={{ paddingBottom: 'var(--spacing-md)', flex: 1 }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{event.time}</div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-main)', marginTop: 4 }}>{event.title}</div>
            {event.description && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 4 }}>{event.description}</div>}
          </div>
        </div>
      ))}
    </div>
  );
};
