import React from 'react';

export type BadgeType = 'LIVE' | 'CERTIFIED' | 'AI' | 'NEW' | 'BETA' | 'ARCHIVED' | 'VERIFIED' | 'SECURE';

export interface EnterpriseBadgeProps {
  type: BadgeType;
}

export const EnterpriseBadge: React.FC<EnterpriseBadgeProps> = ({ type }) => {
  let bgColor = 'var(--bg-subtle)';
  let color = 'var(--text-main)';
  let text = type;

  switch (type) {
    case 'LIVE':
      bgColor = 'var(--color-warning)';
      color = '#fff';
      break;
    case 'CERTIFIED':
      bgColor = 'var(--color-success)';
      color = '#fff';
      break;
    case 'AI':
      bgColor = 'var(--color-accent)';
      color = '#fff';
      break;
    case 'VERIFIED':
    case 'SECURE':
      bgColor = 'rgba(46, 204, 113, 0.2)';
      color = 'var(--color-success)';
      break;
    case 'ARCHIVED':
      bgColor = 'var(--bg-app)';
      color = 'var(--text-muted)';
      break;
    case 'NEW':
    case 'BETA':
      bgColor = 'rgba(52, 152, 219, 0.2)';
      color = 'var(--primary-main)';
      break;
  }

  return (
    <span style={{
      backgroundColor: bgColor,
      color: color,
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      display: 'inline-block'
    }}>
      {text}
    </span>
  );
};

export const EnterpriseBadgeLibrary = {
  Live: () => <EnterpriseBadge type="LIVE" />,
  Certified: () => <EnterpriseBadge type="CERTIFIED" />,
  AI: () => <EnterpriseBadge type="AI" />,
  New: () => <EnterpriseBadge type="NEW" />,
  Beta: () => <EnterpriseBadge type="BETA" />,
  Archived: () => <EnterpriseBadge type="ARCHIVED" />,
  Verified: () => <EnterpriseBadge type="VERIFIED" />,
  Secure: () => <EnterpriseBadge type="SECURE" />
};
