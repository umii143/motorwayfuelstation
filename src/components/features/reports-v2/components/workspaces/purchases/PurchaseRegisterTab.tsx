/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * PurchaseRegisterTab — Purchase Invoices Register Table & Inspection
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { ShoppingCart, Plus } from 'lucide-react';

interface PurchaseRegisterTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const PurchaseRegisterTab: React.FC<PurchaseRegisterTabProps> = ({
  lang,
  onOpenInspector,
}) => {
  const purchaseInvoices = [
    { invNo: 'INV-2025-0515-001', date: 'May 15, 2025', supplier: 'PSO', product: 'Super Petrol', liters: '16,000.00 L', rate: 'Rs 296.45', amount: 'Rs 4,743,200', tax: 'Rs 474,320', status: 'VERIFIED', payment: 'PARTIAL' },
    { invNo: 'INV-2025-0515-002', date: 'May 15, 2025', supplier: 'Shell', product: 'High Speed Diesel', liters: '12,000.00 L', rate: 'Rs 311.80', amount: 'Rs 3,741,600', tax: 'Rs 374,160', status: 'VERIFIED', payment: 'UNPAID' },
    { invNo: 'INV-2025-0514-003', date: 'May 14, 2025', supplier: 'Attock', product: 'Super Petrol', liters: '14,000.00 L', rate: 'Rs 296.45', amount: 'Rs 4,150,300', tax: 'Rs 415,030', status: 'VERIFIED', payment: 'UNPAID' },
    { invNo: 'INV-2025-0514-004', date: 'May 14, 2025', supplier: 'Total', product: 'High Speed Diesel', liters: '18,000.00 L', rate: 'Rs 312.10', amount: 'Rs 5,617,800', tax: 'Rs 561,780', status: 'VERIFIED', payment: 'PAID' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <ShoppingCart size={18} className="text-purple-600" />
            <span>Purchase Invoices Register</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Verified OMC fuel purchase invoices and landed cost calculations
          </p>
        </div>
        <button className="px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
          <Plus size={15} />
          <span>+ Record Purchase Invoice</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'invNo', header: 'Invoice #', headerUr: 'انواائس #', accessor: 'invNo', sortable: true },
            { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date' },
            { id: 'supplier', header: 'Supplier', headerUr: 'سپلائر', accessor: 'supplier' },
            { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'product' },
            { id: 'liters', header: 'Quantity (L)', headerUr: 'لیٹرز', accessor: 'liters' },
            { id: 'rate', header: 'Rate/L', headerUr: 'ریٹ', accessor: 'rate' },
            { id: 'amount', header: 'Amount (₨)', headerUr: 'رقم', accessor: 'amount' },
            { id: 'status', header: 'Verification', headerUr: 'پڑتال', accessor: 'status' },
            { id: 'payment', header: 'Payment', headerUr: 'ادائیگی', accessor: 'payment' },
          ]}
          data={purchaseInvoices}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
