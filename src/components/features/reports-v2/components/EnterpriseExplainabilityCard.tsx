import React from 'react';

export interface EnterpriseExplainabilityCardProps {
  why: string;
  how: string;
  sourceInfo: string;
  confidenceScore: number;
}

export const EnterpriseExplainabilityCard: React.FC<EnterpriseExplainabilityCardProps> = ({ why, how, sourceInfo, confidenceScore }) => {
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-main)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--spacing-md)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 8 }}>
        <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>AI Explainability</h4>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', fontWeight: 600 }}>{confidenceScore}% Confidence</span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'block' }}>Why did this happen?</strong>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>{why}</span>
        </div>
        <div>
          <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'block' }}>How was this calculated?</strong>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>{how}</span>
        </div>
        <div style={{ backgroundColor: 'var(--bg-app)', padding: 8, borderRadius: 4, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          <strong>Source Data: </strong>{sourceInfo}
        </div>
      </div>
    </div>
  );
};
