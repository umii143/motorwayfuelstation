import React, { useRef, useEffect } from 'react';
import { useSmartSearch } from '../../hooks/useSmartSearch';
import { SearchResultCard } from './SearchResultCard';
import type { SearchResult } from '../../types/search.types';

interface SmartSearchProps {
  module: keyof import('../../types/search.types').SearchIndex;
  placeholder?: string;
  onResultSelect?: (result: SearchResult) => void;
  onFilter?: (filtered: SearchResult[]) => void;
  onQueryChange?: (query: string) => void;
  className?: string;
}

export function SmartSearch({
  module,
  placeholder,
  onResultSelect,
  onFilter,
  onQueryChange,
  className = '',
}: SmartSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    query,
    results,
    isSearching,
    selectedIndex,
    handleQueryChange,
    handleSelect,
    handleKeyDown,
    clearSearch,
    hasResults,
  } = useSmartSearch({
    module,
    onNavigate: (result) => {
      onResultSelect?.(result);
      if (onFilter) onFilter(results);
    },
  });

  // Call onFilter whenever results change
  useEffect(() => {
    if (onFilter) {
      onFilter(results);
    }
  }, [results, onFilter]);

  // Call onQueryChange whenever query changes
  useEffect(() => {
    if (onQueryChange) {
      onQueryChange(query);
    }
  }, [query, onQueryChange]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        clearSearch();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearSearch]);

  const defaultPlaceholder = `Search ${module}... (type 2+ characters)`;

  return (
    <div className={`relative w-full max-w-xl ${className}`} ref={dropdownRef}>
      {/* Input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2
                         material-symbols-outlined text-on-surface-variant text-sm">
          search
        </span>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || defaultPlaceholder}
          className="w-full pl-9 pr-8 py-2.5 rounded-lg text-sm
                     bg-surface-container border border-outline-variant
                     text-on-surface placeholder:text-on-surface-variant
                     focus:outline-none focus:border-secondary focus:ring-1
                     focus:ring-secondary transition-all"
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}

        {/* Loading spinner */}
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2
                          w-3 h-3 border-2 border-secondary border-t-transparent
                          rounded-full animate-spin" />
        )}
      </div>

      {/* Results Dropdown */}
      {hasResults && !onFilter && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50
                        bg-surface-container-high border border-outline-variant
                        rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto">
          {results.map((result, index) => (
            <SearchResultCard
              key={result.id}
              result={result}
              query={query}
              isSelected={index === selectedIndex}
              onClick={() => handleSelect(result)}
            />
          ))}

          <div className="px-3 py-1.5 border-t border-outline-variant
                          text-xs text-on-surface-variant text-center">
            {results.length} result{results.length !== 1 ? 's' : ''}
            &nbsp;• ↑↓ navigate • Enter select
          </div>
        </div>
      )}

      {/* No results */}
      {query.length >= 2 && !isSearching && !hasResults && !onFilter && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50
                        bg-surface-container-high border border-outline-variant
                        rounded-xl shadow-xl px-4 py-6 text-center">
          <span className="material-symbols-outlined text-3xl text-outline block mb-2">
            search_off
          </span>
          <p className="text-sm text-on-surface-variant">
            No results for "<strong>{query}</strong>"
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Try different spelling or keywords
          </p>
        </div>
      )}
    </div>
  );
}
