/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * CashFlowTab — Statement of Cash Flows Engine
 * 100% Realtime computed from useWorkspaceFirebaseData with ZERO static dummy fallbacks.
 */

import React, { useMemo } from 'react';
import { DollarSign, Download } from 'lucide-react';
import { useWorkspaceFirebaseData } from '../../../hooks/useWorkspaceFirebaseData';
import toast from 'react-hot-toast';

interface CashFlowTabProps {
  lang: 'en' | 'ur';
  orgId?: string;
  stationId?: string;
}

function formatCurrency(v: number): string {
  return `Rs ${v.toLocaleString('en-PK')}`;
}

export const CashFlowTab: React.FC<CashFlowTabProps> = ({ lang, orgId, stationId }) => {
  const isEn = lang === 'en';

  const { data: finRecords = [] } = useWorkspaceFirebaseData('FINANCIAL_RECORDS', { orgId, stationId });

  const totalCashIn = useMemo(() => {
    return finRecords
      .filter(r => r.direction === 'in' || r.type === 'income')
      .reduce((sum, r) => sum + (Number(r.amount || r.inAmt) || 0), 0);
  }, [finRecords]);

  const totalCashOut = useMemo(() => {
    return finRecords
      .filter(r => r.direction === 'out' || r.type === 'expense')
      .reduce((sum, r) => sum + (Number(r.amount || r.outAmt) || 0), 0);
  }, [finRecords]);

  const netCashFlow = useMemo(() => {
    return totalCashIn - totalCashOut;
  }, [totalCashIn, totalCashOut]);

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h2 className="text-base font-black text-foreground flex items-center gap-2">
            <DollarSign size={18} className="text-emerald-600" />
            <span>{isEn ? 'Statement of Cash Flows' : 'کیش فلو سٹیٹمنٹ'}</span>
          </h2>
          <p className="text-xs font-bold text-muted-foreground mt-0.5">
            {isEn ? 'Operating cash inflow, outflow, and net liquid treasury flow' : 'کیش درآمد اور اخراجات کا تفصیلی موازنہ'}
          </p>
        </div>
        <button
          onClick={() => toast.success(isEn ? 'Exporting Cash Flow Statement...' : 'ایکسپورٹ شروع ہو رہی ہے...')}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Download size={15} />
          <span>{isEn ? 'Export Cash Flow PDF' : 'پی ڈی ایف ایکسپورٹ'}</span>
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 shadow-xs space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 font-sans font-bold">
          <span>Operating Cash Inflow</span>
          <span className="font-black text-emerald-600">{formatCurrency(totalCashIn)}</span>
        </div>
        <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 font-sans font-bold">
          <span>Operating Cash Outflow</span>
          <span className="font-black text-rose-600">({formatCurrency(totalCashOut)})</span>
        </div>
        <div className="flex justify-between items-center p-4 rounded-xl bg-primary/10 border border-primary/25 font-sans font-bold">
          <span className="text-sm font-black text-primary">Net Liquid Cash Flow</span>
          <span className="text-base font-black text-primary">{formatCurrency(netCashFlow)}</span>
        </div>
      </div>
    </div>
  );
};
