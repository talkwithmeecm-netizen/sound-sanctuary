// hook for managing user accessibility settings
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserSettings } from '@/types/sound';

// default settings for new users
const defaultSettings: Omit<UserSettings, 'id' | 'user_id'> = {
  text_size: 1.0,
  button_size: 1.0,
  icon_size: 1.0,
  theme: 'dark',
  haptic_enabled: true,
};

interface UseUserSettingsReturn {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<Omit<UserSettings, 'id' | 'user_id'>>) => Promise<void>;
  applySettings: () => void;
}

export function useUserSettings(userId: string | null): UseUserSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // fetch settings from database
  useEffect(() => {
    async function fetchSettings() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (fetchError) {
          // settings might not exist yet, create defaults
          if (fetchError.code === 'PGRST116') {
            const { data: newSettings, error: insertError } = await supabase
              .from('user_settings')
              .insert({ user_id: userId, ...defaultSettings })
              .select()
              .single();

            if (insertError) throw insertError;
            setSettings(newSettings as UserSettings);
          } else {
            throw fetchError;
          }
        } else {
          setSettings(data as UserSettings);
        }
      } catch (err) {
        console.error('error fetching user settings:', err);
        setError(err instanceof Error ? err.message : 'failed to load settings');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, [userId]);

  // apply css variables based on settings
  const applySettings = useCallback(() => {
    if (!settings) return;

    const root = document.documentElement;
    
    // set scaling variables
    root.style.setProperty('--text-scale', settings.text_size.toString());
    root.style.setProperty('--button-scale', settings.button_size.toString());
    root.style.setProperty('--icon-scale', settings.icon_size.toString());
    
    // apply theme class
    root.classList.remove('dark', 'light', 'light-contrast');
    root.classList.add(settings.theme);
  }, [settings]);

  // apply settings when they change
  useEffect(() => {
    applySettings();
  }, [applySettings]);

  // update settings in database
  const updateSettings = useCallback(async (updates: Partial<Omit<UserSettings, 'id' | 'user_id'>>) => {
    if (!userId || !settings) return;

    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) throw updateError;
      setSettings(data as UserSettings);
    } catch (err) {
      console.error('error updating settings:', err);
      setError(err instanceof Error ? err.message : 'failed to update settings');
    }
  }, [userId, settings]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    applySettings,
  };
}
