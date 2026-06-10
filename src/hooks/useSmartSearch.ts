import { useState, useCallback, useRef } from 'react';
import { searchAll, searchModule } from '../services/searchService';
import { useRecentSearches } from './useRecentSearches';
import type { SearchResult } from '../types/search.types';

interface UseSmartSearchOptions {
  module?: keyof import('../types/search.types').SearchIndex; // module-specific
  debounceMs?: number;
  maxResults?: number;
  onNavigate?: (result: SearchResult) => void;
}

export function useSmartSearch(options: UseSmartSearchOptions = {}) {
  const { module, debounceMs = 300, maxResults = 20, onNavigate } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { recentSearches, addRecentSearch } = useRecentSearches();
  const debounceTimer = useRef<NodeJS.Timeout>(null);

  // Debounced search execution
  const executeSearch = useCallback((q: string) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const searchResults = module
      ? searchModule(module, q, maxResults)
      : searchAll(q, maxResults);

    setResults(searchResults);
    setIsSearching(false);
    setSelectedIndex(0);
  }, [module, maxResults]);

  // Handle query change with debounce
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!value.trim()) {
      setResults([]);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      executeSearch(value);
    }, debounceMs);
  }, [executeSearch, debounceMs]);

  // Handle result selection
  const handleSelect = useCallback((result: SearchResult) => {
    addRecentSearch({
      query,
      resultType: result.type,
      resultId: result.id,
      resultTitle: result.title,
      timestamp: new Date().toISOString(),
    });

    onNavigate?.(result);
    setQuery('');
    setResults([]);
  }, [query, addRecentSearch, onNavigate]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) handleSelect(results[selectedIndex]);
        break;
      case 'Escape':
        setQuery('');
        setResults([]);
        break;
    }
  }, [results, selectedIndex, handleSelect]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setSelectedIndex(0);
  }, []);

  return {
    query,
    results,
    isSearching,
    selectedIndex,
    recentSearches,
    handleQueryChange,
    handleSelect,
    handleKeyDown,
    clearSearch,
    hasResults: results.length > 0,
    showRecents: query.length === 0 && recentSearches.length > 0,
  };
}
