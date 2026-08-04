import React, { useState } from 'react';

export interface ColumnDef {
  id: string;
  label: string;
  accessor: string;
  type?: 'string' | 'number' | 'currency' | 'date' | 'boolean' | 'badge';
  sortable?: boolean;
}

export interface EnterpriseDataGridProps {
  title: string;
  columns: ColumnDef[];
  data: any[];
  onAction?: (action: string, row: any) => void;
  isLoading?: boolean;
  isEmpty?: boolean;
}

export const EnterpriseDataGrid: React.FC<EnterpriseDataGridProps> = ({
  title, columns, data, onAction, isLoading, isEmpty
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const formatValue = (val: any, type?: string) => {
    if (val === null || val === undefined) return '-';
    if (type === 'currency') return `Rs. ${Number(val).toLocaleString()}`;
    if (type === 'date') return new Date(val).toLocaleDateString();
    if (type === 'badge') {
      return (
        <span style={{
          padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 'bold',
          background: val === 'SUCCESS' ? 'var(--color-success)' : val === 'WARNING' ? 'var(--color-warning)' : 'var(--bg-app)',
          color: val === 'SUCCESS' || val === 'WARNING' ? '#fff' : 'var(--text-main)'
        }}>
          {val}
        </span>
      );
    }
    return String(val);
  };

  const handleActionClick = (action: string, row: any) => {
    setActiveMenuId(null);
    if (onAction) onAction(action, row);
  };

  if (isLoading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 24, marginBottom: 16 }}>🔄 Loading {title}...</div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div style={{ padding: 48, textAlign: 'center', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: 48, opacity: 0.5 }}>📭</div>
        <h3 style={{ color: 'var(--text-main)', marginTop: 16 }}>No Records Found</h3>
        <p style={{ color: 'var(--text-muted)' }}>No data is available for {title} under the current filters.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border-main)', overflow: 'hidden' }}>
      
      {/* Layer A: Enterprise Toolbar */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-main)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)' }}>{title}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btnStyle}>🖨 Print</button>
            <button style={btnStyle}>📤 Export</button>
            <button style={btnStyle}>⚙ Columns</button>
          </div>
        </div>
        
        {/* Universal Filters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-app)', border: '1px solid var(--border-main)', borderRadius: 4, padding: '4px 8px' }}>
            <span>🔍</span>
            <input 
              type="text" 
              placeholder="Global Search..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', marginLeft: 8, color: 'var(--text-main)' }}
            />
          </div>
          <select style={selectStyle}><option>All Dates (Lifetime)</option><option>Today</option><option>Yesterday</option></select>
          <select style={selectStyle}><option>All Branches</option></select>
          <select style={selectStyle}><option>All Users</option></select>
          <select style={selectStyle}><option>All Products</option></select>
          <button style={{ ...btnStyle, color: 'var(--color-primary)' }}>+ Add Smart Filter</button>
        </div>
      </div>

      {/* Layer B: Enterprise Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-app)', zIndex: 1, boxShadow: '0 1px 0 var(--border-main)' }}>
            <tr>
              {columns.map(col => (
                <th key={col.id} style={{ padding: '12px 16px', fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {col.label}
                </th>
              ))}
              <th style={{ padding: '12px 16px', width: 60, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={row.id || idx} style={{ borderBottom: '1px solid var(--border-subtle)', background: idx % 2 === 0 ? 'var(--bg-card)' : 'rgba(0,0,0,0.01)' }}>
                {columns.map(col => (
                  <td key={col.id} style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-main)' }}>
                    {formatValue(row[col.accessor], col.type)}
                  </td>
                ))}
                <td style={{ padding: '12px 16px', textAlign: 'center', position: 'relative' }}>
                  <button 
                    onClick={() => setActiveMenuId(activeMenuId === row.id ? null : row.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)' }}
                  >
                    ⋮
                  </button>

                  {/* Layer C: Golden Rule Actions Menu */}
                  {activeMenuId === row.id && (
                    <div style={{
                      position: 'absolute', right: 40, top: 12, width: 220, background: 'var(--bg-card)', 
                      border: '1px solid var(--border-main)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      zIndex: 10, display: 'flex', flexDirection: 'column', textAlign: 'left', padding: '8px 0'
                    }}>
                      <div style={{ padding: '4px 16px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Standard</div>
                      <MenuItem icon="👁" label="View Details" onClick={() => handleActionClick('VIEW', row)} />
                      <MenuItem icon="✏" label="Edit Record" onClick={() => handleActionClick('EDIT', row)} />
                      <MenuItem icon="📄" label="View Voucher" onClick={() => handleActionClick('VOUCHER', row)} />
                      
                      <div style={{ margin: '4px 0', borderTop: '1px solid var(--border-subtle)' }} />
                      <div style={{ padding: '4px 16px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>N-Level Drilldown</div>
                      <MenuItem icon="📚" label="View Ledger Entry" onClick={() => handleActionClick('LEDGER', row)} />
                      <MenuItem icon="📜" label="View Journal" onClick={() => handleActionClick('JOURNAL', row)} />
                      <MenuItem icon="🕒" label="View Timeline" onClick={() => handleActionClick('TIMELINE', row)} />
                      
                      <div style={{ margin: '4px 0', borderTop: '1px solid var(--border-subtle)' }} />
                      <div style={{ padding: '4px 16px', fontSize: 10, fontWeight: 700, color: 'var(--color-warning)', textTransform: 'uppercase' }}>System Truth</div>
                      <MenuItem icon="🔍" label="Raw Firebase Document" onClick={() => handleActionClick('RAW_JSON', row)} />
                      <MenuItem icon="📋" label="View Audit Trail" onClick={() => handleActionClick('AUDIT', row)} />
                      <MenuItem icon="ⓘ" label="Explain This Record" onClick={() => handleActionClick('EXPLAIN', row)} />

                      <div style={{ margin: '4px 0', borderTop: '1px solid var(--border-subtle)' }} />
                      <MenuItem icon="🗑" label="Delete (Requires Admin)" color="var(--color-danger)" onClick={() => handleActionClick('DELETE', row)} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MenuItem = ({ icon, label, onClick, color = 'var(--text-main)' }: { icon: string, label: string, onClick: () => void, color?: string }) => (
  <button 
    onClick={onClick}
    style={{ 
      display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', 
      background: 'transparent', border: 'none', cursor: 'pointer',
      width: '100%', textAlign: 'left', fontSize: 13, color 
    }}
  >
    <span style={{ fontSize: 14 }}>{icon}</span> {label}
  </button>
);

const btnStyle: React.CSSProperties = {
  background: 'var(--bg-app)', border: '1px solid var(--border-main)', padding: '6px 12px',
  borderRadius: 4, cursor: 'pointer', fontSize: 12, color: 'var(--text-main)'
};

const selectStyle: React.CSSProperties = {
  ...btnStyle, padding: '6px 28px 6px 12px', appearance: 'none', 
  backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23999%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '8px auto'
};
