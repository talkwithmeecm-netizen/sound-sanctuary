// ============================================================================
// context that keeps the teachable machine running across route changes
// the mic stays on even when navigating between tabs
// ============================================================================

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useTeachableMachine } from './useTeachableMachine';
import { useHaptic } from './useHaptic';
import { useNotifications } from './useNotifications';
import { useAuth } from './AuthContext';
import { useUserSettings } from './useUserSettings';
import { DetectedSound, TmPrediction } from './sound';

interface SoundMonitorContextValue {
  isLoading: boolean;
  isListening: boolean;
  error: string | null;
  predictions: TmPrediction[];
  detectedSound: DetectedSound | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  labels: string[];
  showAlert: boolean;
}

const SoundMonitorCtx = createContext<SoundMonitorContextValue | null>(null);

export function useSoundMonitor() {
  const ctx = useContext(SoundMonitorCtx);
  if (!ctx) throw new Error('useSoundMonitor must be used within SoundMonitorProvider');
  return ctx;
}

export function SoundMonitorProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { settings } = useUserSettings(user?.id ?? null);
  const { vibrate } = useHaptic();
  const { addNotification } = useNotifications(user?.id ?? null);
  const [showAlert, setShowAlert] = useState(false);

  const hapticEnabled = settings?.haptic_enabled ?? true;

  const handleSoundDetected = useCallback(async (sound: DetectedSound) => {
    console.log('sound detected in monitor:', sound);
    if (hapticEnabled) {
      vibrate(sound.category);
    }
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);

    // browser notification
    if (Notification.permission === 'granted') {
      try {
        new Notification(`SoundSense: ${sound.label}`, {
          body: `detected ${sound.category} sound with ${Math.round(sound.confidence * 100)}% confidence`,
          icon: '/favicon.ico',
          tag: 'soundsense-alert',
          requireInteraction: sound.category === 'alarming',
        });
      } catch (e) {
        console.warn('notification failed:', e);
      }
    }

    if (user) {
      await addNotification(sound);
    }
  }, [hapticEnabled, vibrate, addNotification, user]);

  const tm = useTeachableMachine(handleSoundDetected, 0.7);

  // request notification permission on mount (will show browser prompt)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(perm => {
        console.log('notification permission:', perm);
      });
    }
  }, []);

  const value: SoundMonitorContextValue = {
    ...tm,
    showAlert,
  };

  return (
    <SoundMonitorCtx.Provider value={value}>
      {children}
    </SoundMonitorCtx.Provider>
  );
}
