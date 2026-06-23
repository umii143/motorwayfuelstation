import { useState, useRef } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pullDistance = useRef(0);

  const handleTouchStart = (e: React.TouchEvent | TouchEvent) => {
    if ('touches' in e) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent | TouchEvent) => {
    const target = e.target as HTMLElement;
    
    // Find the closest scrollable container or use window/document body
    const scrollContainer = target.closest('.scroll-container') || document.documentElement;
    const scrollTop = scrollContainer.scrollTop || 0;
    
    if (scrollTop > 0) return;  // only at top of scroll

    if ('touches' in e) {
      pullDistance.current = e.touches[0].clientY - startY.current;

      if (pullDistance.current > 60) {
        setIsRefreshing(true);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (isRefreshing) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch {
        // silently ignore error if refresh fails
      }
      await onRefresh();
      setIsRefreshing(false);
    }
    pullDistance.current = 0;
  };

  return { isRefreshing, handleTouchStart, handleTouchMove, handleTouchEnd };
}
