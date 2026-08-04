/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * BankLedgersTab — Commercial Bank Accounts & Uncleared Cheques
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Building2, Plus } from 'lucide-react';

interface BankLedgersTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const BankLedgersTab: React.FC<BankLedgersTabProps> = ({ lang, onOpenInspector }) => {
  const bankLedgers = [
    { accountNo: 'HBL-0012-998811', bankName: 'Habib Bank Limited (HBL Main)', openingBal: 'Rs 2,450,000', totalDeposits: 'Rs 140,000', totalWithdrawals: 'Rs 50,000', bookBalance: 'Rs 2,540,000', unclearedCheques: 'Rs 0', status: 'ACTIVE' },
    { accountNo: 'MCB-0044-112233', bankName: 'MCB Bank Current Account', openingBal: 'Rs 6,500,000', totalDeposits: 'Rs 430,500', totalWithdrawals: 'Rs 150,000', bookBalance: 'Rs 6,780,500', unclearedCheques: 'Rs 150,000', status: 'ACTIVE' },
    { accountNo: 'UBL-0055-667788', bankName: 'United Bank Limited (UBL)', openingBal: 'Rs 5,000,000', totalDeposits: 'Rs 230,000', totalWithdrawals: 'Rs 0', bookBalance: 'Rs 5,230,000', unclearedCheques: 'Rs 0', status: 'ACTIVE' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Building2 size={18} className="text-blue-600" />
            <span>Commercial Bank Accounts Ledger Transactions</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Commercial bank deposits, withdrawals, cheques, and book balance tracking
          </p>
        </div>
        <button className="px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
          <Plus size={15} />
          <span>+ Add Bank Deposit</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'accountNo', header: 'Account Number', headerUr: 'اکاؤنٹ #', accessor: 'accountNo', sortable: true },
            { id: 'bankName', header: 'Bank Name & Branch', headerUr: 'بینک نام', accessor: 'bankName' },
            { id: 'openingBal', header: 'Opening (₨)', headerUr: 'اوپننگ', accessor: 'openingBal' },
            { id: 'totalDeposits', header: 'Deposits (₨)', headerUr: 'ڈیپازٹ', accessor: 'totalDeposits' },
            { id: 'totalWithdrawals', header: 'Withdrawals (₨)', headerUr: 'نکلوائی رقم', accessor: 'totalWithdrawals' },
            { id: 'bookBalance', header: 'Book Balance (₨)', headerUr: 'بک بیلنس', accessor: 'bookBalance' },
            { id: 'unclearedCheques', header: 'Uncleared Cheques', headerUr: 'غیر کلئیر چیکس', accessor: 'unclearedCheques' },
            { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={bankLedgers}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
