/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * WorkspaceLoadingSkeleton — Enterprise loading skeleton for workspace tabs
 *
 * Enterprise Rule #27: Skeleton Loaders, Progress Indicators, Realtime Status.
 * No frozen screens.
 */

import React from 'react';

interface WorkspaceLoadingSkeletonProps {
  /** Number of KPI card skeletons to show */
  kpiCount?: number;
  /** Number of table row skeletons to show */
  rowCount?: number;
  /** Show chart skeleton area */
  showChart?: boolean;
}

export const WorkspaceLoadingSkeleton: React.FC<WorkspaceLoadingSkeletonProps> = ({
  kpiCount = 4,
  rowCount = 5,
  showChart = false,
}) => {
  return (
    <div className="space-y-4 animate-pulse">
      {/* KPI Card Skeletons */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(kpiCount, 5)} gap-3`}>
        {Array.from({ length: kpiCount }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-xs">
            <div className="flex justify-between items-start mb-3">
              <div className="h-3 w-24 bg-slate-200 rounded-full" />
              <div className="w-8 h-8 rounded-xl bg-slate-100" />
            </div>
            <div className="h-7 w-32 bg-slate-200 rounded-lg mb-2" />
            <div className="h-3 w-20 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>

      {/* Chart Skeleton (optional) */}
      {showChart && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs">
          <div className="h-4 w-48 bg-slate-200 rounded-full mb-4" />
          <div className="h-44 w-full bg-slate-50 rounded-xl border border-slate-100" />
        </div>
      )}

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-5 shadow-xs space-y-3">
        {/* Table Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-56 bg-slate-200 rounded-full" />
          <div className="h-8 w-32 bg-slate-100 rounded-xl" />
        </div>

        {/* Header Row */}
        <div className="flex items-center gap-4 py-2 border-b border-slate-100">
          {[120, 80, 100, 70, 90, 60].map((w, i) => (
            <div key={i} className="h-3 bg-slate-200 rounded-full" style={{ width: w }} />
          ))}
        </div>

        {/* Data Rows */}
        {Array.from({ length: rowCount }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2.5 border-b border-slate-50">
            {[120, 80, 100, 70, 90, 60].map((w, j) => (
              <div key={j} className="h-3 bg-slate-100 rounded-full" style={{ width: w - (i % 2 === 0 ? 10 : 0) }} />
            ))}
          </div>
        ))}
      </div>

      {/* Loading Status Bar */}
      <div className="flex items-center justify-center gap-2 py-2">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
          Fetching Live Data from Google Firebase...
        </span>
      </div>
    </div>
  );
};
