import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
          <Skeleton className="mt-4 h-8 w-32" />
          <Skeleton className="mt-2 h-3 w-48" />
        </div>
      ))}
    </div>
  );
}
