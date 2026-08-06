/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * ProductWiseSalesTab — Dedicated Product Share Breakdown Sub-Workspace
 *
 * 100% Google Firebase Realtime Database Driven — Zero Dummy Records.
 * Implements Enterprise Rule #1, #137 & Rule #144
 */

import React, { useMemo } from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { WorkspaceEmptyState } from '../../common/WorkspaceEmptyState';

function formatCurrency(v: number): string {
  return `Rs ${v.toLocaleString('en-PK')}`;
}

// Static class map — Tailwind JIT cannot generate `bg-blue-50/80` / `lg:grid-cols-4`
// from template strings, so interpolated variants must be pre-declared here.
// (Previously every card rendered with no background/border/accent and the grid
// never expanded past 2 columns on desktop.)
const PRODUCT_CARD_STYLE: Record<string, { card: string; label: string; value: string; sub: string }> = {
  blue:    { card: 'bg-blue-50/80 border-blue-200/90',    label: 'text-blue-900', value: 'text-blue-900',    sub: 'text-blue-700' },
  emerald: { card: 'bg-emerald-50/80 border-emerald-200/90', label: 'text-emerald-900', value: 'text-emerald-900', sub: 'text-emerald-700' },
  amber:   { card: 'bg-amber-50/80 border-amber-200/90',  label: 'text-amber-900', value: 'text-amber-900',  sub: 'text-amber-700' },
  purple:  { card: 'bg-purple-50/80 border-purple-200/90', label: 'text-purple-900', value: 'text-purple-900', sub: 'text-purple-700' },
  rose:    { card: 'bg-rose-50/80 border-rose-200/90',    label: 'text-rose-900', value: 'text-rose-900',    sub: 'text-rose-700' },
  sky:     { card: 'bg-sky-50/80 border-sky-200/90',      label: 'text-sky-900', value: 'text-sky-900',      sub: 'text-sky-700' },
};
const PRODUCT_COLORS = ['blue', 'emerald', 'amber', 'purple', 'rose', 'sky'];

interface ProductWiseSalesTabProps {
  salesRows?: Record<string, any>[];
  lang: 'en' | 'ur';
  onSelectRecord?: (record: Record<string, any>) => void;
}

export const ProductWiseSalesTab: React.FC<ProductWiseSalesTabProps> = ({
  salesRows = [],
  lang,
  onSelectRecord,
}) => {
  const isEn = lang === 'en';

  // Compute product-wise breakdown from live sales data
  const productRows = useMemo(() => {
    if (salesRows.length === 0) return [];

    const grouped: Record<string, { liters: number; revenue: number; txns: number; rates: number[] }> = {};

    salesRows.forEach((row) => {
      const product = row.productName || row.product || row.fuelType || 'Unknown';
      if (!grouped[product]) {
        grouped[product] = { liters: 0, revenue: 0, txns: 0, rates: [] };
      }
      grouped[product].liters += Number(row.quantity || row.liters) || 0;
      grouped[product].revenue += Number(row.totalAmount || row.amount) || 0;
      grouped[product].txns += 1;
      const rate = Number(row.rate || row.unitPrice) || 0;
      if (rate > 0) grouped[product].rates.push(rate);
    });

    const totalLiters = Object.values(grouped).reduce((s, g) => s + g.liters, 0);

    return Object.entries(grouped).map(([productName, g]) => ({
      id: productName,
      productName,
      liters: `${g.liters.toLocaleString('en-PK', { maximumFractionDigits: 2 })} L`,
      percentage: totalLiters > 0 ? `${((g.liters / totalLiters) * 100).toFixed(1)}%` : '0%',
      percentageNum: totalLiters > 0 ? (g.liters / totalLiters) * 100 : 0,
      revenue: formatCurrency(g.revenue),
      avgRate: g.rates.length > 0 ? `Rs ${(g.rates.reduce((a, b) => a + b, 0) / g.rates.length).toFixed(2)}/L` : '—',
      txns: g.txns,
    })).sort((a, b) => b.percentageNum - a.percentageNum);
  }, [salesRows]);

  if (productRows.length === 0) {
    return (
      <WorkspaceEmptyState
        title="No Product Sales Data Available"
        description="Product-wise breakdown will automatically populate once fuel sales transactions are recorded in the system."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Product Share KPIs — computed from live data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {productRows.slice(0, 4).map((p, idx) => {
          const color = PRODUCT_CARD_STYLE[PRODUCT_COLORS[idx % PRODUCT_COLORS.length]];
          return (
            <div key={p.id} className={`${color.card} border rounded-2xl p-4 flex flex-col justify-between shadow-xs min-w-0`}>
              <span className={`text-xs font-black ${color.label} truncate`}>{p.productName} Share</span>
              <div className={`text-2xl font-black ${color.value} tracking-tight`}>{p.percentage}</div>
              <span className={`text-[10px] font-extrabold ${color.sub} mt-1`}>{p.liters} Dispensed</span>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          📊 Product-Wise Sales Share & Revenue Breakdown
        </h2>
        <EnterpriseRegisterTable
          columns={[
            { id: 'productName', header: 'Product Name', headerUr: 'پروڈکٹ نام', accessor: 'productName', sortable: true },
            { id: 'liters', header: 'Liters Dispensed', headerUr: 'خارج شدہ لیٹرز', accessor: 'liters' },
            { id: 'percentage', header: 'Sales Share %', headerUr: 'سیلز حصہ %', accessor: 'percentage' },
            { id: 'revenue', header: 'Total Revenue (₨)', headerUr: 'کل آمدن', accessor: 'revenue' },
            { id: 'avgRate', header: 'Avg Retail Price', headerUr: 'اوسط قیمت', accessor: 'avgRate' },
            { id: 'txns', header: 'Txns Count', headerUr: 'ٹرانزیکشنز', accessor: 'txns', isNumeric: true },
          ]}
          data={productRows}
          language={lang}
          onRowClick={(row) => onSelectRecord?.(row)}
        />
      </div>
    </div>
  );
};
