// notification history page - shows past sound detections
import React from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './useNotifications';
import { SoundCategoryIcon } from './SoundCategoryIcon';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Trash2, RefreshCw, Loader2, History as HistoryIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from './utils';

const History = () => {
  const { user } = useAuth();
  const { 
    notifications, 
    isLoading, 
    error, 
    clearNotifications, 
    refreshNotifications 
  } = useNotifications(user?.id ?? null);

  const getBgColor = (category: string) => {
    switch (category) {
      case 'alarming': return 'bg-alarming/10 border-alarming';
      case 'safe': return 'bg-safe/10 border-safe';
      default: return 'bg-muted border-border';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-scaled-2xl font-bold flex items-center gap-3">
          <HistoryIcon className="w-7 h-7 icon-scaled" strokeWidth={2.5} />
          notification history
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={refreshNotifications}
            variant="outline"
            size="icon"
            className="h-12 w-12 btn-scaled"
            aria-label="refresh notifications"
          >
            <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
          </Button>
          <Button
            onClick={clearNotifications}
            variant="destructive"
            size="icon"
            className="h-12 w-12 btn-scaled"
            aria-label="clear all notifications"
            disabled={notifications.length === 0}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <Card className="border-2 border-destructive">
          <CardContent className="py-6 text-center">
            <p className="text-scaled-base font-bold text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && notifications.length === 0 && (
        <Card className="border-2">
          <CardContent className="py-12 text-center">
            <HistoryIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground icon-scaled" />
            <p className="text-scaled-lg font-bold text-muted-foreground">
              no notifications yet
            </p>
            <p className="text-scaled-base text-muted-foreground mt-2">
              detected sounds will appear here
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={cn('border-2', getBgColor(notification.category))}
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <SoundCategoryIcon 
                    category={notification.category as any} 
                    size={32}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-scaled-lg font-bold truncate">
                      {notification.sound_label}
                    </p>
                    <p className="text-scaled-sm text-muted-foreground">
                      {format(new Date(notification.detected_at), 'PPpp')}
                    </p>
                  </div>
                  <div className="text-scaled-lg font-bold">
                    {Math.round(notification.confidence * 100)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
