// hook for managing notification history
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NotificationRecord, DetectedSound } from '@/types/sound';

interface UseNotificationsReturn {
  notifications: NotificationRecord[];
  isLoading: boolean;
  error: string | null;
  addNotification: (sound: DetectedSound) => Promise<void>;
  clearNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export function useNotifications(userId: string | null): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('detected_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;
      
      // cast the data to our notification record type
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

  // initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // add a new notification
  const addNotification = useCallback(async (sound: DetectedSound) => {
    if (!userId) return;

    try {
      setError(null);

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

      // add to local state (prepend since it's newest)
      if (data) {
        setNotifications(prev => [{
          ...data,
          category: data.category as NotificationRecord['category'],
        }, ...prev]);
      }

      // trigger browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(`SoundSense: ${sound.label}`, {
          body: `Detected ${sound.category} sound with ${Math.round(sound.confidence * 100)}% confidence`,
          icon: '/favicon.ico',
          tag: 'soundsense-alert',
        });
      }
    } catch (err) {
      console.error('error adding notification:', err);
      setError(err instanceof Error ? err.message : 'failed to save notification');
    }
  }, [userId]);

  // clear all notifications
  const clearNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
      setNotifications([]);
    } catch (err) {
      console.error('error clearing notifications:', err);
      setError(err instanceof Error ? err.message : 'failed to clear notifications');
    }
  }, [userId]);

  return {
    notifications,
    isLoading,
    error,
    addNotification,
    clearNotifications,
    refreshNotifications: fetchNotifications,
  };
}
