import React, { useEffect, useRef } from 'react';
import { useSmartSearch } from '../../hooks/useSmartSearch';
import { useKeyboardShortcut, SHORTCUTS } from '../../hooks/useKeyboardShortcut';
import { SearchResultCard } from './SearchResultCard';
import { COMMAND_ACTIONS } from './CommandPalette';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (viewId: string, contextData?: any) => void;
}

export function GlobalSearchModal({
  isOpen,
  onClose,
  onNavigate,
}: GlobalSearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    query,
    results,
    isSearching,
    selectedIndex,
    recentSearches,
    showRecents,
    handleQueryChange,
    handleSelect,
    handleKeyDown,
    clearSearch,
    hasResults,
  } = useSmartSearch({
    onNavigate: (result) => {
      onNavigate(result.viewId, result.contextData);
      onClose();
    },
  });

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      clearSearch();
    }
  }, [isOpen, clearSearch]);

  // Esc to close
  useKeyboardShortcut({ key: 'Escape' }, onClose, isOpen);

  if (!isOpen) return null;

  // Filter command actions by query
  const matchingActions = query
    ? COMMAND_ACTIONS.filter(a =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.description.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3)
    : COMMAND_ACTIONS.filter(a => a.category === 'create').slice(0, 4);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-scrim/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-surface-container-high
                      border border-outline-variant rounded-2xl shadow-2xl
                      overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5
                        border-b border-outline-variant">
          <span className="material-symbols-outlined text-secondary">search</span>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search customers, suppliers, shifts, batches..."
            className="flex-1 bg-transparent text-on-surface placeholder:text-on-surface-variant
                       text-base focus:outline-none"
          />

          {query && (
            <button onClick={clearSearch}
              className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}

          <kbd className="px-2 py-0.5 text-xs rounded bg-surface-container
                          text-on-surface-variant border border-outline-variant">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1">

          {/* Recent Searches */}
          {showRecents && recentSearches.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold
                            text-on-surface-variant uppercase tracking-wide">
                Recent
              </p>
              {recentSearches.slice(0, 5).map((recent, i) => (
                <button
                  key={i}
                  onClick={() => handleQueryChange(recent.query)}
                  className="w-full flex items-center gap-3 px-4 py-2.5
                             hover:bg-surface-container transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-sm
                                   text-on-surface-variant">history</span>
                  <span className="text-sm text-on-surface">{recent.query}</span>
                  {recent.resultTitle && (
                    <span className="text-xs text-on-surface-variant ml-auto">
                      {recent.resultTitle}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          {matchingActions.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold
                            text-on-surface-variant uppercase tracking-wide">
                Quick Actions
              </p>
              {matchingActions.map(action => (
                <button
                  key={action.id}
                  onClick={() => { action.action(); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5
                             hover:bg-surface-container transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-secondary/10
                                  flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary text-sm">
                      {action.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-on-surface">{action.label}</p>
                    <p className="text-xs text-on-surface-variant">{action.description}</p>
                  </div>
                  {action.shortcut && (
                    <kbd className="text-xs px-1.5 py-0.5 rounded
                                    bg-surface-container text-on-surface-variant
                                    border border-outline-variant">
                      {action.shortcut}
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {hasResults && (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold
                            text-on-surface-variant uppercase tracking-wide">
                Results
              </p>
              {results.map((result, index) => (
                <SearchResultCard
                  key={result.id}
                  result={result}
                  query={query}
                  isSelected={index === selectedIndex}
                  onClick={() => handleSelect(result)}
                />
              ))}
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && !isSearching && !hasResults && (
            <div className="flex flex-col items-center py-12 gap-2">
              <span className="material-symbols-outlined text-4xl text-outline">
                search_off
              </span>
              <p className="text-on-surface-variant text-sm">
                No results for "<strong className="text-on-surface">{query}</strong>"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-outline-variant
                        flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3 text-xs text-on-surface-variant">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>Esc close</span>
          </div>
          <span className="text-xs text-on-surface-variant font-medium text-secondary">
            Powered by Umar Ali ⚡
          </span>
        </div>
      </div>
    </div>
  );
}
