import React from 'react';
import { getHighlightedText } from '../../services/searchService';
import type { SearchResult } from '../../types/search.types';
import { 
  Users, Building2, Gauge, Package, Receipt, UserCheck, Zap, ArrowRight 
} from 'lucide-react';

interface SearchResultCardProps {
  result: SearchResult;
  query: string;
  isSelected: boolean;
  onClick: () => void;
}

export function SearchResultCard({
  result,
  query,
  isSelected,
  onClick,
}: SearchResultCardProps) {
  const titleParts = getHighlightedText(result.title, query);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-4 py-3 text-left transition-all duration-150 rounded-xl my-0.5 border ${
        isSelected
          ? 'bg-gradient-to-r from-blue-600/20 via-indigo-600/15 to-transparent border-blue-500/60 shadow-lg text-white'
          : 'bg-transparent border-transparent hover:bg-slate-800/60 text-slate-200'
      }`}
    >
      {/* Icon Pill */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border shadow-inner ${getIconStyles(result.type)}`}>
        {renderTypeIcon(result.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title with highlight */}
        <p className="text-sm font-semibold text-slate-100 truncate flex items-center gap-2">
          {titleParts.map((part, i) =>
            part.highlight ? (
              <mark key={i} className="bg-amber-400/30 text-amber-200 font-bold rounded px-1 py-0.5 shadow-sm">
                {part.text}
              </mark>
            ) : (
              <span key={i}>{part.text}</span>
            )
          )}
        </p>

        {/* Subtitle */}
        {result.subtitle && (
          <p className="text-xs text-slate-400 truncate mt-0.5 font-normal">
            {result.subtitle}
          </p>
        )}
      </div>

      {/* Right side Metadata & Badges */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {result.metadata && (
          <span className="text-xs text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
            {result.metadata}
          </span>
        )}
        {result.badgeText && (
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border shadow-sm ${getBadgeStyles(result.badgeColor)}`}>
            {result.badgeText}
          </span>
        )}
        {isSelected ? (
          <ArrowRight className="w-4 h-4 text-blue-400 animate-pulse" />
        ) : null}
      </div>
    </button>
  );
}

function renderTypeIcon(type: string) {
  switch (type) {
    case 'customer': return <Users className="w-4 h-4" />;
    case 'supplier': return <Building2 className="w-4 h-4" />;
    case 'shift': return <Gauge className="w-4 h-4" />;
    case 'batch':
    case 'product': return <Package className="w-4 h-4" />;
    case 'expense': return <Receipt className="w-4 h-4" />;
    case 'staff': return <UserCheck className="w-4 h-4" />;
    default: return <Zap className="w-4 h-4" />;
  }
}

function getIconStyles(type: string): string {
  const map: Record<string, string> = {
    customer: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    supplier: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    shift: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    batch: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    expense: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    staff: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    action: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  };
  return map[type] || 'bg-slate-800 text-slate-300 border-slate-700';
}

function getBadgeStyles(color?: string): string {
  const map: Record<string, string> = {
    red: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    orange: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  };
  return map[color || ''] || 'bg-slate-800 text-slate-300 border-slate-700';
}
