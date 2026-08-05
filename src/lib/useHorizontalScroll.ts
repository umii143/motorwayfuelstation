import { useEffect } from 'react';

/**
 * Global custom hook that enables mouse wheel horizontal scrolling on any element
 * matching '.custom-horizontal-scrollbar', '[data-horizontal-scroll="true"]',
 * or tagged for horizontal scrolling.
 */
export function useHorizontalScroll() {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Find closest scrollable horizontal container
      const target = (e.target as HTMLElement)?.closest?.(
        '.custom-horizontal-scrollbar, [data-horizontal-scroll="true"]'
      ) as HTMLElement | null;

      if (!target) return;

      // Check if container actually has horizontal overflow
      if (target.scrollWidth > target.clientWidth) {
        // If user is scrolling vertically with wheel, map it to horizontal scroll
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          target.scrollLeft += e.deltaY;
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);
}
