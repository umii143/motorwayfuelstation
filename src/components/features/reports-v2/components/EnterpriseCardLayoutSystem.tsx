import React, { ReactNode } from 'react';

export interface EnterpriseCardLayoutSystemProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
}

export const EnterpriseCardLayoutSystem: React.FC<EnterpriseCardLayoutSystemProps> = ({ children, columns = 3 }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(${columns === 4 ? '250px' : columns === 3 ? '300px' : columns === 2 ? '450px' : '100%'}, 1fr))`,
      gap: 'var(--spacing-md)',
      width: '100%'
    }}>
      {children}
    </div>
  );
};
