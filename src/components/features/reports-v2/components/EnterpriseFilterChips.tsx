import React from 'react';

export interface FilterChip {
  id: string;
  label: string;
  isActive: boolean;
}

export interface EnterpriseFilterChipsProps {
  chips: FilterChip[];
  onToggle: (id: string) => void;
}

export const EnterpriseFilterChips: React.FC<EnterpriseFilterChipsProps> = ({ chips, onToggle }) => {
  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
      {chips.map(chip => (
        <button
          key={chip.id}
          onClick={() => onToggle(chip.id)}
          style={{
            background: chip.isActive ? 'var(--primary-main)' : 'var(--bg-app)',
            color: chip.isActive ? '#fff' : 'var(--text-main)',
            border: `1px solid ${chip.isActive ? 'var(--primary-main)' : 'var(--border-main)'}`,
            borderRadius: '16px',
            padding: '4px 12px',
            fontSize: 'var(--text-xs)',
            cursor: 'pointer',
            fontWeight: chip.isActive ? 600 : 400,
            transition: 'all 0.2s ease'
          }}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
};
