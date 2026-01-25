// ============================================================================
// hook for triggering haptic feedback (vibration)
// provides vibration patterns for different sound categories
// uses the web vibration api available on mobile devices and some browsers
// falls back gracefully on unsupported devices
// ============================================================================

import { useCallback } from 'react';

// ============================================================================
// vibration patterns for each sound category
// patterns are arrays of durations in milliseconds
// format: [vibrate, pause, vibrate, pause, ...]
// ============================================================================
const vibrationPatterns = {
  // alarming: strong, repeated pulses to grab immediate attention
  // pattern: 200ms on, 100ms off, repeated 4 times (7 segments)
  // total duration ~1.4 seconds for urgency
  alarming: [200, 100, 200, 100, 200, 100, 200],
  
  // background: single short pulse for awareness without alarm
  // pattern: just 100ms vibration
  // subtle notification for ambient sounds
  background: [100],
  
  // safe: gentle double tap to confirm sound detected
  // pattern: 50ms on, 50ms off, 50ms on
  // friendly non-urgent feedback
  safe: [50, 50, 50],
};

// ============================================================================
// hook return type interface
// defines what the hook exposes to consuming components
// ============================================================================
interface UseHapticReturn {
  // whether the device supports vibration
  isSupported: boolean;
  // function to trigger vibration with a category or custom pattern
  vibrate: (pattern: 'alarming' | 'background' | 'safe' | number[]) => void;
  // function to stop any ongoing vibration immediately
  stop: () => void;
}

// ============================================================================
// main hook function for haptic feedback
// returns functions to control device vibration
// ============================================================================
export function useHaptic(): UseHapticReturn {
  // check if the vibration api is supported in this browser/device
  // navigator.vibrate is available in most mobile browsers
  // returns false on desktop browsers and some ios versions
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  // ========== vibrate function ==========
  // triggers device vibration with specified pattern
  // accepts either a category name or custom duration array
  const vibrate = useCallback((pattern: 'alarming' | 'background' | 'safe' | number[]) => {
    // silently return if vibration not supported
    // this allows calling code to work without checking support
    if (!isSupported) return;
    
    try {
      // determine the pattern array to use:
      // - if string, look up in our predefined patterns
      // - if array, use directly as custom pattern
      const vibrationPattern = typeof pattern === 'string' 
        ? vibrationPatterns[pattern] 
        : pattern;
      
      // call the browser's vibration api
      // this triggers the physical vibration motor
      navigator.vibrate(vibrationPattern);
    } catch (err) {
      // log but don't throw - haptic is a nice-to-have feature
      console.error('vibration failed:', err);
    }
  }, [isSupported]);

  // ========== stop function ==========
  // immediately stops any ongoing vibration
  // useful for canceling long patterns or when user navigates away
  const stop = useCallback(() => {
    if (!isSupported) return;
    
    try {
      // calling vibrate(0) or vibrate([]) stops vibration
      navigator.vibrate(0);
    } catch (err) {
      console.error('failed to stop vibration:', err);
    }
  }, [isSupported]);

  // return the hook's public interface
  return {
    isSupported,
    vibrate,
    stop,
  };
}
