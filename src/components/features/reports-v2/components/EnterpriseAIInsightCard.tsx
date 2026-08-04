import React from 'react';

export interface EnterpriseAIInsightCardProps {
  title: string;
  insight: string;
  confidenceScore: number;
}

export const EnterpriseAIInsightCard: React.FC<EnterpriseAIInsightCardProps> = ({ title, insight, confidenceScore }) => {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(142, 68, 173, 0.05), rgba(41, 128, 185, 0.05))',
      border: '1px solid var(--color-accent)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--spacing-md)',
      position: 'relative'
    }}>
      <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 'var(--text-xs)', color: 'var(--color-accent)', fontWeight: 600, backgroundColor: 'rgba(142, 68, 173, 0.1)', padding: '2px 8px', borderRadius: 12 }}>
        AI Powered • {confidenceScore}% Confidence
      </div>
      <h4 style={{ margin: '0 0 8px 0', fontSize: 'var(--text-sm)', color: 'var(--color-accent)' }}>🤖 {title}</h4>
      <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-main)', lineHeight: 1.5 }}>{insight}</p>
    </div>
  );
};
