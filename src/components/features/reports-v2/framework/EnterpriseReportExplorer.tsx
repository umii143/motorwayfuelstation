import React, { useState } from 'react';
import { useWorkspaceState } from './WorkspaceStateManager';
import { 
  EnterpriseReportRegistry, 
  DOMAINS, 
  DomainCategory, 
  CertificationStatus,
  ReportManifest
} from '../../../../lib/reports-v2/foundation/EnterpriseReportRegistry';

export default function EnterpriseReportExplorer() {
  const { 
    isExplorerCollapsed, setExplorerCollapsed, 
    activeReportId, setActiveReportId, 
    language, 
    reportNamingMode, setReportNamingMode,
    navigationMode, setNavigationMode,
    activeRole, setActiveRole,
    isDeveloperMode, setIsDeveloperMode
  } = useWorkspaceState();
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Track expanded state for domains and categories
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({
    'A': true,
    'B': true
  });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'A_Executive Dashboard': true,
    'B_Sales Reports': true
  });

  const toggleDomain = (id: string) => setExpandedDomains(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleCategory = (id: string) => setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));

  const registry = EnterpriseReportRegistry.getInstance();
  const allReports = registry.getAllReports();

  // 1. Filter by RBAC Role
  const allowedReports = allReports.filter(r => r.permission.includes(activeRole));

  // 2. Filter by Search
  const visibleReports = allowedReports.filter(r => 
    searchTerm === '' || 
    r.reportName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.simpleName.includes(searchTerm) ||
    r.reportId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStatusBadge = (status: CertificationStatus) => {
    const s = { fontSize: 10, padding: '2px 6px', borderRadius: 12, fontWeight: 600, color: '#fff' };
    switch (status) {
      case 'CERTIFIED': return <span style={{ ...s, background: '#2980b9' }}>CERT</span>;
      case 'READY': return <span style={{ ...s, background: '#8e44ad', color: '#fff' }}>READY</span>;
      case 'UNDER_DEVELOPMENT': return <span style={{ ...s, background: '#f39c12', color: '#000' }}>DEV</span>;
      case 'DRAFT': return <span style={{ ...s, background: 'var(--bg-app)', color: 'var(--text-muted)' }}>DRAFT</span>;
      case 'DEPRECATED': return <span style={{ ...s, background: '#c0392b' }}>DEP</span>;
      default: return null;
    }
  };

  const renderReportItem = (r: ReportManifest) => (
    <div 
      key={r.reportId}
      onClick={() => setActiveReportId(r.reportId)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px',
        cursor: 'pointer',
        backgroundColor: activeReportId === r.reportId ? 'var(--primary-accent)' : 'transparent',
        color: activeReportId === r.reportId ? '#fff' : 'var(--text-main)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 'bold', opacity: 0.6 }}>{r.reportId}</span>
        <span style={{ fontSize: 13, fontWeight: activeReportId === r.reportId ? 600 : 400 }}>
          {reportNamingMode === 'simple' ? r.simpleName : r.reportName}
        </span>
      </div>
      {renderStatusBadge(r.certificationStatus as any)}
    </div>
  );

  if (isExplorerCollapsed) {
    return (
      <div style={{
        width: 60,
        backgroundColor: 'var(--bg-card)',
        borderRight: '1px solid var(--border-main)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 16
      }}>
        <button 
          onClick={() => setExplorerCollapsed(false)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20 }}
          title="Expand"
        >
          📂
        </button>
      </div>
    );
  }

  // Grouping for Daily and Process modes
  const dailyGroups = Array.from(new Set(visibleReports.filter(r => r.dailyCategory).map(r => r.dailyCategory!)));
  const processGroups = Array.from(new Set(visibleReports.filter(r => r.businessProcess).map(r => r.businessProcess!)));

  return (
    <div style={{
      width: 320, minWidth: 320, backgroundColor: 'var(--bg-card)', borderRight: '1px solid var(--border-main)',
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--border-main)' }}>
        <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)', fontWeight: 700 }}>
          {language === 'en' ? 'EBIP Explorer' : 'ای بی آئی پی ایکسپلورر'}
        </h3>
        <button onClick={() => setExplorerCollapsed(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>◀</button>
      </div>

      {/* Tenant Context + Developer Mode. RBAC role comes from the authenticated
          session (never a debug picker) and is only overridable in Developer Mode. */}
      <div style={{ padding: '8px 16px', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1px solid var(--border-main)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {language === 'en' ? 'Active Role' : 'فعال کردار'}: {activeRole}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{language === 'en' ? 'Developer Mode' : 'ڈیولپر موڈ'}:</span>
          <input 
            type="checkbox" 
            checked={isDeveloperMode} 
            onChange={(e) => setIsDeveloperMode(e.target.checked)} 
            style={{ cursor: 'pointer' }}
          />
        </div>
        {isDeveloperMode && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{language === 'en' ? 'Override Role (Dev)' : 'کردار تبدیل کریں'}:</span>
            <select 
              value={activeRole} 
              onChange={(e) => setActiveRole(e.target.value as any)}
              style={{ fontSize: 11, background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-main)', padding: '2px 4px', borderRadius: 4 }}
            >
              {['OWNER', 'MANAGER', 'ACCOUNTANT', 'OPERATOR', 'TECHNICIAN', 'AUDITOR'].map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Modes */}
      <div style={{ display: 'flex', background: 'var(--bg-app)', borderBottom: '1px solid var(--border-main)' }}>
        {[
          { id: 'DAILY', label: 'Daily Ops' },
          { id: 'PROCESS', label: 'Process' },
          { id: 'AZ', label: 'A-Z Catalog' }
        ].map(mode => (
          <button
            key={mode.id}
            onClick={() => setNavigationMode(mode.id as any)}
            style={{
              flex: 1, padding: '12px 4px', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: 'transparent',
              color: navigationMode === mode.id ? 'var(--primary-main)' : 'var(--text-muted)',
              borderBottom: navigationMode === mode.id ? '2px solid var(--primary-main)' : '2px solid transparent'
            }}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Search and Toggles */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-main)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-main)', borderRadius: 8, marginBottom: 8 }}>
          <span>🔍</span>
          <input
            type="text"
            placeholder={language === 'en' ? 'Search Reports...' : 'رپورٹس تلاش کریں...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, color: 'var(--text-main)' }}
          />
        </div>
        
        {/* Dual Mode Toggle */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-app)', padding: 4, borderRadius: 8 }}>
          <button 
            onClick={() => setReportNamingMode('simple')}
            style={{ flex: 1, padding: '4px 8px', fontSize: 11, borderRadius: 4, border: 'none', cursor: 'pointer',
              background: reportNamingMode === 'simple' ? 'var(--primary-accent)' : 'transparent',
              color: reportNamingMode === 'simple' ? '#fff' : 'var(--text-muted)'
            }}
          >
            {language === 'en' ? 'Simple Mode' : 'آسان موڈ'}
          </button>
          <button 
            onClick={() => setReportNamingMode('enterprise')}
            style={{ flex: 1, padding: '4px 8px', fontSize: 11, borderRadius: 4, border: 'none', cursor: 'pointer',
              background: reportNamingMode === 'enterprise' ? 'var(--primary-accent)' : 'transparent',
              color: reportNamingMode === 'enterprise' ? '#fff' : 'var(--text-muted)'
            }}
          >
            {language === 'en' ? 'Enterprise Mode' : 'ایڈوانس موڈ'}
          </button>
        </div>
      </div>

      {/* Tree View */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        
        {/* MODE: A-Z EXPLORER */}
        {navigationMode === 'AZ' && DOMAINS.map(domain => {
          const domainReports = visibleReports.filter(r => r.category === domain.id);
          if (domainReports.length === 0) return null;

          const categories = Array.from(new Set(domainReports.map(r => r.module)));

          return (
            <div key={domain.id} style={{ marginBottom: 4 }}>
              <div 
                onClick={() => toggleDomain(domain.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 16px',
                  cursor: 'pointer', color: 'var(--text-main)',
                  backgroundColor: expandedDomains[domain.id] ? 'var(--bg-subtle)' : 'transparent',
                  borderBottom: '1px solid var(--border-subtle)'
                }}
              >
                <span style={{ fontSize: 10, width: 12, textAlign: 'center', marginTop: 4 }}>{expandedDomains[domain.id] ? '▼' : '▶'}</span>
                <span style={{ fontSize: 16 }}>{domain.emoji}</span>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{language === 'en' ? domain.nameEn : domain.nameUr}</span>
                </div>
              </div>
              
              {expandedDomains[domain.id] && categories.map(cat => {
                const catKey = `${domain.id}_${cat}`;
                const catReports = domainReports.filter(r => r.module === cat);
                return (
                  <div key={catKey}>
                    <div 
                      onClick={() => toggleCategory(catKey)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px 8px 36px',
                        cursor: 'pointer', color: 'var(--text-muted)',
                        backgroundColor: expandedCategories[catKey] ? 'rgba(0,0,0,0.02)' : 'transparent'
                      }}
                    >
                      <span style={{ fontSize: 8, width: 12 }}>{expandedCategories[catKey] ? '▼' : '▶'}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>📁 {cat}</span>
                    </div>
                    {expandedCategories[catKey] && catReports.map(r => (
                      <div key={r.reportId} style={{ paddingLeft: 40 }}>
                        {renderReportItem(r)}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* MODE: DAILY OPERATIONS */}
        {navigationMode === 'DAILY' && dailyGroups.map(group => {
          const groupReports = visibleReports.filter(r => r.dailyCategory === group);
          return (
            <div key={group} style={{ marginBottom: 12 }}>
              <div style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, color: 'var(--primary-main)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
                {group}
              </div>
              {groupReports.map(r => renderReportItem(r))}
            </div>
          );
        })}

        {/* MODE: BUSINESS PROCESS */}
        {navigationMode === 'PROCESS' && processGroups.map(group => {
          const groupReports = visibleReports.filter(r => r.businessProcess === group);
          return (
            <div key={group} style={{ marginBottom: 12 }}>
              <div style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, color: '#f39c12', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
                {group}
              </div>
              {/* Render with connecting lines to simulate pipeline */}
              <div style={{ paddingLeft: 16, position: 'relative' }}>
                <div style={{ position: 'absolute', left: 24, top: 16, bottom: 16, width: 2, background: 'var(--border-main)' }} />
                {groupReports.map((r, i) => (
                  <div key={r.reportId} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 16, height: 2, background: 'var(--border-main)', marginLeft: 8 }} />
                    <div style={{ flex: 1 }}>{renderReportItem(r)}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {visibleReports.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
            No authorized reports found for the current role and criteria.
          </div>
        )}

      </div>
    </div>
  );
}
