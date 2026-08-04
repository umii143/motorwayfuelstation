/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * SupplierPerformanceTab — Supplier Quality & On-Time Delivery Matrix
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { ShieldCheck, Truck, Star } from 'lucide-react';

interface SupplierPerformanceTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const SupplierPerformanceTab: React.FC<SupplierPerformanceTabProps> = ({
  lang,
  onOpenInspector,
}) => {
  const scorecard = [
    { supplier: 'PSO (Pakistan State Oil)', totalOrders: '142', avgLeadTime: '3.5 Hours', onTimeDelivery: '98.5%', qualityPassRate: '99.2%', priceStabilityScore: '96.0%', rating: '5.0 ★★★★★', preferredStatus: 'PRIMARY_SUPPLIER' },
    { supplier: 'Shell Pakistan', totalOrders: '88', avgLeadTime: '4.1 Hours', onTimeDelivery: '95.2%', qualityPassRate: '98.8%', priceStabilityScore: '94.0%', rating: '4.8 ★★★★☆', preferredStatus: 'SECONDARY_SUPPLIER' },
    { supplier: 'Attock Petroleum', totalOrders: '45', avgLeadTime: '5.0 Hours', onTimeDelivery: '92.0%', qualityPassRate: '97.5%', priceStabilityScore: '91.0%', rating: '4.5 ★★★★☆', preferredStatus: 'APPROVED' },
    { supplier: 'Total Parco Pakistan', totalOrders: '60', avgLeadTime: '4.5 Hours', onTimeDelivery: '94.0%', qualityPassRate: '98.0%', priceStabilityScore: '93.5%', rating: '4.6 ★★★★☆', preferredStatus: 'APPROVED' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Star size={18} className="text-amber-500 fill-amber-500" />
            <span>Enterprise Supplier Performance Matrix & Quality Scorecard</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            On-time delivery OTIF metrics, fuel quality pass rates, lead times, and price stability rankings
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'supplier', header: 'OMC Supplier Name', headerUr: 'سپلائر نام', accessor: 'supplier', sortable: true },
            { id: 'totalOrders', header: 'Total Orders', headerUr: 'کل آرڈرز', accessor: 'totalOrders' },
            { id: 'avgLeadTime', header: 'Avg Lead Time', headerUr: 'ڈلیوری ٹائم', accessor: 'avgLeadTime' },
            { id: 'onTimeDelivery', header: 'On-Time Delivery %', headerUr: 'وقت پر ڈلیوری', accessor: 'onTimeDelivery' },
            { id: 'qualityPassRate', header: 'Quality Pass %', headerUr: 'کوالٹی ٹیسٹ', accessor: 'qualityPassRate' },
            { id: 'priceStabilityScore', header: 'Price Stability', headerUr: 'ریٹ مستقل مزاجی', accessor: 'priceStabilityScore' },
            { id: 'rating', header: 'Rating Score', headerUr: 'ریٹنگ', accessor: 'rating' },
            { id: 'preferredStatus', header: 'Contract Tier', headerUr: 'معاہدہ کیٹیگری', accessor: 'preferredStatus' },
          ]}
          data={scorecard}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
