import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, X, Sparkles, Command, ArrowRight, PlusCircle, PackagePlus, 
  Receipt, UserPlus, LayoutDashboard, BarChart3, History, Zap 
} from 'lucide-react';
import { useSmartSearch } from '../../hooks/useSmartSearch';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { SearchResultCard } from './SearchResultCard';
import { COMMAND_ACTIONS } from './CommandPalette';
import EntityDetailDrawer from './EntityDetailDrawer';
import { EntityRef } from '../../types/search.types';

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
  const [entityRef, setEntityRef] = useState<EntityRef | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'ai'>('all');

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
      if (result.entityRef) {
        setEntityRef(result.entityRef);
        return;
      }
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
      setEntityRef(null);
      setActiveTab('all');
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
      ).slice(0, 4)
    : COMMAND_ACTIONS.filter(a => a.category === 'create').slice(0, 4);

  const renderActionIcon = (actionId: string) => {
    switch (actionId) {
      case 'new_shift': return <PlusCircle className="w-4 h-4 text-emerald-400" />;
      case 'new_stock_in': return <PackagePlus className="w-4 h-4 text-blue-400" />;
      case 'new_expense': return <Receipt className="w-4 h-4 text-rose-400" />;
      case 'new_customer': return <UserPlus className="w-4 h-4 text-indigo-400" />;
      case 'go_dashboard': return <LayoutDashboard className="w-4 h-4 text-cyan-400" />;
      case 'go_reports': return <BarChart3 className="w-4 h-4 text-purple-400" />;
      case 'ai_profit': return <Sparkles className="w-4 h-4 text-amber-400" />;
      default: return <Zap className="w-4 h-4 text-blue-400" />;
    }
  };

  const renderActionIconBg = (actionId: string) => {
    switch (actionId) {
      case 'new_shift': return 'bg-emerald-500/15 border-emerald-500/30';
      case 'new_stock_in': return 'bg-blue-500/15 border-blue-500/30';
      case 'new_expense': return 'bg-rose-500/15 border-rose-500/30';
      case 'new_customer': return 'bg-indigo-500/15 border-indigo-500/30';
      case 'go_dashboard': return 'bg-cyan-500/15 border-cyan-500/30';
      case 'go_reports': return 'bg-purple-500/15 border-purple-500/30';
      case 'ai_profit': return 'bg-amber-500/15 border-amber-500/30';
      default: return 'bg-blue-500/15 border-blue-500/30';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 sm:px-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -15 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-slate-900/95 dark:bg-slate-900/95 border border-slate-700/60 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[82vh] backdrop-blur-2xl text-slate-100 ring-1 ring-white/10"
        >
          {/* Top Ambient Glow Line */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500" />

          {/* Header Search Bar */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/40">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Search className="w-5 h-5 animate-pulse" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search customers, suppliers, shifts, fuel products, or ask AI..."
              className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-400 text-base font-medium focus:outline-none"
            />

            {query && (
              <button
                onClick={clearSearch}
                className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Quick Modes Pills */}
            <div className="flex items-center gap-1.5 ml-1">
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300">
                <Command className="w-3 h-3 text-blue-400" /> Search
              </span>
              <kbd className="px-2 py-1 text-[11px] font-mono font-bold rounded-md bg-slate-800 text-slate-300 border border-slate-700 shadow-sm">
                Esc
              </kbd>
            </div>
          </div>

          {/* Results Scrollable Section */}
          <div className="overflow-y-auto flex-1 p-2 space-y-3 custom-scrollbar">

            {/* AI Assistant Instant Query Mode Banner */}
            {query.length >= 3 && (
              <button
                onClick={() => {
                  onNavigate('ai_analytics_hub', { initialQuery: query });
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-blue-500/15 border border-amber-500/30 hover:border-amber-500/60 transition-all text-left group"
              >
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Sparkles className="w-4 h-4 animate-spin-slow" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    ✨ Ask FuelPro Enterprise AI
                  </p>
                  <p className="text-sm font-medium text-slate-200 truncate mt-0.5">
                    "{query}"
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-300 group-hover:translate-x-0.5 transition-transform">
                  <span>Analyze</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            )}

            {/* Recent Searches */}
            {showRecents && recentSearches.length > 0 && (
              <div>
                <p className="px-3 pt-1 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-blue-400" /> Recent Searches
                </p>
                <div className="space-y-1">
                  {recentSearches.slice(0, 4).map((recent, i) => (
                    <button
                      key={i}
                      onClick={() => handleQueryChange(recent.query)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left group border border-transparent hover:border-slate-700/50"
                    >
                      <History className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                      <span className="text-sm text-slate-200 font-medium group-hover:text-slate-100">
                        {recent.query}
                      </span>
                      {recent.resultTitle && (
                        <span className="text-xs text-slate-400 ml-auto bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">
                          {recent.resultTitle}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {matchingActions.length > 0 && (
              <div>
                <p className="px-3 pt-1 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Quick Actions
                </p>
                <div className="space-y-1">
                  {matchingActions.map((action, index) => {
                    const isSelected = !hasResults && index === selectedIndex;
                    return (
                      <button
                        key={action.id}
                        onClick={() => { action.action(); onClose(); }}
                        className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 border ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-600/20 via-indigo-600/15 to-transparent border-blue-500/60 shadow-lg text-white'
                            : 'bg-slate-950/20 border-slate-800/80 hover:bg-slate-800/60 text-slate-200'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-inner ${renderActionIconBg(action.id)}`}>
                          {renderActionIcon(action.id)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-100 truncate">{action.label}</p>
                          <p className="text-xs text-slate-400 truncate">{action.description}</p>
                        </div>
                        {action.shortcut && (
                          <kbd className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shadow-sm">
                            {action.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search Results */}
            {hasResults && (
              <div>
                <p className="px-3 pt-1 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                  <span>Enterprise Search Results</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                    {results.length} found
                  </span>
                </p>
                <div className="space-y-1">
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
              </div>
            )}

            {/* No Results Empty State */}
            {query.length >= 2 && !isSearching && !hasResults && (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <div className="p-3 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-200 text-sm font-semibold">
                    No results for "<span className="text-blue-400">{query}</span>"
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Try searching for customers, suppliers, shifts, or ask FuelPro AI.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">↑↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">↵</kbd> select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">Esc</kbd> close
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                Powered by Umar Ali ⚡
              </span>
            </div>
          </div>

          {/* Entity Detail Drawer */}
          {entityRef && (
            <EntityDetailDrawer
              entity={entityRef}
              onClose={() => setEntityRef(null)}
              onNavigateModule={(viewId, ctx) => { onNavigate(viewId, ctx); onClose(); setEntityRef(null); }}
              onReanchor={(ref) => setEntityRef(ref)}
            />
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
