// ============================================================================
// hook for managing notification history
// handles loading, saving, and clearing sound detection notifications
// notifications are stored in the database with user association
// provides real-time local state updates for immediate ui feedback
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NotificationRecord, DetectedSound } from '@/types/sound';

// ============================================================================
// hook return type interface
// ============================================================================
interface UseNotificationsReturn {
  // array of notification records from database
  notifications: NotificationRecord[];
  // true while fetching notifications
  isLoading: boolean;
  // error message if fetch/update failed
  error: string | null;
  // function to add a new notification when sound is detected
  addNotification: (sound: DetectedSound) => Promise<void>;
  // function to delete all notifications for this user
  clearNotifications: () => Promise<void>;
  // function to manually refresh notifications from database
  refreshNotifications: () => Promise<void>;
}

// ============================================================================
// main hook function for managing notifications
// parameter: userId - the current user's id, or null if not logged in
// ============================================================================
export function useNotifications(userId: string | null): UseNotificationsReturn {
  // ========== state ==========
  
  // array of notification records loaded from database
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  
  // loading state for database operations
  const [isLoading, setIsLoading] = useState(true);
  
  // error message for display in ui
  const [error, setError] = useState<string | null>(null);

  // ========== fetch notifications function ==========
  
  // loads the most recent 100 notifications from database
  // ordered by detection time (newest first)
  const fetchNotifications = useCallback(async () => {
    // can't fetch without a user id
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // query notifications table for this user
      // limit to 100 to prevent huge data loads
      // order by detected_at descending for chronological display
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('detected_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;
      
      // cast the data to our notification record type
      // this ensures typescript knows about the category enum
      setNotifications((data || []).map(item => ({
        ...item,
        category: item.category as NotificationRecord['category'],
      })));
    } catch (err) {
      console.error('error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // ========== initial fetch effect ==========
  
  // load notifications when user logs in or hook mounts
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ========== add notification function ==========
  
  // saves a new sound detection to the database
  // also triggers browser notification if permission granted
  const addNotification = useCallback(async (sound: DetectedSound) => {
    // can't save without a user id
    if (!userId) return;

    try {
      setError(null);

      console.log('saving notification to database:', sound);

      // insert new notification record
      const { data, error: insertError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          sound_label: sound.label,
          category: sound.category,
          confidence: sound.confidence,
          detected_at: sound.timestamp.toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // add to local state immediately for responsive ui
      // prepend since newest should be first
      if (data) {
        setNotifications(prev => [{
          ...data,
          category: data.category as NotificationRecord['category'],
        }, ...prev]);
      }

      // trigger browser notification if permission was granted
      // this shows a system notification even when app is in background
      if (Notification.permission === 'granted') {
        new Notification(`SoundSense: ${sound.label}`, {
          body: `detected ${sound.category} sound with ${Math.round(sound.confidence * 100)}% confidence`,
          icon: '/favicon.ico',
          tag: 'soundsense-alert',  // tag prevents duplicate notifications
        });
      }
    } catch (err) {
      console.error('error adding notification:', err);
      setError(err instanceof Error ? err.message : 'failed to save notification');
    }
  }, [userId]);

  // ========== clear notifications function ==========
  
  // deletes all notifications for this user from database
  // useful for cleaning up history
  const clearNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setError(null);
      
      console.log('clearing all notifications for user');

      // delete all rows matching this user id
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
      
      // clear local state
      setNotifications([]);
    } catch (err) {
      console.error('error clearing notifications:', err);
      setError(err instanceof Error ? err.message : 'failed to clear notifications');
    }
  }, [userId]);

  // return the hook's public interface
  return {
    notifications,
    isLoading,
    error,
    addNotification,
    clearNotifications,
    refreshNotifications: fetchNotifications,
  };
}
