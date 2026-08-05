/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * WorkspaceEmptyState — Professional empty state for workspace tabs
 *
 * Displayed when Firebase returns zero records for a domain.
 * Enterprise Rule #14: Empty pages should still feel premium.
 */

import React from 'react';
import { Database, ArrowRight, RefreshCw } from 'lucide-react';

interface WorkspaceEmptyStateProps {
  /** Title of the empty state */
  title?: string;
  /** Description explaining why no data is showing */
  description?: string;
  /** Icon override */
  icon?: React.ReactNode;
  /** Optional action button */
  actionLabel?: string;
  onAction?: () => void;
  /** Retry/refresh handler */
  onRefresh?: () => void;
}

export const WorkspaceEmptyState: React.FC<WorkspaceEmptyStateProps> = ({
  title = 'No operational records found',
  description = 'This workspace will automatically populate with live data once transactions are recorded in the system.',
  icon,
  actionLabel,
  onAction,
  onRefresh,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 shadow-xs flex flex-col items-center justify-center text-center min-h-[280px]">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        {icon || <Database size={24} className="text-slate-400" />}
      </div>

      <h3 className="text-base font-black text-slate-900 mb-1.5">{title}</h3>
      <p className="text-xs font-bold text-slate-500 max-w-md leading-relaxed mb-4">
        {description}
      </p>

      {/* Firebase Live Status */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 mb-4">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
          Connected to Google Firebase • Awaiting Records
        </span>
      </div>

      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        )}
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-4 py-2 rounded-xl bg-[#0B5C3D] text-white text-xs font-black hover:bg-emerald-800 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>{actionLabel}</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>
    </div>
  );
};
