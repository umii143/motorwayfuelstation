/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.3 — Enterprise Component Library Framework
 *
 * Enterprise Register Framework.
 * Digital Register UI with Sticky Headers, Zebra Lines, and Row Numbers.
 * No business data.
 */

import React from 'react';
import { EnterpriseComponentRegistry } from '../EnterpriseComponentRegistry';

EnterpriseComponentRegistry.getInstance().register({
  id: 'ECL-REGISTER',
  version: '1.0.0',
  owner: 'ECL Core Team',
  category: 'REGISTER',
  status: 'PRODUCTION',
  accessibility: 'WCAG_AA',
  themeSupport: true
});

export interface EnterpriseRegisterColumn {
  id: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface EnterpriseRegisterProps {
  title: string;
  columns: EnterpriseRegisterColumn[];
  data: any[]; // Placeholder for framework UI rendering
}

export function EnterpriseRegister({ title, columns, data }: EnterpriseRegisterProps) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-main)',
      borderRadius: 'var(--radius-lg, 12px)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Title */}
      <div style={{ padding: '16px 20px', borderBottom: '2px solid var(--border-main)', backgroundColor: 'var(--bg-subtle)' }}>
        <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)', fontWeight: 700 }}>{title}</h3>
      </div>

      {/* Register Table Container */}
      <div style={{ overflowX: 'auto', maxHeight: 400 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          {/* Sticky Header */}
          <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)', zIndex: 1 }}>
            <tr>
              <th style={{ padding: '12px 16px', borderBottom: '2px solid var(--border-main)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, width: 40 }}>#</th>
              {columns.map(col => (
                <th key={col.id} style={{ 
                  padding: '12px 16px', 
                  borderBottom: '2px solid var(--border-main)', 
                  color: 'var(--text-muted)', 
                  fontSize: 12, 
                  fontWeight: 700,
                  textAlign: col.align || 'left',
                  width: col.width
                }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Data Rows (Notebook style horizontal lines & Zebra) */}
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  [ Framework Placeholder: No Records ]
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} style={{ 
                  backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--bg-subtle)',
                  borderBottom: '1px solid var(--border-main)'
                }}>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{idx + 1}</td>
                  {columns.map(col => (
                    <td key={col.id} style={{ 
                      padding: '12px 16px', 
                      fontSize: 13, 
                      color: 'var(--text-main)',
                      textAlign: col.align || 'left'
                    }}>
                      {row[col.id] || '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>

          {/* Totals Footer */}
          <tfoot style={{ position: 'sticky', bottom: 0, backgroundColor: 'var(--bg-app)', borderTop: '2px solid var(--border-main)', zIndex: 1 }}>
            <tr>
              <td colSpan={columns.length + 1} style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
                [ Register Footer Placeholder ]
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
