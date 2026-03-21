// ============================================================================
// hook for managing user accessibility settings
// handles loading, saving, and applying user preferences
// settings include text size, button size, icon size, theme, and haptic toggle
// persists to database so settings follow user across devices
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from './src/integrations/supabase/client';
import { UserSettings } from './sound';

// ============================================================================
// default settings for new users
// these values are used when a user first signs up
// 1.0 means 100% (no scaling), haptic enabled by default
// ============================================================================
const defaultSettings: Omit<UserSettings, 'id' | 'user_id'> = {
  text_size: 1.0,      // 100% text size (no scaling)
  button_size: 1.0,    // 100% button size
  icon_size: 1.0,      // 100% icon size
  theme: 'dark',       // dark high contrast theme (best for accessibility)
  haptic_enabled: true, // vibration alerts on by default
};

// ============================================================================
// hook return type interface
// ============================================================================
interface UseUserSettingsReturn {
  // current settings object (null while loading)
  settings: UserSettings | null;
  // true while fetching settings from database
  isLoading: boolean;
  // error message if fetch/update failed
  error: string | null;
  // function to update one or more settings
  updateSettings: (updates: Partial<Omit<UserSettings, 'id' | 'user_id'>>) => Promise<void>;
  // function to manually reapply css variables (usually automatic)
  applySettings: () => void;
}

// ============================================================================
// main hook function for managing user settings
// parameter: userId - the current user's id, or null if not logged in
// ============================================================================
export function useUserSettings(userId: string | null): UseUserSettingsReturn {
  // ========== state ==========
  
  // the current settings object from database
  const [settings, setSettings] = useState<UserSettings | null>(null);
  
  // loading state while fetching from database
  const [isLoading, setIsLoading] = useState(true);
  
  // error message if something went wrong
  const [error, setError] = useState<string | null>(null);

  // ========== fetch settings effect ==========
  
  // loads user settings from database when user logs in
  // creates default settings if none exist (shouldn't happen with trigger)
  useEffect(() => {
    async function fetchSettings() {
      // can't fetch settings without a user id
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // query the user_settings table for this user
        // single() expects exactly one row (user_id is unique)
        const { data, error: fetchError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (fetchError) {
          // pgrst116 means no rows found - create default settings
          // this is a fallback; normally the database trigger creates these
          if (fetchError.code === 'PGRST116') {
            console.log('no settings found, creating defaults for user');
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
          // successfully loaded existing settings
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

  // ========== apply settings function ==========
  
  // updates css custom properties based on current settings
  // these variables control text, button, and icon scaling throughout the app
  const applySettings = useCallback(() => {
    if (!settings) return;

    // get the root html element to set css custom properties
    const root = document.documentElement;
    
    // set scaling css variables
    // these are used throughout the app via tailwind utilities
    root.style.setProperty('--text-scale', settings.text_size.toString());
    root.style.setProperty('--button-scale', settings.button_size.toString());
    root.style.setProperty('--icon-scale', settings.icon_size.toString());
    
    // apply theme class by removing all theme classes first
    // then adding the current theme class
    root.classList.remove('dark', 'light', 'light-contrast');
    root.classList.add(settings.theme);
    
    console.log('applied settings:', {
      textScale: settings.text_size,
      buttonScale: settings.button_size,
      iconScale: settings.icon_size,
      theme: settings.theme,
    });
  }, [settings]);

  // ========== apply settings effect ==========
  
  // automatically apply css variables whenever settings change
  useEffect(() => {
    applySettings();
  }, [applySettings]);

  // ========== update settings function ==========
  
  // saves updated settings to database and updates local state
  // accepts partial updates (e.g., just { text_size: 1.2 })
  const updateSettings = useCallback(async (updates: Partial<Omit<UserSettings, 'id' | 'user_id'>>) => {
    // need both user id and existing settings to update
    if (!userId || !settings) return;

    try {
      setError(null);
      
      console.log('updating settings:', updates);

      // update the database with new values
      const { data, error: updateError } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) throw updateError;
      
      // update local state with the returned data
      // this triggers the applySettings effect automatically
      setSettings(data as UserSettings);
    } catch (err) {
      console.error('error updating settings:', err);
      setError(err instanceof Error ? err.message : 'failed to update settings');
    }
  }, [userId, settings]);

  // return the hook's public interface
  return {
    settings,
    isLoading,
    error,
    updateSettings,
    applySettings,
  };
}
