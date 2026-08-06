/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * CustomerLedgerTab — Transactional Customer Ledger & Double-Entry Receipts
 *
 * 100% Google Firebase Realtime Database Driven — Zero Dummy Records.
 * Implements Enterprise Rules #1, #166 & #167
 */

import React, { useMemo } from 'react';
import { CustomerEnrichedRecord } from '../../../../../../lib/reports-v2/engines/LedgerEngine';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { BookOpen, Plus } from 'lucide-react';
import { WorkspaceEmptyState } from '../../common/WorkspaceEmptyState';
import { WorkspaceLoadingSkeleton } from '../../common/WorkspaceLoadingSkeleton';
import { useWorkspaceFirebaseData } from '../../../hooks/useWorkspaceFirebaseData';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

interface CustomerLedgerTabProps {
  customers: CustomerEnrichedRecord[];
  lang: 'en' | 'ur';
  orgId?: string;
  stationId?: string;
  onOpenInspector: (record: Record<string, any>) => void;
  onOpenPaymentModal?: (customer: CustomerEnrichedRecord) => void;
}

export const CustomerLedgerTab: React.FC<CustomerLedgerTabProps> = ({
  customers,
  lang,
  orgId,
  stationId,
  onOpenInspector,
  onOpenPaymentModal,
}) => {
  const isEn = lang === 'en';

  // Fetch live sales and journal entries for customer ledger
  const { data: salesData, loading: salesLoading } = useWorkspaceFirebaseData('SALES', { orgId, stationId });
  const { data: journalEntries, loading: jeLoading } = useWorkspaceFirebaseData('JOURNAL_ENTRIES', { orgId, stationId });

  const loading = salesLoading || jeLoading;

  // Build ledger entries from live Firebase data
  const ledgerEntries = useMemo(() => {
    const entries: Record<string, any>[] = [];

    // From sales (credit sales = debits to customer)
    salesData
      .filter(s => s.customerName || s.customerId || s.paymentMethod === 'Credit')
      .forEach(s => {
        entries.push({
          date: s.date || s.timestamp || s.createdAt || '—',
          voucherNo: s.invoiceNo || s.voucherNo || s._id,
          customerName: s.customerName || s.customer || '—',
          description: s.description || `${s.productName || s.product || 'Fuel'} ${s.quantity || ''}L dispense`,
          debit: formatCurrency(Number(s.totalAmount || s.amount) || 0),
          credit: formatCurrency(0),
          runningBalance: formatCurrency(Number(s.runningBalance || s.balance) || 0),
        });
      });

    // From journal entries (customer payments/receipts)
    journalEntries
      .filter(je => je.type === 'CUSTOMER_PAYMENT' || je.type === 'CUSTOMER_RECEIPT' || je.category === 'customer')
      .forEach(je => {
        entries.push({
          date: je.date || je.timestamp || je.createdAt || '—',
          voucherNo: je.voucherNo || je.receiptNo || je._id,
          customerName: je.customerName || je.payer || '—',
          description: je.narration || je.description || 'Payment received',
          debit: formatCurrency(0),
          credit: formatCurrency(Number(je.amount || je.creditAmount) || 0),
          runningBalance: formatCurrency(Number(je.runningBalance || je.balance) || 0),
        });
      });

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [salesData, journalEntries]);

  if (loading) {
    return <WorkspaceLoadingSkeleton kpiCount={0} rowCount={5} />;
  }

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <BookOpen size={18} className="text-primary" />
            <span>Customer Accounts Double-Entry Ledger History</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Immutable transaction history of sales invoices, fuel dispensations, and recovery receipts
          </p>
        </div>

        {customers.length > 0 && (
          <button
            onClick={() => onOpenPaymentModal?.(customers[0])}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>+ Record Customer Receipt</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        {ledgerEntries.length === 0 ? (
          <WorkspaceEmptyState
            title="No Customer Ledger Entries"
            description="Customer ledger entries will automatically populate once credit sales and customer payments are recorded in the system."
          />
        ) : (
          <EnterpriseRegisterTable
            columns={[
              { id: 'date', header: 'Date & Time', headerUr: 'تاریخ', accessor: 'date', sortable: true },
              { id: 'voucherNo', header: 'Invoice / Voucher #', headerUr: 'واؤچر #', accessor: 'voucherNo' },
              { id: 'customerName', header: 'Customer Account', headerUr: 'کسٹمر نام', accessor: 'customerName' },
              { id: 'description', header: 'Description / Narration', headerUr: 'تفصیل', accessor: 'description' },
              { id: 'debit', header: 'Debit Sales (₨)', headerUr: 'ڈبیٹ (سیلز)', accessor: 'debit' },
              { id: 'credit', header: 'Credit Payments (₨)', headerUr: 'کریڈٹ (وصولی)', accessor: 'credit' },
              { id: 'runningBalance', header: 'Running Balance', headerUr: 'بیلنس', accessor: 'runningBalance' },
            ]}
            data={ledgerEntries}
            language={lang}
            onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
          />
        )}
      </div>
    </div>
  );
};
