import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-16 border border-dashed border-slate-200 rounded-2xl bg-white space-y-4 max-w-md mx-auto my-6 animate-fade-in shadow-xs">
      {/* Icon Frame - High Definition, minimalist outline */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50/50 text-slate-400 ring-4 ring-slate-50 shadow-inner">
        <Icon className="h-10 w-10" strokeWidth={2} />
      </div>

      {/* Narrative block */}
      <div className="space-y-1">
        <h3 className="font-sans text-sm font-bold text-slate-800 tracking-tight leading-snug">
          {title}
        </h3>
        <p className="font-sans text-xs text-slate-500 max-w-xs leading-normal">
          {description}
        </p>
      </div>

      {/* Responsive execution CTA */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-850 text-white font-sans font-bold text-xs rounded-lg shadow-sm hover:shadow transition-all cursor-pointer inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
