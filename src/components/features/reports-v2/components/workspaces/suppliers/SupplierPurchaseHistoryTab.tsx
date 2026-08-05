/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * SupplierPurchaseHistoryTab — Fuel Bowser Deliveries & Purchase Invoice Registry
 *
 * Implements Enterprise Rules #168 & #169
 */

import React from 'react';
import { SupplierEnrichedRecord } from '../../../../../../lib/reports-v2/engines/LedgerEngine';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Truck, Plus } from 'lucide-react';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

interface SupplierPurchaseHistoryTabProps {
  suppliers: SupplierEnrichedRecord[];
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const SupplierPurchaseHistoryTab: React.FC<SupplierPurchaseHistoryTabProps> = ({
  suppliers,
  lang,
  onOpenInspector,
}) => {
  const isEn = lang === 'en';

  const historyRows = [
    { date: 'May 15, 2025 09:15 AM', bowserNo: 'BW-9911-LHR', supplierName: 'PSO Pakistan State Oil', product: 'Premier Euro 5 Super Petrol', liters: '15,000 L', rate: '₨ 280.00 / L', totalAmount: 'Rs 4,200,000', grnNo: 'GRN-2025-0515-01', status: 'VERIFIED_OFFLOADED' },
    { date: 'May 12, 2025 11:30 AM', bowserNo: 'BW-8822-[#0B5C3D]', supplierName: 'Shell Pakistan Limited', product: 'High Speed Diesel (HSD)', liters: '20,000 L', rate: '₨ 270.00 / L', totalAmount: 'Rs 5,400,000', grnNo: 'GRN-2025-0512-04', status: 'VERIFIED_OFFLOADED' },
    { date: 'May 08, 2025 04:00 PM', bowserNo: 'BW-7733-ISL', supplierName: 'Attock Petroleum', product: 'Premier Euro 5 Super Petrol', liters: '10,000 L', rate: '₨ 281.50 / L', totalAmount: 'Rs 2,815,000', grnNo: 'GRN-2025-0508-02', status: 'VERIFIED_OFFLOADED' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Truck size={18} className="text-blue-600" />
            <span>Refinery Bowser Deliveries & Fuel Purchase History</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Complete registry of offloaded fuel bowsers, dip chamber verification, unit purchase rates, and GRN receipts
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'date', header: 'Delivery Date', headerUr: 'تاریخ', accessor: 'date', sortable: true },
            { id: 'bowserNo', header: 'Bowser / Truck #', headerUr: 'باؤچر #', accessor: 'bowserNo' },
            { id: 'supplierName', header: 'OMC Supplier', headerUr: 'سپلائر', accessor: 'supplierName' },
            { id: 'product', header: 'Fuel Product', headerUr: 'پروڈکٹ', accessor: 'product' },
            { id: 'liters', header: 'Quantity (Liters)', headerUr: 'لیٹرز', accessor: 'liters' },
            { id: 'rate', header: 'Unit Rate (₨/L)', headerUr: 'ریٹ', accessor: 'rate' },
            { id: 'totalAmount', header: 'Total Invoice (₨)', headerUr: 'کل رقم', accessor: 'totalAmount' },
            { id: 'grnNo', header: 'GRN Receipt #', headerUr: 'جی آر این', accessor: 'grnNo' },
            { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={historyRows}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
