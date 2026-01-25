// main sound monitoring component with microphone input and classification
import React, { useCallback, useEffect, useState } from 'react';
import { useTeachableMachine } from '@/hooks/useTeachableMachine';
import { useHaptic } from '@/hooks/useHaptic';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { DetectedSound } from '@/types/sound';
import { SoundCategoryIcon, SoundCategoryBadge } from '@/components/icons/SoundCategoryIcon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SoundMonitorProps {
  hapticEnabled?: boolean;
}

export function SoundMonitor({ hapticEnabled = true }: SoundMonitorProps) {
  const { user } = useAuth();
  const { vibrate } = useHaptic();
  const { addNotification } = useNotifications(user?.id ?? null);
  const [showAlert, setShowAlert] = useState(false);

  // callback when a sound is detected
  const handleSoundDetected = useCallback(async (sound: DetectedSound) => {
    // trigger haptic feedback if enabled
    if (hapticEnabled) {
      vibrate(sound.category);
    }

    // show visual alert
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);

    // save notification to database
    if (user) {
      await addNotification(sound);
    }
  }, [hapticEnabled, vibrate, addNotification, user]);

  // initialize teachable machine hook
  const {
    isLoading,
    isListening,
    error,
    predictions,
    detectedSound,
    startListening,
    stopListening,
    labels,
  } = useTeachableMachine(handleSoundDetected, 0.7);

  // request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // get top 3 predictions for display
  const topPredictions = predictions.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* main control card */}
      <Card className={cn(
        'border-2 transition-all duration-300',
        isListening && 'border-primary pulse-ring',
        showAlert && detectedSound && 'flash-alert',
        showAlert && detectedSound?.category === 'alarming' && 'border-alarming',
        showAlert && detectedSound?.category === 'safe' && 'border-safe',
        showAlert && detectedSound?.category === 'background' && 'border-noise',
      )}>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-scaled-2xl font-bold">
            sound monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* microphone control button */}
          <div className="flex justify-center">
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              size="lg"
              className={cn(
                'w-32 h-32 rounded-full btn-scaled transition-all duration-300',
                isListening 
                  ? 'bg-destructive hover:bg-destructive/90' 
                  : 'bg-primary hover:bg-primary/90'
              )}
              aria-label={isListening ? 'stop listening' : 'start listening'}
            >
              {isLoading ? (
                <Loader2 className="w-12 h-12 animate-spin" />
              ) : isListening ? (
                <MicOff className="w-12 h-12" strokeWidth={2.5} />
              ) : (
                <Mic className="w-12 h-12" strokeWidth={2.5} />
              )}
            </Button>
          </div>

          {/* status text */}
          <p className="text-center text-scaled-xl font-bold">
            {isLoading 
              ? 'loading model...' 
              : isListening 
                ? 'listening for sounds...' 
                : 'tap to start listening'}
          </p>

          {/* error display */}
          {error && (
            <div 
              className="p-4 rounded-lg bg-destructive/20 border-2 border-destructive text-destructive text-scaled-base font-bold text-center"
              role="alert"
            >
              error: {error}
            </div>
          )}

          {/* current detected sound */}
          {detectedSound && (
            <div className="flex justify-center">
              <SoundCategoryBadge
                category={detectedSound.category}
                label={detectedSound.label}
                confidence={detectedSound.confidence}
                className="text-scaled-lg"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* predictions display */}
      {isListening && topPredictions.length > 0 && (
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-scaled-lg font-bold">
              live predictions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPredictions.map((pred, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-scaled-base font-bold truncate flex-1 mr-4">
                    {pred.className}
                  </span>
                  <span className="text-scaled-sm text-muted-foreground">
                    {Math.round(pred.probability * 100)}%
                  </span>
                </div>
                <Progress 
                  value={pred.probability * 100} 
                  className="h-3"
                  aria-label={`${pred.className} probability ${Math.round(pred.probability * 100)}%`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* available sound labels */}
      {labels.length > 0 && !isListening && (
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-scaled-lg font-bold">
              detectable sounds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {labels.map((label, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-scaled-sm font-bold"
                >
                  {label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
