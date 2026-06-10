import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecentItem {
  id: string;
  type: 'customer' | 'shift' | 'invoice' | 'report';
  title: string;
  timestamp: number;
  url?: string;
}

interface RecentItemsState {
  items: RecentItem[];
  addItem: (item: Omit<RecentItem, 'timestamp'>) => void;
  clearItems: () => void;
}

export const useRecentItemsStore = create<RecentItemsState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        set((state) => {
          // Remove if already exists to move it to the top
          const filtered = state.items.filter((item) => item.id !== newItem.id);
          const timestampedItem: RecentItem = { ...newItem, timestamp: Date.now() };
          // Keep only last 10
          return { items: [timestampedItem, ...filtered].slice(0, 10) };
        });
      },
      clearItems: () => set({ items: [] }),
    }),
    {
      name: 'fuelpro-recent-items',
    }
  )
);
