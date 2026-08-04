/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * SupplierLedgersTab — Creditors Payables Ledger & OMC Vendor Cards
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Truck, Plus } from 'lucide-react';

interface SupplierLedgersTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const SupplierLedgersTab: React.FC<SupplierLedgersTabProps> = ({ lang, onOpenInspector }) => {
  const supplierLedgers = [
    { supplierName: 'PSO (Pakistan State Oil)', vendorCode: '210101-001', openingBal: 'Rs 3,450,000', fuelPurchases: 'Rs 5,000,000', paymentsSettled: 'Rs 500,000', netPayable: 'Rs 7,950,000', status: 'ACTIVE' },
    { supplierName: 'Shell Pakistan Limited', vendorCode: '210101-002', openingBal: 'Rs 1,200,000', fuelPurchases: 'Rs 3,741,600', paymentsSettled: 'Rs 1,200,000', netPayable: 'Rs 3,741,600', status: 'ACTIVE' },
    { supplierName: 'Attock Petroleum', vendorCode: '210101-003', openingBal: 'Rs 0', fuelPurchases: 'Rs 4,150,300', paymentsSettled: 'Rs 0', netPayable: 'Rs 4,150,300', status: 'ACTIVE' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Top Supplier KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-black text-slate-500">ACTIVE OMC SUPPLIERS</span>
          <div className="text-xl font-black text-slate-900 mt-1">3 Vendors</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-black text-slate-500">TOTAL OUTSTANDING PAYABLE</span>
          <div className="text-xl font-black text-rose-600 mt-1">Rs 15,841,900</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-black text-slate-500">PAYMENTS SETTLED (MONTH)</span>
          <div className="text-xl font-black text-[#0B5C3D] mt-1">Rs 1,700,000</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-black text-slate-500">PAYMENTS DUE TODAY</span>
          <div className="text-xl font-black text-amber-600 mt-1">1 Supplier</div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Truck size={18} className="text-[#0B5C3D]" />
            <span>Accounts Payable Supplier Creditors Ledgers</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Oil Marketing Company vendor payables, fuel purchase invoices, and payment settlements
          </p>
        </div>
        <button className="px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
          <Plus size={15} />
          <span>+ Settle Supplier Payment</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'supplierName', header: 'Supplier Name', headerUr: 'سپلائر', accessor: 'supplierName', sortable: true },
            { id: 'vendorCode', header: 'Vendor Code', headerUr: 'کوڈ', accessor: 'vendorCode' },
            { id: 'openingBal', header: 'Opening (₨)', headerUr: 'اوپننگ', accessor: 'openingBal' },
            { id: 'fuelPurchases', header: 'Fuel Purchases', headerUr: 'خریداری انوائس', accessor: 'fuelPurchases' },
            { id: 'paymentsSettled', header: 'Payments Settled', headerUr: 'ادائیگی', accessor: 'paymentsSettled' },
            { id: 'netPayable', header: 'Net Payable (₨)', headerUr: 'واجب الادا بقایا', accessor: 'netPayable' },
            { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={supplierLedgers}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
