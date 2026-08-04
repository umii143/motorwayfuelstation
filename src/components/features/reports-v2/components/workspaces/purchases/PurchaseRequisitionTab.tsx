/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * PurchaseRequisitionTab — AI Purchase Requisition Generator & Low Stock Reorder Advisor
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Sparkles, Plus } from 'lucide-react';

interface PurchaseRequisitionTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const PurchaseRequisitionTab: React.FC<PurchaseRequisitionTabProps> = ({
  lang,
  onOpenInspector,
}) => {
  const requisitions = [
    { reqNo: 'REQ-2025-0045', date: 'May 15, 2025', product: 'Super Petrol', currentStock: '2,000 L', minStock: '4,000 L', recommendedQty: '18,000 L', suggestedSupplier: 'PSO', priority: 'HIGH', status: 'RECOMMENDED' },
    { reqNo: 'REQ-2025-0044', date: 'May 14, 2025', product: 'High Speed Diesel', currentStock: '5,500 L', minStock: '6,000 L', recommendedQty: '14,000 L', suggestedSupplier: 'Shell', priority: 'MEDIUM', status: 'APPROVED' },
    { reqNo: 'REQ-2025-0043', date: 'May 12, 2025', product: 'Kerosene Oil', currentStock: '1,200 L', minStock: '2,000 L', recommendedQty: '5,000 L', suggestedSupplier: 'Attock', priority: 'NORMAL', status: 'CONVERTED_TO_PO' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            <span>AI Low Stock & Purchase Requisition Generator</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Automated stock threshold monitoring and reorder quantity recommendations
          </p>
        </div>
        <button className="px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
          <Plus size={15} />
          <span>+ Create Requisition</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'reqNo', header: 'Requisition #', headerUr: 'درخواست #', accessor: 'reqNo', sortable: true },
            { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date' },
            { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'product' },
            { id: 'currentStock', header: 'Current Stock', headerUr: 'موجودہ اسٹاک', accessor: 'currentStock' },
            { id: 'minStock', header: 'Min Threshold', headerUr: 'کم از کم حد', accessor: 'minStock' },
            { id: 'recommendedQty', header: 'Recommended Qty', headerUr: 'تجویز کردہ مقدار', accessor: 'recommendedQty' },
            { id: 'suggestedSupplier', header: 'Suggested Supplier', headerUr: 'سپلائر', accessor: 'suggestedSupplier' },
            { id: 'priority', header: 'Priority', headerUr: 'ترجیح', accessor: 'priority' },
            { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={requisitions}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
