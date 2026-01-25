// hook for triggering haptic feedback (vibration)
import { useCallback } from 'react';

// vibration patterns for different sound categories (in milliseconds)
const vibrationPatterns = {
  // alarming: strong, repeated pulses to grab attention
  alarming: [200, 100, 200, 100, 200, 100, 200],
  // background: single short pulse
  background: [100],
  // safe: gentle double tap
  safe: [50, 50, 50],
};

interface UseHapticReturn {
  isSupported: boolean;
  vibrate: (pattern: 'alarming' | 'background' | 'safe' | number[]) => void;
  stop: () => void;
}

export function useHaptic(): UseHapticReturn {
  // check if vibration api is supported
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  // trigger vibration with given pattern
  const vibrate = useCallback((pattern: 'alarming' | 'background' | 'safe' | number[]) => {
    if (!isSupported) return;
    
    try {
      // get pattern array from preset or use custom
      const vibrationPattern = typeof pattern === 'string' 
        ? vibrationPatterns[pattern] 
        : pattern;
      
      navigator.vibrate(vibrationPattern);
    } catch (err) {
      console.error('vibration failed:', err);
    }
  }, [isSupported]);

  // stop any ongoing vibration
  const stop = useCallback(() => {
    if (!isSupported) return;
    
    try {
      navigator.vibrate(0);
    } catch (err) {
      console.error('failed to stop vibration:', err);
    }
  }, [isSupported]);

  return {
    isSupported,
    vibrate,
    stop,
  };
}
