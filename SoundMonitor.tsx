// ============================================================================
// main sound monitoring component with microphone input and classification
// this is the core component that:
// - displays the microphone control button
// - shows real-time predictions from the ml model
// - triggers haptic feedback and notifications on detection
// - displays visual alerts for different sound categories
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { useTeachableMachine } from './useTeachableMachine';
import { useHaptic } from './useHaptic';
import { useNotifications } from './useNotifications';
import { useAuth } from './AuthContext';
import { DetectedSound } from './sound';
import { SoundCategoryIcon, SoundCategoryBadge } from './SoundCategoryIcon';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Progress } from './progress';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from './utils';

// ============================================================================
// component props interface
// ============================================================================
interface SoundMonitorProps {
  // whether haptic feedback is enabled (from user settings)
  hapticEnabled?: boolean;
}

// ============================================================================
// sound monitor component
// ============================================================================
export function SoundMonitor({ hapticEnabled = true }: SoundMonitorProps) {
  // ========== hooks ==========
  
  // get current user for saving notifications
  const { user } = useAuth();
  
  // haptic feedback functions
  const { vibrate } = useHaptic();
  
  // notification saving functions
  const { addNotification } = useNotifications(user?.id ?? null);
  
  // local state for visual alert animation
  const [showAlert, setShowAlert] = useState(false);

  // ========== sound detection callback ==========
  
  // called when the ml model detects a sound with high confidence
  // handles haptic feedback, visual alerts, and saving to database
  const handleSoundDetected = useCallback(async (sound: DetectedSound) => {
    console.log('sound detected in monitor:', sound);
    
    // trigger haptic feedback based on sound category
    // different categories have different vibration patterns
    if (hapticEnabled) {
      vibrate(sound.category);
    }

    // show visual alert animation for 3 seconds
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);

    // save notification to database for history tracking
    if (user) {
      await addNotification(sound);
    }
  }, [hapticEnabled, vibrate, addNotification, user]);

  // ========== teachable machine hook ==========
  
  // initialize the ml model and get control functions
  const {
    isLoading,
    isListening,
    error,
    predictions,
    detectedSound,
    startListening,
    stopListening,
    labels,
    loadedModelCount,
    totalModelCount,
  } = useTeachableMachine(handleSoundDetected, 0.7);

  // ========== notification permission effect ==========
  
  // request browser notification permission on component mount
  // this allows showing system notifications when sounds are detected
  useEffect(() => {
    if (Notification.permission === 'default') {
      console.log('requesting notification permission...');
      Notification.requestPermission().then(permission => {
        console.log('notification permission:', permission);
      });
    }
  }, []);

  // ========== derived state ==========
  
  // get top 3 predictions for display in the ui
  // sorted by probability (highest first)
  const topPredictions = predictions.slice(0, 3);

  // ========== render ==========
  
  return (
    <div className="space-y-6">
      {/* main control card with microphone button */}
      <Card className={cn(
        'border-2 transition-all duration-300',
        // pulsing border when actively listening
        isListening && 'border-primary pulse-ring',
        // flash animation when sound is detected
        showAlert && 'flash-alert',
        // category-specific border color during alert
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
          {/* large circular microphone control button */}
          <div className="flex justify-center">
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              size="lg"
              className={cn(
                'w-32 h-32 rounded-full btn-scaled transition-all duration-300',
                // red when listening (to stop), primary when not (to start)
                isListening 
                  ? 'bg-destructive hover:bg-destructive/90' 
                  : 'bg-primary hover:bg-primary/90'
              )}
              aria-label={isListening ? 'stop listening' : 'start listening'}
            >
              {/* show loading spinner, stop icon, or start icon */}
              {isLoading ? (
                <Loader2 className="w-12 h-12 animate-spin" />
              ) : isListening ? (
                <MicOff className="w-12 h-12" strokeWidth={2.5} />
              ) : (
                <Mic className="w-12 h-12" strokeWidth={2.5} />
              )}
            </Button>
          </div>

          {/* status text below button */}
          <p className="text-center text-scaled-xl font-bold">
            {isLoading 
              ? 'loading model...' 
              : isListening 
                ? 'listening for sounds...' 
                : 'tap to start listening'}
          </p>

          {/* error message display */}
          {error && (
            <div 
              className="p-4 rounded-lg bg-destructive/20 border-2 border-destructive text-destructive text-scaled-base font-bold text-center"
              role="alert"
            >
              error: {error}
            </div>
          )}

          {/* current detected sound badge */}
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

      {/* live predictions card - shows when listening */}
      {isListening && topPredictions.length > 0 && (
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-scaled-lg font-bold">
              live predictions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* show top 3 predictions with progress bars */}
            {topPredictions.map((pred, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  {/* prediction class name */}
                  <span className="text-scaled-base font-bold truncate flex-1 mr-4">
                    {pred.className}
                  </span>
                  {/* probability percentage */}
                  <span className="text-scaled-sm text-muted-foreground">
                    {Math.round(pred.probability * 100)}%
                  </span>
                </div>
                {/* visual progress bar for probability */}
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

      {/* available sounds card - shows when not listening */}
      {labels.length > 0 && !isListening && (
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-scaled-lg font-bold">
              detectable sounds
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* display all sound labels the model can detect */}
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
