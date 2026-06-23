import React, { useEffect } from 'react';
import { NativeHaptics } from '../../services/hardware/Haptics';

interface NativeFeedbackProviderProps {
  children: React.ReactNode;
}

/**
 * A global provider that adds "Native App" feel to the web UI.
 * It listens for clicks and touches on interactive elements and automatically
 * triggers a subtle vibration and sound.
 */
export const NativeFeedbackProvider: React.FC<NativeFeedbackProviderProps> = ({ children }) => {
  useEffect(() => {
    // We use a debounce to prevent rapid firing (e.g. touchstart AND click firing sequentially on the same element)
    let lastFeedbackTime = 0;

    const handleInteraction = (e: Event) => {
      const now = Date.now();
      if (now - lastFeedbackTime < 100) return; // Debounce 100ms

      const target = e.target as HTMLElement;
      
      // Look up the DOM tree to see if the interaction was inside an interactive element
      const interactiveEl = target.closest('button, a, input[type="submit"], input[type="button"], [role="button"], [role="tab"], [role="switch"]');
      
      if (interactiveEl) {
        lastFeedbackTime = now;
        
        // Determine the type of feedback based on classes or roles (optional enhancement)
        const classList = interactiveEl.classList.toString().toLowerCase();
        
        if (classList.includes('bg-red') || classList.includes('bg-rose')) {
          // Warning/destructive actions
          NativeHaptics.heavyClick();
        } else if (classList.includes('bg-emerald') || classList.includes('bg-teal')) {
          // Success/confirm actions
          NativeHaptics.success();
        } else {
          // Standard light click for tabs, normal buttons, etc.
          NativeHaptics.selection();
        }
      }
    };

    // Use touchstart for immediate feedback on mobile before the click event fires
    document.addEventListener('touchstart', handleInteraction, { passive: true });
    // Keep click for desktop or elements that don't trigger touchstart
    document.addEventListener('click', handleInteraction, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    };
  }, []);

  return <>{children}</>;
};
