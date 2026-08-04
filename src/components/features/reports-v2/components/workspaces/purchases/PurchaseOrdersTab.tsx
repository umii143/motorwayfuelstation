/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * PurchaseOrdersTab — Purchase Orders Master Register & Approval Workflows
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { FileText, Plus } from 'lucide-react';

interface PurchaseOrdersTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const PurchaseOrdersTab: React.FC<PurchaseOrdersTabProps> = ({
  lang,
  onOpenInspector,
}) => {
  const purchaseOrders = [
    { poNo: 'PO-2025-0112', date: 'May 15, 2025', supplier: 'PSO', product: 'Super Petrol', liters: '16,000 L', rate: '296.45', totalAmount: 'Rs 4,743,200', expectedArrival: 'May 15, 09:30 AM', status: 'DISPATCHED' },
    { poNo: 'PO-2025-0111', date: 'May 15, 2025', supplier: 'Shell', product: 'High Speed Diesel', liters: '12,000 L', rate: '311.80', totalAmount: 'Rs 3,741,600', expectedArrival: 'May 15, 11:45 AM', status: 'APPROVED' },
    { poNo: 'PO-2025-0110', date: 'May 14, 2025', supplier: 'Attock', product: 'Super Petrol', liters: '14,000 L', rate: '296.45', totalAmount: 'Rs 4,150,300', expectedArrival: 'May 14, 02:00 PM', status: 'RECEIVED' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <FileText size={18} className="text-[#0B5C3D]" />
            <span>Purchase Orders (PO) Master Register</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Formal supplier procurement orders and delivery tracking
          </p>
        </div>
        <button className="px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
          <Plus size={15} />
          <span>+ Create Purchase Order</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'poNo', header: 'PO Number', headerUr: 'پی او #', accessor: 'poNo', sortable: true },
            { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date' },
            { id: 'supplier', header: 'Supplier', headerUr: 'سپلائر', accessor: 'supplier' },
            { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'product' },
            { id: 'liters', header: 'Quantity (L)', headerUr: 'لیٹرز', accessor: 'liters' },
            { id: 'rate', header: 'Rate/L (₨)', headerUr: 'ریٹ', accessor: 'rate' },
            { id: 'totalAmount', header: 'Total Amount (₨)', headerUr: 'کل رقم', accessor: 'totalAmount' },
            { id: 'expectedArrival', header: 'Expected Arrival', headerUr: 'پہنچنے کا وقت', accessor: 'expectedArrival' },
            { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={purchaseOrders}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
