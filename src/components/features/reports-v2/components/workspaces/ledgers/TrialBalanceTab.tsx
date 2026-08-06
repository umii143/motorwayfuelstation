/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * TrialBalanceTab — Trial Balance General Ledger Vault
 * 100% Realtime computed from useFinancialStore with ZERO dummy fallbacks.
 */

import React, { useMemo } from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { useFinancialStore } from '../../../../../../stores/useFinancialStore';
import { useShallow } from 'zustand/react/shallow';

interface TrialBalanceTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const TrialBalanceTab: React.FC<TrialBalanceTabProps> = ({ lang, onOpenInspector }) => {
  const isEn = lang === 'en';

  const { banks, digitalAccounts, standaloneExpenses } = useFinancialStore(
    useShallow((state) => ({
      banks: state.banks || [],
      digitalAccounts: state.digitalAccounts || [],
      standaloneExpenses: state.standaloneExpenses || [],
    }))
  );

  const trialBalanceData = useMemo(() => {
    const rows: Record<string, any>[] = [];

    const totalBankBal = banks.reduce((sum, b) => sum + (Number(b.balance || (b as any).currentBalance) || 0), 0);
    const totalWalletBal = digitalAccounts.reduce((sum, w) => sum + (Number(w.balance || (w as any).currentBalance) || 0), 0);
    const totalExp = standaloneExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    if (totalBankBal > 0) {
      rows.push({ code: '110200', accountName: 'Commercial Bank Accounts (Combined)', debit: `Rs ${totalBankBal.toLocaleString('en-PK')}`, credit: '—' });
    }
    if (totalWalletBal > 0) {
      rows.push({ code: '110300', accountName: 'Digital Wallets & Merchant Accounts', debit: `Rs ${totalWalletBal.toLocaleString('en-PK')}`, credit: '—' });
    }
    if (totalExp > 0) {
      rows.push({ code: '510100', accountName: 'Operating Expenses', debit: `Rs ${totalExp.toLocaleString('en-PK')}`, credit: '—' });
    }
    return rows;
  }, [banks, digitalAccounts, standaloneExpenses]);

  return (
    <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs space-y-3 font-sans text-slate-800">
      <h2 className="text-sm font-black text-foreground uppercase tracking-wider">
        Trial Balance General Ledger Vault
      </h2>

      {trialBalanceData.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border text-center">
          <span className="text-4xl mb-3">⚖️</span>
          <h4 className="text-sm font-black text-foreground">{isEn ? 'No Trial Balance Entries' : 'کوئی ٹرائل بیلنس اینٹری نہیں مل سکی'}</h4>
          <p className="text-xs font-bold text-muted-foreground max-w-sm mt-1">
            {isEn ? 'No general ledger account balances found for trial balance.' : 'کوئی اینٹری لاگ نہیں ملی۔'}
          </p>
        </div>
      ) : (
        <EnterpriseRegisterTable
          columns={[
            { id: 'code', header: 'Account Code', headerUr: 'کوڈ', accessor: 'code', sortable: true },
            { id: 'accountName', header: 'Account Name', headerUr: 'اکاؤنٹ نام', accessor: 'accountName', sortable: true },
            { id: 'debit', header: 'Debit Balance (₨)', headerUr: 'ڈیبٹ بیلنس', accessor: 'debit' },
            { id: 'credit', header: 'Credit Balance (₨)', headerUr: 'کریڈٹ بیلنس', accessor: 'credit' },
          ]}
          data={trialBalanceData}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      )}
    </div>
  );
};
