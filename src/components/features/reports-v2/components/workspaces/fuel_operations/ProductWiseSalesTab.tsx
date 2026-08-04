/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * ProductWiseSalesTab — Dedicated Product Share Breakdown Sub-Workspace
 *
 * Implements Enterprise Rule #137 & Rule #144
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';

interface ProductWiseSalesTabProps {
  lang: 'en' | 'ur';
  onSelectRecord?: (record: Record<string, any>) => void;
}

export const ProductWiseSalesTab: React.FC<ProductWiseSalesTabProps> = ({
  lang,
  onSelectRecord,
}) => {
  const isEn = lang === 'en';

  const productRows = [
    { id: 'p-01', productName: 'Super Petrol', liters: '2,250.65 L', percentage: '47.4%', revenue: 'Rs 641,435', avgRate: 'Rs 285.00/L', txns: 185 },
    { id: 'p-02', productName: 'High Speed Diesel', liters: '2,150.30 L', percentage: '45.3%', revenue: 'Rs 591,332', avgRate: 'Rs 275.00/L', txns: 120 },
    { id: 'p-03', productName: 'Kerosene Oil', liters: '189.30 L', percentage: '4.0%', revenue: 'Rs 45,432', avgRate: 'Rs 240.00/L', txns: 32 },
    { id: 'p-04', productName: 'Lubricants & Engine Oil', liters: '160.00 L', percentage: '3.3%', revenue: 'Rs 128,000', avgRate: 'Rs 800.00/L', txns: 19 },
  ];

  return (
    <div className="space-y-4">
      {/* Product Share KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-blue-900">Super Petrol Share</span>
          <div className="text-2xl font-black text-blue-900 tracking-tight">47.4%</div>
          <span className="text-[10px] font-extrabold text-blue-700 mt-1">2,250.65 L Dispensed</span>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-emerald-900">High Speed Diesel Share</span>
          <div className="text-2xl font-black text-[#0B5C3D] tracking-tight">45.3%</div>
          <span className="text-[10px] font-extrabold text-emerald-700 mt-1">2,150.30 L Dispensed</span>
        </div>

        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-amber-900">Kerosene Share</span>
          <div className="text-2xl font-black text-amber-900 tracking-tight">4.0%</div>
          <span className="text-[10px] font-extrabold text-amber-700 mt-1">189.30 L Dispensed</span>
        </div>

        <div className="bg-purple-50/80 border border-purple-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-purple-900">Lubricants Share</span>
          <div className="text-2xl font-black text-purple-900 tracking-tight">3.3%</div>
          <span className="text-[10px] font-extrabold text-purple-700 mt-1">160.00 L Dispensed</span>
        </div>
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
