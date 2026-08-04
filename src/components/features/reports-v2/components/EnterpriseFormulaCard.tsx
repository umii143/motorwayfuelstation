import React from 'react';

export interface EnterpriseFormulaCardProps {
  ruleName: string;
  formula: string;
  version: string;
  owner: string;
}

export const EnterpriseFormulaCard: React.FC<EnterpriseFormulaCardProps> = ({ ruleName, formula, version, owner }) => {
  return (
    <div style={{
      backgroundColor: 'var(--bg-app)',
      border: '1px dashed var(--border-main)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--spacing-md)',
      fontFamily: 'monospace'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
        <span>Rule: {ruleName}</span>
        <span>v{version} | {owner}</span>
      </div>
      <div style={{ padding: 'var(--spacing-sm)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--primary-main)', fontSize: 'var(--text-sm)' }}>
        ƒ(x) = {formula}
      </div>
    </div>
  );
};
