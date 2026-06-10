// Track what users search to improve the app

interface SearchEvent {
  query: string;
  resultsCount: number;
  selectedResultType?: string;
  timestamp: string;
}

const analytics: SearchEvent[] = [];

export function trackSearch(query: string, resultsCount: number) {
  analytics.push({ query, resultsCount, timestamp: new Date().toISOString() });
  // Save to localStorage, sync periodically
  try {
    const stored = JSON.parse(localStorage.getItem('search_analytics') || '[]');
    stored.push({ query, resultsCount, timestamp: new Date().toISOString() });
    localStorage.setItem('search_analytics', JSON.stringify(stored.slice(-100)));
  } catch (e) {
    console.warn('Could not save search analytics', e);
  }
}

export function getTopSearches(): { query: string; count: number }[] {
  try {
    const stored = JSON.parse(localStorage.getItem('search_analytics') || '[]');
    const counts: Record<string, number> = {};
    stored.forEach((e: SearchEvent) => {
      counts[e.query] = (counts[e.query] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  } catch (e) {
    return [];
  }
}
