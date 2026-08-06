/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * CashReconciliationTab — Dedicated Shift Cash Reconciliation & Settlement Sub-Workspace
 *
 * 100% Google Firebase Realtime Database Driven — Zero Dummy Records.
 * Implements Enterprise Rule #1, #137 & Rule #144
 */

import React, { useState, useMemo } from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { DollarSign, ShieldCheck } from 'lucide-react';
import { WorkspaceEmptyState } from '../../common/WorkspaceEmptyState';
import { WorkspaceLoadingSkeleton } from '../../common/WorkspaceLoadingSkeleton';
import { useWorkspaceFirebaseData } from '../../../hooks/useWorkspaceFirebaseData';

interface CashReconciliationTabProps {
  salesRows?: Record<string, any>[];
  lang: 'en' | 'ur';
  orgId?: string;
  stationId?: string;
  onSelectRecord?: (record: Record<string, any>) => void;
}

export const CashReconciliationTab: React.FC<CashReconciliationTabProps> = ({
  salesRows = [],
  lang,
  orgId,
  stationId,
  onSelectRecord,
}) => {
  const isEn = lang === 'en';

  // Fetch cash ledger records from Firebase
  const { data: cashLedgerData, loading, isEmpty, refetch } = useWorkspaceFirebaseData('CASH_LEDGER', {
    orgId,
    stationId,
  });

  // Compute expected cash from sales rows (cash payment type only)
  const expectedCash = useMemo(() => {
    return salesRows
      .filter(r => {
        const method = (r.paymentMethod || r.paymentMode || '').toLowerCase();
        return method.includes('cash') || method === '';
      })
      .reduce((sum, r) => sum + (Number(r.totalAmount || r.amount) || 0), 0);
  }, [salesRows]);

  const [actualCashInput, setActualCashInput] = useState('');
  const actualCash = Number(actualCashInput) || 0;
  const cashDifference = actualCashInput ? actualCash - expectedCash : 0;

  // Build reconciliation log from cash ledger data
  const reconciliationLogs = useMemo(() => {
    return cashLedgerData
      .filter(r => r.type === 'RECONCILIATION' || r.type === 'SHIFT_CLOSE' || r.reconciliationStatus)
      .map(r => ({
        shiftId: r.shiftId || r._id,
        date: r.date || r.timestamp || r.createdAt || '—',
        cashier: r.cashier || r.operatorName || r.createdBy || '—',
        expectedCash: `Rs ${(Number(r.expectedCash || r.expected) || 0).toLocaleString()}`,
        physicalCash: `Rs ${(Number(r.physicalCash || r.actual) || 0).toLocaleString()}`,
        difference: `Rs ${(Number(r.difference || r.variance) || 0).toLocaleString()}`,
        status: r.status || r.reconciliationStatus || 'PENDING',
      }));
  }, [cashLedgerData]);

  if (loading) {
    return <WorkspaceLoadingSkeleton kpiCount={4} rowCount={3} />;
  }

  return (
    <div className="space-y-4">
      {/* CASH RECONCILIATION SUMMARY CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <DollarSign size={18} className="text-primary" />
              <span>Shift Cash Reconciliation & Physical Cash Count</span>
            </h2>
            <p className="text-xs font-bold text-slate-400">Reconcile physical cash drawer balance against expected system sales</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-black border ${
            !actualCashInput ? 'bg-slate-100 text-slate-600 border-slate-300' :
            cashDifference === 0 ? 'bg-primary/10 text-primary border-primary/35' :
            'bg-red-100 text-red-800 border-red-300'
          }`}>
            {!actualCashInput ? 'AWAITING COUNT' : cashDifference === 0 ? '✓ BALANCED MATCH' : '⚠ DISCREPANCY'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-bold">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Expected Cash (System)</span>
            <span className="text-lg font-black text-slate-900 mt-1 block">Rs {expectedCash.toLocaleString()}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25">
            <label className="text-primary block text-[11px] font-black mb-1">Physical Cash Count (₨)</label>
            <input
              type="number"
              value={actualCashInput}
              onChange={(e) => setActualCashInput(e.target.value)}
              placeholder="Enter physical count..."
              className="w-full px-3 py-1.5 rounded-lg border border-primary/35 bg-white text-sm font-black text-slate-900 focus:outline-none"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Cash Difference</span>
            <span className={`text-lg font-black mt-1 block ${!actualCashInput ? 'text-slate-400' : cashDifference === 0 ? 'text-primary' : 'text-red-600'}`}>
              {actualCashInput ? `Rs ${cashDifference.toLocaleString()}` : '—'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
            <button className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5">
              <ShieldCheck size={16} />
              <span>Verify & Settle Shift Cash</span>
            </button>
          </div>
        </div>
      </div>

      {/* RECONCILIATION AUDIT LOG TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
          Shift Cash Reconciliation Audit Ledger
        </h3>

        {reconciliationLogs.length === 0 ? (
          <WorkspaceEmptyState
            title="No Reconciliation Records"
            description="Past shift cash reconciliation records will appear here once shifts are closed and cash is verified."
            onRefresh={refetch}
          />
        ) : (
          <EnterpriseRegisterTable
            columns={[
              { id: 'shiftId', header: 'Shift Session ID', headerUr: 'شفٹ سیشن', accessor: 'shiftId', sortable: true },
              { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date' },
              { id: 'cashier', header: 'Cashier / Operator', headerUr: 'کیشیئر', accessor: 'cashier' },
              { id: 'expectedCash', header: 'Expected Cash', headerUr: 'ایکسپیکٹڈ کیش', accessor: 'expectedCash' },
              { id: 'physicalCash', header: 'Physical Cash', headerUr: 'فزیکل کیش', accessor: 'physicalCash' },
              { id: 'difference', header: 'Difference', headerUr: 'فرق', accessor: 'difference' },
              { id: 'status', header: 'Audit Status', headerUr: 'اسٹیٹس', accessor: 'status' },
            ]}
            data={reconciliationLogs}
            language={lang}
            onRowClick={(row) => onSelectRecord?.(row)}
          />
        )}
      </div>
    </div>
  );
};
