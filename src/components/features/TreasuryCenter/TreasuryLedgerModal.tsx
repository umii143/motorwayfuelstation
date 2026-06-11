import React, { useState, useEffect } from 'react';
import { X, Search, Filter, Calendar, FileText, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { TreasuryLedgerLine, getAccountLedger, TreasuryAccountType } from '../../../services/core/treasuryEngine';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              {title} Ledger
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Detailed transaction history</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <span className="text-gray-400">to</span>
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button 
            onClick={loadLedger}
            className="px-4 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 font-medium rounded-lg text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            Apply Filters
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : ledgerLines.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No transactions found for this period.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50 dark:text-gray-400 sticky top-0">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right text-green-600">Cash In</th>
                  <th className="px-4 py-3 text-right text-red-600">Cash Out</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {ledgerLines.map(line => (
                  <tr key={line.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {new Date(line.date).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-semibold capitalize">
                        {line.txnType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white max-w-md truncate" title={line.description}>
                      {line.description}
                      {line.performedBy && <div className="text-xs text-gray-400">By: {line.performedBy}</div>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">
                      {line.cashIn > 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          <ArrowDownRight className="h-3.5 w-3.5" />
                          {line.cashIn.toLocaleString()}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-red-600">
                      {line.cashOut > 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          {line.cashOut.toLocaleString()}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                      Rs {line.runningBalance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
