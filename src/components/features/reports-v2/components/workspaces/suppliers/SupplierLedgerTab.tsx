/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * SupplierLedgerTab — Transactional Vendor Ledger & Double-Entry Disbursements
 *
 * 100% Google Firebase Realtime Database Driven — Zero Dummy Records.
 * Implements Enterprise Rules #1, #168 & #169
 */

import React, { useMemo } from 'react';
import { SupplierEnrichedRecord } from '../../../../../../lib/reports-v2/engines/LedgerEngine';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { BookOpen, Plus } from 'lucide-react';
import { WorkspaceEmptyState } from '../../common/WorkspaceEmptyState';
import { WorkspaceLoadingSkeleton } from '../../common/WorkspaceLoadingSkeleton';
import { useWorkspaceFirebaseData } from '../../../hooks/useWorkspaceFirebaseData';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

interface SupplierLedgerTabProps {
  suppliers: SupplierEnrichedRecord[];
  lang: 'en' | 'ur';
  orgId?: string;
  stationId?: string;
  onOpenInspector: (record: Record<string, any>) => void;
  onOpenPaymentModal?: (supplier: SupplierEnrichedRecord) => void;
}

export const SupplierLedgerTab: React.FC<SupplierLedgerTabProps> = ({
  suppliers,
  lang,
  orgId,
  stationId,
  onOpenInspector,
  onOpenPaymentModal,
}) => {
  const isEn = lang === 'en';

  // Fetch live journal entries and fuel purchases for supplier ledger
  const { data: journalEntries, loading: jeLoading } = useWorkspaceFirebaseData('JOURNAL_ENTRIES', { orgId, stationId });
  const { data: fuelPurchases, loading: fpLoading } = useWorkspaceFirebaseData('FUEL_PURCHASES', { orgId, stationId });

  const loading = jeLoading || fpLoading;

  // Build ledger entries from live Firebase data
  const ledgerEntries = useMemo(() => {
    const entries: Record<string, any>[] = [];

    // From fuel purchases
    fuelPurchases.forEach(fp => {
      entries.push({
        date: fp.date || fp.timestamp || fp.createdAt || '—',
        voucherNo: fp.invoiceNo || fp.voucherNo || fp._id,
        supplierName: fp.supplierName || fp.supplier || '—',
        description: fp.description || `${fp.product || fp.fuelType || 'Fuel'} ${fp.quantity || ''}L delivery`,
        debit: formatCurrency(0),
        credit: formatCurrency(Number(fp.totalAmount || fp.amount) || 0),
        runningBalance: formatCurrency(Number(fp.runningBalance || fp.balance) || 0),
      });
    });

    // From journal entries (supplier payments)
    journalEntries
      .filter(je => je.type === 'SUPPLIER_PAYMENT' || je.category === 'supplier' || (je.debitAccount || '').includes('Payable'))
      .forEach(je => {
        entries.push({
          date: je.date || je.timestamp || je.createdAt || '—',
          voucherNo: je.voucherNo || je.jvNo || je._id,
          supplierName: je.supplierName || je.payee || '—',
          description: je.narration || je.description || 'Payment settlement',
          debit: formatCurrency(Number(je.amount || je.debitAmount) || 0),
          credit: formatCurrency(0),
          runningBalance: formatCurrency(Number(je.runningBalance || je.balance) || 0),
        });
      });

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [fuelPurchases, journalEntries]);

  if (loading) {
    return <WorkspaceLoadingSkeleton kpiCount={0} rowCount={5} />;
  }

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <BookOpen size={18} className="text-[#0F172A]" />
            <span>Supplier Vendor Accounts Double-Entry Ledger History</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Immutable transaction log of fuel purchases, bowser deliveries, and supplier payment settlements
          </p>
        </div>

        {suppliers.length > 0 && (
          <button
            onClick={() => onOpenPaymentModal?.(suppliers[0])}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>+ Settle Supplier Payment</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        {ledgerEntries.length === 0 ? (
          <WorkspaceEmptyState
            title="No Supplier Ledger Entries"
            description="Supplier ledger entries will automatically populate once fuel purchases and supplier payments are recorded in the system."
          />
        ) : (
          <EnterpriseRegisterTable
            columns={[
              { id: 'date', header: 'Date & Time', headerUr: 'تاریخ', accessor: 'date', sortable: true },
              { id: 'voucherNo', header: 'Invoice / Voucher #', headerUr: 'واؤچر #', accessor: 'voucherNo' },
              { id: 'supplierName', header: 'Supplier Account', headerUr: 'سپلائر نام', accessor: 'supplierName' },
              { id: 'description', header: 'Description / Narration', headerUr: 'تفصیل', accessor: 'description' },
              { id: 'debit', header: 'Debit Payments (₨)', headerUr: 'ڈبیٹ (ادائیگی)', accessor: 'debit' },
              { id: 'credit', header: 'Credit Purchases (₨)', headerUr: 'کریڈٹ (خریداری)', accessor: 'credit' },
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
