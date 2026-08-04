/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * BankAccountsTab — Commercial Bank Accounts Register & Reconciliation
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Building2, Plus } from 'lucide-react';

interface BankAccountsTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const BankAccountsTab: React.FC<BankAccountsTabProps> = ({
  lang,
  onOpenInspector,
}) => {
  const bankAccounts = [
    { accountNo: 'HBL-0012-998811', bankName: 'Habib Bank Limited (HBL Main)', currentBalance: 'Rs 8,450,000', unclearedCheques: 'Rs 0', lastReconciled: 'May 14, 2025', status: 'ACTIVE' },
    { accountNo: 'MCB-0044-112233', bankName: 'MCB Bank Current Account', currentBalance: 'Rs 6,780,500', unclearedCheques: 'Rs 150,000', lastReconciled: 'May 14, 2025', status: 'ACTIVE' },
    { accountNo: 'UBL-0055-667788', bankName: 'United Bank Limited (UBL Operational)', currentBalance: 'Rs 5,230,000', unclearedCheques: 'Rs 0', lastReconciled: 'May 13, 2025', status: 'ACTIVE' },
    { accountNo: 'BALF-0099-223344', bankName: 'Bank Alfalah Corporate Account', currentBalance: 'Rs 3,920,000', unclearedCheques: 'Rs 45,000', lastReconciled: 'May 12, 2025', status: 'ACTIVE' },
    { accountNo: 'MEEZ-0088-776655', bankName: 'Meezan Bank Islamic Account', currentBalance: 'Rs 1,400,000', unclearedCheques: 'Rs 0', lastReconciled: 'May 10, 2025', status: 'ACTIVE' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Building2 size={18} className="text-blue-600" />
            <span>Commercial Bank Accounts & Bank Statements</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Commercial bank balances, electronic deposits, and bank reconciliation
          </p>
        </div>
        <button className="px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
          <Plus size={15} />
          <span>+ Add Bank Account</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'accountNo', header: 'Account Number', headerUr: 'اکاؤنٹ نمبر', accessor: 'accountNo', sortable: true },
            { id: 'bankName', header: 'Bank Name & Branch', headerUr: 'بینک نام', accessor: 'bankName' },
            { id: 'currentBalance', header: 'Current Balance (₨)', headerUr: 'موجودہ بیلنس', accessor: 'currentBalance' },
            { id: 'unclearedCheques', header: 'Uncleared Cheques', headerUr: 'غیر کلئیر چیکس', accessor: 'unclearedCheques' },
            { id: 'lastReconciled', header: 'Last Reconciled', headerUr: 'آخری پڑتال', accessor: 'lastReconciled' },
            { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={bankAccounts}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
