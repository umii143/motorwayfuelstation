import React, { ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TableColumn<T> {
  header: ReactNode;
  accessor: keyof T | ((row: T, index: number) => ReactNode);
  className?: string;
  isPrimaryMobile?: boolean; // Main title on mobile card
  isSecondaryMobile?: boolean; // Subtitle on mobile card
  isHiddenMobile?: boolean; // Hide completely on mobile card
  renderMobile?: (row: T) => ReactNode; // Custom mobile render
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  renderExpandedRow?: (row: T) => ReactNode;
  renderActions?: (row: T) => ReactNode;
  emptyMessage?: string;
}

function ResponsiveTableInner<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  renderExpandedRow,
  renderActions,
  emptyMessage = 'No records found'
}: ResponsiveTableProps<T>) {
  const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({ /* empty */ });

  const toggleRow = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderCellContent = (row: T, index: number, column: TableColumn<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row, index);
    }
    return row[column.accessor] as ReactNode;
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
        <p className="font-semibold">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
            <tr>
              {renderExpandedRow && <th className="px-4 py-3 w-10"></th>}
              {columns.map((col, idx) => (
                <th key={idx} className={`px-4 py-3 ${col.className || ''}`}>{col.header}</th>
              ))}
              {renderActions && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, index) => {
              const key = keyExtractor(row, index);
              const isExpanded = expandedRows[key];
              
              return (
                <React.Fragment key={key}>
                  <tr 
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''} ${isExpanded ? 'bg-slate-50/50' : ''}`}
                  >
                    {renderExpandedRow && (
                      <td className="px-4 py-3">
                        <button onClick={(e) => toggleRow(key, e)} className="p-1 rounded-md hover:bg-slate-200 text-slate-400">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>
                    )}
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className={`px-4 py-3 ${col.className || ''}`}>
                        {renderCellContent(row, index, col)}
                      </td>
                    ))}
                    {renderActions && (
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {renderActions(row)}
                      </td>
                    )}
                  </tr>
                  
                  {isExpanded && renderExpandedRow && (
                    <tr>
                      <td colSpan={columns.length + (renderActions ? 2 : 1)} className="p-0 border-b border-slate-100 bg-slate-50/30">
                        <AnimatePresence>
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 pl-12">
                              {renderExpandedRow(row)}
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-3">
        {data.map((row, index) => {
          const key = keyExtractor(row, index);
          const isExpanded = expandedRows[key];
          
          const primaryCol = columns.find(c => c.isPrimaryMobile) || columns[0];
          const secondaryCol = columns.find(c => c.isSecondaryMobile) || columns[1];
          const otherCols = columns.filter(c => c !== primaryCol && c !== secondaryCol && !c.isHiddenMobile);

          return (
            <div 
              key={key} 
              className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all ${onRowClick ? 'active:scale-[0.98]' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Primary Header */}
                  <div className="font-bold text-slate-800 text-sm mb-0.5 truncate">
                    {primaryCol.renderMobile ? primaryCol.renderMobile(row) : renderCellContent(row, index, primaryCol)}
                  </div>
                  {/* Secondary Header */}
                  {secondaryCol && (
                    <div className="text-xs text-slate-500 font-medium truncate">
                      {secondaryCol.renderMobile ? secondaryCol.renderMobile(row) : renderCellContent(row, index, secondaryCol)}
                    </div>
                  )}
                </div>
                
                {/* Actions / Expand Toggle */}
                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  {renderActions && renderActions(row)}
                  {(renderExpandedRow || otherCols.length > 0) && (
                    <button 
                      onClick={(e) => toggleRow(key, e)} 
                      className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50">
                      {/* Render remaining columns in a 2-col grid */}
                      {otherCols.length > 0 && (
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-3 mt-3">
                          {otherCols.map((col, idx) => (
                            <div key={idx} className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{col.header}</span>
                              <span className="text-xs font-semibold text-slate-700">
                                {col.renderMobile ? col.renderMobile(row) : renderCellContent(row, index, col)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Render custom expanded row content */}
                      {renderExpandedRow && (
                        <div className="mt-3 pt-3 border-t border-slate-200/60">
                          {renderExpandedRow(row)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const ResponsiveTable = React.memo(ResponsiveTableInner) as typeof ResponsiveTableInner;
