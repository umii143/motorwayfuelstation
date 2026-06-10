import React from 'react';
import { getHighlightedText } from '../../services/searchService';
import type { SearchResult } from '../../types/search.types';

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
      className={`w-full flex items-center gap-3 px-4 py-3 text-left
                  transition-colors border-b border-outline-variant/50 last:border-0
                  ${isSelected
                    ? 'bg-secondary/10 border-l-2 border-l-secondary'
                    : 'hover:bg-surface-container'}`}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                       ${getIconBg(result.type)}`}>
        <span className="material-symbols-outlined text-sm">
          {result.icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title with highlight */}
        <p className="text-sm font-medium text-on-surface truncate">
          {titleParts.map((part, i) =>
            part.highlight ? (
              <mark key={i}
                className="bg-secondary/30 text-secondary rounded px-0.5">
                {part.text}
              </mark>
            ) : (
              <span key={i}>{part.text}</span>
            )
          )}
        </p>

        {/* Subtitle */}
        <p className="text-xs text-on-surface-variant truncate mt-0.5">
          {result.subtitle}
        </p>
      </div>

      {/* Right side */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        {result.metadata && (
          <span className="text-xs text-on-surface-variant font-medium">
            {result.metadata}
          </span>
        )}
        {result.badgeText && (
          <span className={`text-xs px-1.5 py-0.5 rounded font-bold
                            ${getBadgeStyles(result.badgeColor)}`}>
            {result.badgeText}
          </span>
        )}
      </div>
    </button>
  );
}

function getIconBg(type: string): string {
  const map: Record<string, string> = {
    customer: 'bg-blue-500/10 text-blue-400',
    supplier: 'bg-purple-500/10 text-purple-400',
    shift:    'bg-orange-500/10 text-orange-400',
    batch:    'bg-green-500/10 text-green-400',
    expense:  'bg-red-500/10 text-red-400',
    staff:    'bg-teal-500/10 text-teal-400',
    action:   'bg-secondary/10 text-secondary',
  };
  return map[type] || 'bg-surface-container text-on-surface-variant';
}

function getBadgeStyles(color?: string): string {
  const map: Record<string, string> = {
    red:    'bg-red-500/20 text-red-400',
    orange: 'bg-orange-500/20 text-orange-400',
    green:  'bg-green-500/20 text-green-400',
    blue:   'bg-blue-500/20 text-blue-400',
  };
  return map[color || ''] || 'bg-surface-container text-on-surface-variant';
}
