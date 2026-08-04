import React, { useState } from 'react';
import { useWorkspaceState } from './WorkspaceStateManager';
import { EnterpriseReportRegistry, ReportManifest } from '../../../../lib/reports-v2/foundation/EnterpriseReportRegistry';
import R001ExecutiveScore from '../ebip/R001/R001ExecutiveScore';
import EBIPDeepAnalyticsPanel from '../ebip/EBIPDeepAnalyticsPanel';
import LiveReportRenderer from './LiveReportRenderer';
import AZCommandHome from './AZCommandHome';

export default function ReportCanvas() {
  const { activeReportId, language, reportNamingMode, isDeveloperMode } = useWorkspaceState();
  const [activeTab, setActiveTab] = useState<'METADATA' | 'UI' | 'JSON'>('UI');
  const registry = EnterpriseReportRegistry.getInstance();
  
  if (!activeReportId) {
    // A-Z Command Home — search, My Frequent Reports, priority quick links
    return <AZCommandHome />;
  }

  const report = registry.getReport(activeReportId) as ReportManifest;
  if (!report) return <div>Error: Report not found in registry.</div>;

  const TabButton = ({ id, label, icon }: { id: any, label: string, icon: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 24px',
        border: 'none',
        borderBottom: activeTab === id ? '2px solid var(--primary-main)' : '2px solid transparent',
        background: 'transparent',
        color: activeTab === id ? 'var(--primary-main)' : 'var(--text-muted)',
        fontWeight: activeTab === id ? 600 : 400,
        cursor: 'pointer',
        fontSize: 14
      }}
    >
      <span>{icon}</span> {label}
    </button>
  );

  const ChipList = ({ items, colorStr }: { items: string[], colorStr: string }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {items.map(item => (
        <span key={item} style={{ background: `var(--bg-app)`, border: `1px solid ${colorStr}`, color: 'var(--text-main)', padding: '4px 12px', borderRadius: 16, fontSize: 12 }}>
          {item}
        </span>
      ))}
    </div>
  );

  return (
    <div style={{ flex: 1, backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px 32px 0', borderBottom: '1px solid var(--border-main)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isDeveloperMode ? 0 : 24 }}>
          <div>
            <h1 style={{ fontSize: 32, color: 'var(--text-main)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
              {reportNamingMode === 'simple' ? report.simpleName : report.reportName}
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: '0', fontSize: 16, maxWidth: 800, lineHeight: 1.5 }}>{report.description}</p>
          </div>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--color-success)', fontSize: 10 }}>●</span> Live Data
            </span>
            {/* Export / Print live inside the report body via the Enterprise Export Suite */}
          </div>
        </div>

        {/* Developer Tabs (Progressive Disclosure) */}
        {isDeveloperMode && (
          <div style={{ display: 'flex', marginTop: 16 }}>
            <TabButton id="UI" icon="📊" label="Business View" />
            <TabButton id="METADATA" icon="📐" label="Developer Metadata" />
            <TabButton id="JSON" icon="📄" label="Raw Manifest JSON" />
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        
        {(!isDeveloperMode || activeTab === 'UI') && (
          <>
            {report.reportId === 'A-001' ? (
              <R001ExecutiveScore />
            ) : (
              <>
                <LiveReportRenderer report={report} />
                {/* Per-report EBIP deep analytics — strictly isolated to Developer Mode (Rule #126) */}
                {isDeveloperMode && (
                  <EBIPDeepAnalyticsPanel
                    engineType={registry.getEngineTypeForReport(report.reportId)}
                    reportId={report.reportId}
                  />
                )}
              </>
            )}
          </>
        )}

        {isDeveloperMode && activeTab === 'METADATA' && (
          <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid #e74c3c', color: '#c0392b', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
              ⚠ DEVELOPER MODE ACTIVE: This metadata is hidden from operational users.
            </div>
            {/* Core Infrastructure */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-main)' }}>
                <h3 style={{ fontSize: 16, margin: '0 0 16px', color: 'var(--text-main)' }}>Data Architecture</h3>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Firebase Collections</div>
                  <ChipList items={report.firebaseCollections} colorStr="var(--primary-main)" />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Formula Dependencies</div>
                  <ChipList items={report.formulaDependencies} colorStr="#f39c12" />
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-main)' }}>
                <h3 style={{ fontSize: 16, margin: '0 0 16px', color: 'var(--text-main)' }}>UI Configuration</h3>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Register ID</div>
                  <div style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{report.registerId}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Register Type</div>
                  <div style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{report.registerType}</div>
                </div>
              </div>
            </div>

            {/* Enterprise Features */}
            <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-main)' }}>
              <h3 style={{ fontSize: 16, margin: '0 0 16px', color: 'var(--text-main)' }}>Enterprise Features (Manifest Flags)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {Object.entries(report)
                  .filter(([key, val]) => key.startsWith('supports') && typeof val === 'boolean')
                  .map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: val ? 'var(--color-success)' : 'var(--text-muted)' }}>{val ? '☑' : '☐'}</span>
                      <span style={{ color: val ? 'var(--text-main)' : 'var(--text-muted)', fontSize: 13 }}>{key.replace('supports', '')}</span>
                    </div>
                ))}
              </div>
            </div>

            {/* Security */}
            <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-main)' }}>
              <h3 style={{ fontSize: 16, margin: '0 0 16px', color: 'var(--text-main)' }}>Security & Governance</h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Required RBAC Permissions</div>
              <ChipList items={report.permission} colorStr="#27ae60" />
            </div>
          </div>
        )}

        {isDeveloperMode && activeTab === 'JSON' && (
          <div style={{ padding: 24, overflow: 'auto' }}>
             <div style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid #e74c3c', color: '#c0392b', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              ⚠ DEVELOPER MODE ACTIVE: This raw JSON is hidden from operational users.
            </div>
            <pre style={{ 
              background: '#1e1e1e', color: '#d4d4d4', padding: 24, borderRadius: 8, 
              fontFamily: 'Consolas, monospace', fontSize: 14 
            }}>
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
}
