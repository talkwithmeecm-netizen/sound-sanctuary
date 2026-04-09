// ============================================================================
// sound monitor UI component - consumes context instead of owning the hook
// ============================================================================

import React from 'react';
import { useSoundMonitor } from './SoundMonitorContext';
import { SoundCategoryBadge } from './SoundCategoryIcon';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Progress } from './progress';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from './utils';

export function SoundMonitor() {
  const {
    isLoading,
    isListening,
    error,
    predictions,
    detectedSound,
    startListening,
    stopListening,
    labels,
    showAlert,
  } = useSoundMonitor();

  const topPredictions = predictions.slice(0, 6);

  return (
    <div className="space-y-6">
      <Card className={cn(
        'border-2 transition-all duration-300',
        isListening && 'border-primary pulse-ring',
        showAlert && 'flash-alert',
        showAlert && detectedSound?.category === 'alarming' && 'border-alarming',
        showAlert && detectedSound?.category === 'safe' && 'border-safe',
      )}>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-scaled-2xl font-bold">
            sound monitor
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
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

          <p className="text-center text-scaled-xl font-bold">
            {isLoading 
              ? 'loading model...'
              : isListening 
                ? 'listening...'
                : 'tap to start listening'}
          </p>

          {error && (
            <div 
              className="p-4 rounded-lg bg-destructive/20 border-2 border-destructive text-destructive text-scaled-base font-bold text-center"
              role="alert"
            >
              error: {error}
            </div>
          )}

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
