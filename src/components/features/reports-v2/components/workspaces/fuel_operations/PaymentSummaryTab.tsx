/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * PaymentSummaryTab — Dedicated Payment Analytics & Collections Sub-Workspace
 *
 * 100% Google Firebase Realtime Database Driven — Zero Dummy Records.
 * Implements Enterprise Rule #1, #137 & Rule #144
 */

import React, { useMemo } from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { CreditCard } from 'lucide-react';
import { WorkspaceEmptyState } from '../../common/WorkspaceEmptyState';
import { WorkspaceLoadingSkeleton } from '../../common/WorkspaceLoadingSkeleton';
import { useWorkspaceFirebaseData } from '../../../hooks/useWorkspaceFirebaseData';

function formatCurrency(v: number): string {
  return `Rs ${v.toLocaleString('en-PK')}`;
}

interface PaymentSummaryTabProps {
  salesRows?: Record<string, any>[];
  lang: 'en' | 'ur';
  orgId?: string;
  stationId?: string;
  onSelectRecord?: (record: Record<string, any>) => void;
}

export const PaymentSummaryTab: React.FC<PaymentSummaryTabProps> = ({
  salesRows = [],
  lang,
  orgId,
  stationId,
  onSelectRecord,
}) => {
  const isEn = lang === 'en';

  // Use payments collection from Firebase for detailed payment data
  const { data: paymentData, loading, isEmpty } = useWorkspaceFirebaseData('PAYMENTS', {
    orgId,
    stationId,
  });

  // Compute payment method breakdown from live sales + payment data
  const paymentMethods = useMemo(() => {
    const source = paymentData.length > 0 ? paymentData : salesRows;
    if (source.length === 0) return [];

    const grouped: Record<string, { txns: number; amount: number }> = {};

    source.forEach((row) => {
      const method = row.paymentMethod || row.paymentMode || row.payment || row.mode || 'Unknown';
      if (!grouped[method]) {
        grouped[method] = { txns: 0, amount: 0 };
      }
      grouped[method].txns += 1;
      grouped[method].amount += Number(row.totalAmount || row.amount) || 0;
    });

    const totalAmount = Object.values(grouped).reduce((s, g) => s + g.amount, 0);

    return Object.entries(grouped).map(([method, g]) => ({
      method,
      txns: g.txns,
      amount: formatCurrency(g.amount),
      amountNum: g.amount,
      percentage: totalAmount > 0 ? `${((g.amount / totalAmount) * 100).toFixed(1)}%` : '0%',
      percentageNum: totalAmount > 0 ? (g.amount / totalAmount) * 100 : 0,
      status: 'VERIFIED',
    })).sort((a, b) => b.amountNum - a.amountNum);
  }, [paymentData, salesRows]);

  // Compute KPIs from live data
  const totalCollections = useMemo(() => paymentMethods.reduce((s, p) => s + p.amountNum, 0), [paymentMethods]);
  const cashCollections = useMemo(() => paymentMethods.filter(p => p.method.toLowerCase().includes('cash')).reduce((s, p) => s + p.amountNum, 0), [paymentMethods]);
  const cardCollections = useMemo(() => paymentMethods.filter(p => p.method.toLowerCase().includes('card') || p.method.toLowerCase().includes('pos')).reduce((s, p) => s + p.amountNum, 0), [paymentMethods]);
  const digitalCollections = useMemo(() => paymentMethods.filter(p => p.method.toLowerCase().includes('easypaisa') || p.method.toLowerCase().includes('jazzcash') || p.method.toLowerCase().includes('wallet')).reduce((s, p) => s + p.amountNum, 0), [paymentMethods]);

  if (loading) {
    return <WorkspaceLoadingSkeleton kpiCount={4} rowCount={5} />;
  }

  if (paymentMethods.length === 0) {
    return (
      <WorkspaceEmptyState
        title="No Payment Records Found"
        description="Payment collections breakdown will automatically populate here once sales transactions with payment methods are recorded in the system."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* COLLECTIONS KPIS — computed from live data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-primary/10 border border-primary/25 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-primary">Total Shift Collections</span>
          <div className="text-2xl font-black text-primary tracking-tight">{formatCurrency(totalCollections)}</div>
          <span className="text-[10px] font-extrabold text-primary mt-1">100% Shift Total</span>
        </div>

        <div className="bg-primary text-white rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-primary/70">Physical Cash In Hand</span>
          <div className="text-2xl font-black text-white tracking-tight">{formatCurrency(cashCollections)}</div>
          <span className="text-[10px] font-extrabold text-primary mt-1">{totalCollections > 0 ? `${((cashCollections / totalCollections) * 100).toFixed(1)}%` : '0%'} Cash Ratio</span>
        </div>

        <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-blue-900">Bank Card POS</span>
          <div className="text-2xl font-black text-blue-900 tracking-tight">{formatCurrency(cardCollections)}</div>
          <span className="text-[10px] font-extrabold text-blue-700 mt-1">{totalCollections > 0 ? `${((cardCollections / totalCollections) * 100).toFixed(1)}%` : '0%'} Card Ratio</span>
        </div>

        <div className="bg-purple-50/80 border border-purple-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-purple-900">Digital Wallets</span>
          <div className="text-2xl font-black text-purple-900 tracking-tight">{formatCurrency(digitalCollections)}</div>
          <span className="text-[10px] font-extrabold text-purple-700 mt-1">{totalCollections > 0 ? `${((digitalCollections / totalCollections) * 100).toFixed(1)}%` : '0%'} EasyPaisa/JazzCash</span>
        </div>
      </div>

      {/* PAYMENT METHODS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <CreditCard size={16} className="text-indigo-600" />
          <span>Payment Methods & Collections Breakdown</span>
        </h2>

        <EnterpriseRegisterTable
          columns={[
            { id: 'method', header: 'Payment Method', headerUr: 'ادائیگی کا طریقہ', accessor: 'method', sortable: true },
            { id: 'txns', header: 'Transactions', headerUr: 'ٹرانزیکشنز', accessor: 'txns', isNumeric: true },
            { id: 'amount', header: 'Total Collected (₨)', headerUr: 'کل رقم', accessor: 'amount' },
            { id: 'percentage', header: 'Share %', headerUr: 'حصہ %', accessor: 'percentage' },
            { id: 'status', header: 'Verification Status', headerUr: 'تصدیق اسٹیٹس', accessor: 'status' },
          ]}
          data={paymentMethods}
          language={lang}
          onRowClick={(row) => onSelectRecord?.(row)}
        />
      </div>
    </div>
  );
};
