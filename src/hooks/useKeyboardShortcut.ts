import { useEffect, useCallback } from 'react';

type KeyCombo = {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
};

export function useKeyboardShortcut(
  combo: KeyCombo,
  handler: (e: KeyboardEvent) => void,
  enabled = true
) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    const keyMatch = e.key.toLowerCase() === combo.key.toLowerCase();
    const ctrlMatch = combo.ctrl ? (e.ctrlKey || e.metaKey) : true;
    const altMatch = combo.alt ? e.altKey : true;
    const shiftMatch = combo.shift ? e.shiftKey : true;

    if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
      e.preventDefault();
      handler(e);
    }
  }, [combo, handler, enabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Preset shortcuts for easy use
export const SHORTCUTS = {
  GLOBAL_SEARCH:   { key: 'k', ctrl: true },
  NEW_RECORD:      { key: 'n', ctrl: true },
  EXPORT_PDF:      { key: 'p', ctrl: true },
  WHATSAPP_SHARE:  { key: 'w', ctrl: true },
  AI_ASSISTANT:    { key: '/', ctrl: true },
  EXPORT_EXCEL:    { key: 'e', ctrl: true },
} as const;
