import { useState, useCallback } from 'react';
import type { RecentSearch } from '../types/search.types';

const STORAGE_KEY = 'fuelpro_recent_searches';
const MAX_RECENT = 10;

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addRecentSearch = useCallback((search: RecentSearch) => {
    setRecentSearches(prev => {
      // Remove duplicates, add to front
      const filtered = prev.filter(s => s.query !== search.query);
      const updated = [search, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRecentSearches([]);
  }, []);

  return { recentSearches, addRecentSearch, clearRecentSearches };
}
