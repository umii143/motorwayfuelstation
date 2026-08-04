import React from 'react';
import { MetricProvenance, DataQualityScore } from '../../../../../lib/reports-v2/ebip/shared/types';
import { EnterpriseExplainabilityCard } from '../../components/EnterpriseExplainabilityCard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  metricName: string;
  value: number;
  quality: DataQualityScore;
  provenance: MetricProvenance;
}

export const R001ExplainabilityModal: React.FC<Props> = ({ isOpen, onClose, metricName, value, quality, provenance }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: 'var(--bg-app)', width: 600, borderRadius: 12, border: '1px solid var(--border-main)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh'
      }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)' }}>Enterprise Audit Trail</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Explainability for {metricName}</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>✖</button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Headline Value */}
          <div style={{ textAlign: 'center', padding: 24, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>Calculated Value</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-main)' }}>{value.toLocaleString()}</div>
          </div>

          <EnterpriseExplainabilityCard 
            why={`This metric represents the aggregated output for ${metricName} derived from live Firebase records.`}
            how={`Calculated using Formula Registry v${provenance.formulaVersion} executed in ${provenance.executionTimeMs}ms.`}
            sourceInfo={provenance.sources.join(', ')}
            confidenceScore={quality.percentage}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Data Quality Score</div>
              <div style={{ fontSize: 18, color: quality.percentage === 100 ? 'var(--color-success)' : '#f39c12', fontWeight: 600 }}>{quality.percentage}%</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Status: {quality.status}</div>
            </div>
            
            <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Execution Hash</div>
              <div style={{ fontSize: 14, color: 'var(--text-main)', fontFamily: 'monospace' }}>{provenance.hash.substring(0, 16)}...</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Generated: {new Date(provenance.generatedAt).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
