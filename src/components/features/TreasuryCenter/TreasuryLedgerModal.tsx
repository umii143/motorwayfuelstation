import React, { useState, useEffect } from 'react';
import { X, Search, Filter, Calendar, FileText, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { TreasuryLedgerLine, getAccountLedger, TreasuryAccountType } from '../../../services/core/treasuryEngine';
import { BottomSheet } from '../../shared/BottomSheet';
import { ResponsiveTable, TableColumn } from '../../shared/ResponsiveTable';

interface TreasuryLedgerModalProps {
  stationId: string;
  accountType: TreasuryAccountType;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TreasuryLedgerModal({ stationId, accountType, title, isOpen, onClose }: TreasuryLedgerModalProps) {
  const [ledgerLines, setLedgerLines] = useState<TreasuryLedgerLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadLedger();
    }
  }, [isOpen, accountType, fromDate, toDate, stationId]);

  const loadLedger = async () => {
    setLoading(true);
    try {
      const fd = fromDate ? new Date(fromDate).toISOString() : undefined;
      const td = toDate ? new Date(toDate + 'T23:59:59.999Z').toISOString() : undefined;
      const lines = await getAccountLedger(stationId, accountType, fd, td);
      setLedgerLines(lines);
    } catch (error) {
      console.error("Failed to load ledger:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const columns: TableColumn<TreasuryLedgerLine>[] = [
    {
      header: 'Date',
      accessor: (row) => new Date(row.date).toLocaleString(),
      isPrimaryMobile: false,
      isSecondaryMobile: false,
    },
    {
      header: 'Description',
      accessor: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.description}</div>
          {row.performedBy && <div className="text-xs text-gray-400">By: {row.performedBy}</div>}
        </div>
      ),
      isPrimaryMobile: true,
    },
    {
      header: 'Type',
      accessor: (row) => (
        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-[10px] font-bold uppercase tracking-wider">
          {row.txnType.replace('_', ' ')}
        </span>
      ),
      isSecondaryMobile: true,
    },
    {
      header: 'Cash In',
      accessor: (row) => row.cashIn > 0 ? (
        <div className="flex items-center justify-end gap-1 text-green-600 font-bold">
          <ArrowDownRight className="h-3.5 w-3.5" />
          {row.cashIn.toLocaleString()}
        </div>
      ) : '-',
      className: 'text-right'
    },
    {
      header: 'Cash Out',
      accessor: (row) => row.cashOut > 0 ? (
        <div className="flex items-center justify-end gap-1 text-red-600 font-bold">
          <ArrowUpRight className="h-3.5 w-3.5" />
          {row.cashOut.toLocaleString()}
        </div>
      ) : '-',
      className: 'text-right'
    },
    {
      header: 'Balance',
      accessor: (row) => <span className="font-bold">Rs {row.runningBalance.toLocaleString()}</span>,
      className: 'text-right text-gray-900'
    }
  ];

  const content = (
    <div className="flex flex-col h-full max-h-[80vh] bg-white">
      {/* Filters */}
      <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <input 
            type="date" 
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <span className="text-gray-400">to</span>
        <div className="flex items-center gap-2">
          <input 
            type="date" 
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button 
          onClick={loadLedger}
          className="px-4 py-1.5 bg-indigo-50 text-indigo-600 font-medium rounded-lg text-sm hover:bg-indigo-100 transition-colors"
        >
          Apply Filters
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <ResponsiveTable
            data={ledgerLines}
            columns={columns}
            keyExtractor={(row) => row.id}
            emptyMessage="No transactions found for this period."
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Modal View */}
      <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                {title} Ledger
              </h2>
              <p className="text-sm text-gray-500 mt-1">Detailed transaction history</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          {content}
        </div>
      </div>

      {/* Mobile Bottom Sheet View */}
      <div className="lg:hidden">
        <BottomSheet 
          isOpen={true} 
          onClose={onClose} 
          title={`${title} Ledger`} 
          snapPoints={['90vh']} 
          allowFullscreen={true}
        >
          {content}
        </BottomSheet>
      </div>
    </>
  );
}
