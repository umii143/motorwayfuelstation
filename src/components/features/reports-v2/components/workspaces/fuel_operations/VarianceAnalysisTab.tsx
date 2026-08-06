/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * VarianceAnalysisTab — Dedicated Operational Variance Audit Sub-Workspace
 *
 * 100% Google Firebase Realtime Database Driven — Zero Dummy Records.
 * Implements Enterprise Rule #1, #137 & Rule #144
 */

import React, { useMemo } from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { ShieldCheck } from 'lucide-react';
import { WorkspaceEmptyState } from '../../common/WorkspaceEmptyState';
import { WorkspaceLoadingSkeleton } from '../../common/WorkspaceLoadingSkeleton';
import { useWorkspaceFirebaseData } from '../../../hooks/useWorkspaceFirebaseData';

function formatCurrency(v: number): string {
  return `Rs ${v.toLocaleString('en-PK')}`;
}

interface VarianceAnalysisTabProps {
  salesRows?: Record<string, any>[];
  lang: 'en' | 'ur';
  orgId?: string;
  stationId?: string;
  onSelectRecord?: (record: Record<string, any>) => void;
}

export const VarianceAnalysisTab: React.FC<VarianceAnalysisTabProps> = ({
  salesRows = [],
  lang,
  orgId,
  stationId,
  onSelectRecord,
}) => {
  const isEn = lang === 'en';

  // Fetch cash ledger and tank readings for variance computation
  const { data: cashLedger, loading: cashLoading } = useWorkspaceFirebaseData('CASH_LEDGER', { orgId, stationId });
  const { data: tankReadings, loading: tankLoading } = useWorkspaceFirebaseData('TANK_READINGS', { orgId, stationId });

  const loading = cashLoading || tankLoading;

  // Compute variance audits from live data
  const varianceAudits = useMemo(() => {
    const audits: Record<string, any>[] = [];

    // Cash collection variance from cash ledger
    const reconciliationRecords = cashLedger.filter(r => r.type === 'RECONCILIATION' || r.reconciliationStatus);
    reconciliationRecords.forEach(r => {
      const expected = Number(r.expectedCash || r.expected) || 0;
      const actual = Number(r.physicalCash || r.actual) || 0;
      const diff = actual - expected;
      audits.push({
        id: r._id || `VAR-CASH-${r.shiftId}`,
        category: 'Cash Collection Variance',
        expected: formatCurrency(expected),
        actual: formatCurrency(actual),
        difference: formatCurrency(diff),
        status: diff === 0 ? 'AUDIT_VERIFIED_OK' : 'VARIANCE_FLAGGED',
      });
    });

    // Nozzle/tank variance from tank readings
    const dipPairs = tankReadings.filter(r => r.varianceStatus || r.varianceLiters !== undefined);
    dipPairs.forEach(r => {
      const expected = Number(r.expectedStock || r.systemStock) || 0;
      const actual = Number(r.actualStock || r.dipStock || r.physicalStock) || 0;
      const diff = actual - expected;
      audits.push({
        id: r._id || `VAR-TANK-${r.tankId}`,
        category: `${r.tankName || r.product || 'Tank'} Stock Variance`,
        expected: `${expected.toLocaleString()} L`,
        actual: `${actual.toLocaleString()} L`,
        difference: `${diff.toFixed(2)} L`,
        status: Math.abs(diff) < 1 ? 'AUDIT_VERIFIED_OK' : 'VARIANCE_FLAGGED',
      });
    });

    return audits;
  }, [cashLedger, tankReadings]);

  // Compute KPIs from live data
  const cashVariance = useMemo(() => {
    return varianceAudits
      .filter(a => a.category.includes('Cash'))
      .reduce((sum, a) => sum + (Number(a.difference?.replace(/[^0-9.-]/g, '')) || 0), 0);
  }, [varianceAudits]);

  const stockVariance = useMemo(() => {
    return varianceAudits
      .filter(a => !a.category.includes('Cash'))
      .reduce((sum, a) => sum + (Number(a.difference?.replace(/[^0-9.-]/g, '')) || 0), 0);
  }, [varianceAudits]);

  const auditStatus = varianceAudits.length > 0 && varianceAudits.every(a => a.status === 'AUDIT_VERIFIED_OK') ? 'PASSED' : varianceAudits.length === 0 ? 'NO DATA' : 'REVIEW NEEDED';

  if (loading) {
    return <WorkspaceLoadingSkeleton kpiCount={3} rowCount={3} />;
  }

  if (varianceAudits.length === 0) {
    return (
      <WorkspaceEmptyState
        title="No Variance Records Available"
        description="Operational cash and stock variance records will populate here once shift reconciliations and tank dip readings are recorded."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* AUDIT SUMMARY KPIS — computed from live data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className={`${cashVariance === 0 ? 'bg-primary/10 border-primary/25' : 'bg-red-50/80 border-red-200/90'} border rounded-2xl p-4 flex flex-col justify-between shadow-xs`}>
          <span className={`text-xs font-black ${cashVariance === 0 ? 'text-primary' : 'text-red-900'}`}>Total Cash Variance</span>
          <div className={`text-2xl font-black ${cashVariance === 0 ? 'text-primary' : 'text-red-600'} tracking-tight`}>{formatCurrency(cashVariance)}</div>
          <span className={`text-[10px] font-extrabold ${cashVariance === 0 ? 'text-primary' : 'text-red-700'} mt-1`}>{cashVariance === 0 ? '100% Cash Matched' : 'Discrepancy Detected'}</span>
        </div>

        <div className={`${stockVariance === 0 ? 'bg-primary/10 border-primary/25' : 'bg-amber-50/80 border-amber-200/90'} border rounded-2xl p-4 flex flex-col justify-between shadow-xs`}>
          <span className={`text-xs font-black ${stockVariance === 0 ? 'text-primary' : 'text-amber-900'}`}>Total Stock Variance</span>
          <div className={`text-2xl font-black ${stockVariance === 0 ? 'text-primary' : 'text-amber-800'} tracking-tight`}>{stockVariance.toFixed(2)} L</div>
          <span className={`text-[10px] font-extrabold ${stockVariance === 0 ? 'text-primary' : 'text-amber-700'} mt-1`}>{stockVariance === 0 ? '100% Stock Matched' : 'Variance Flagged'}</span>
        </div>

        <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-blue-900">Audit Status</span>
          <div className="text-xl font-black text-blue-900 tracking-tight">{auditStatus}</div>
          <span className="text-[10px] font-extrabold text-blue-700 mt-1">{varianceAudits.length} records audited</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary" />
          <span>Operational Cash & Stock Discrepancy Audit Log</span>
        </h2>

        <EnterpriseRegisterTable
          columns={[
            { id: 'id', header: 'Audit Code', headerUr: 'آڈٹ کوڈ', accessor: 'id', sortable: true },
            { id: 'category', header: 'Variance Category', headerUr: 'قسم', accessor: 'category' },
            { id: 'expected', header: 'Expected System Value', headerUr: 'ایکسپیکٹڈ', accessor: 'expected' },
            { id: 'actual', header: 'Actual Recorded Value', headerUr: 'فزیکل', accessor: 'actual' },
            { id: 'difference', header: 'Discrepancy / Difference', headerUr: 'فرق', accessor: 'difference' },
            { id: 'status', header: 'Audit Verification', headerUr: 'تصدیق', accessor: 'status' },
          ]}
          data={varianceAudits}
          language={lang}
          onRowClick={(row) => onSelectRecord?.(row)}
        />
      </div>
    </div>
  );
};
