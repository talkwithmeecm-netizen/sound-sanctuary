// ============================================================================
// hook for triggering haptic feedback (vibration)
// provides vibration patterns for alarming and safe sound categories
// ============================================================================

import { useCallback } from 'react';

const vibrationPatterns = {
  alarming: [200, 100, 200, 100, 200, 100, 200],
  safe: [50, 50, 50],
};

interface UseHapticReturn {
  isSupported: boolean;
  vibrate: (pattern: 'alarming' | 'safe' | number[]) => void;
  stop: () => void;
}

export function useHaptic(): UseHapticReturn {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const vibrate = useCallback((pattern: 'alarming' | 'safe' | number[]) => {
    if (!isSupported) return;
    try {
      const vibrationPattern = typeof pattern === 'string' 
        ? vibrationPatterns[pattern] 
        : pattern;
      navigator.vibrate(vibrationPattern);
    } catch (err) {
      console.error('vibration failed:', err);
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    try { navigator.vibrate(0); } catch (err) { console.error('failed to stop vibration:', err); }
  }, [isSupported]);

  return { isSupported, vibrate, stop };
}
