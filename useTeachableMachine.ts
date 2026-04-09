// ============================================================================
// hook for loading and using a teachable machine audio model
// loads the model and provides real-time sound predictions
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { TmPrediction, categorizeSound, DetectedSound } from './sound';

// the single teachable machine model url
const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/ZofTW9DIj/';

// speech command recognizer interface from tensorflow speech-commands library
interface SpeechCommandRecognizer {
  listen: (
    callback: (result: { scores: Float32Array }) => void,
    options?: {
      includeSpectrogram?: boolean;
      probabilityThreshold?: number;
      invokeCallbackOnNoiseAndUnknown?: boolean;
      overlapFactor?: number;
    }
  ) => Promise<void>;
  stopListening: () => Promise<void>;
  wordLabels: () => string[];
}

// return type for the hook
interface UseTeachableMachineReturn {
  isLoading: boolean;
  isListening: boolean;
  error: string | null;
  predictions: TmPrediction[];
  detectedSound: DetectedSound | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  labels: string[];
}

export function useTeachableMachine(
  onSoundDetected?: (sound: DetectedSound) => void,
  confidenceThreshold: number = 0.7
): UseTeachableMachineReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<TmPrediction[]>([]);
  const [detectedSound, setDetectedSound] = useState<DetectedSound | null>(null);
  const [labels, setLabels] = useState<string[]>([]);

  const recognizerRef = useRef<SpeechCommandRecognizer | null>(null);
  const lastDetectionRef = useRef<string>('');
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // load tensorflow and speech-commands scripts
  const loadScripts = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as any).tf && (window as any).speechCommands) {
        resolve();
        return;
      }

      const tfScript = document.createElement('script');
      tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js';
      tfScript.async = true;

      tfScript.onload = () => {
        const speechScript = document.createElement('script');
        speechScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/speech-commands@0.4.0/dist/speech-commands.min.js';
        speechScript.async = true;
        speechScript.onload = () => resolve();
        speechScript.onerror = () => reject(new Error('failed to load speech commands library'));
        document.body.appendChild(speechScript);
      };
      tfScript.onerror = () => reject(new Error('failed to load tensorflow library'));
      document.body.appendChild(tfScript);
    });
  }, []);

  // initialize model
  useEffect(() => {
    let isMounted = true;

    async function initModel() {
      try {
        setIsLoading(true);
        setError(null);
        console.log('loading teachable machine model...');

        await loadScripts();

        let attempts = 0;
        while (!(window as any).speechCommands && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        const speechCommands = (window as any).speechCommands;
        if (!speechCommands) {
          throw new Error('speech commands library not available after loading');
        }

        const recognizer = speechCommands.create(
          'BROWSER_FFT',
          undefined,
          MODEL_URL + 'model.json',
          MODEL_URL + 'metadata.json'
        );
        await recognizer.ensureModelLoaded();

        const modelLabels = recognizer.wordLabels();
        console.log('model loaded - labels:', modelLabels);

        if (isMounted) {
          recognizerRef.current = recognizer;
          setLabels(modelLabels);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('error loading model:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'failed to load model');
          setIsLoading(false);
        }
      }
    }

    initModel();

    return () => {
      isMounted = false;
      try { recognizerRef.current?.stopListening(); } catch (e) { /* ignore */ }
      if (detectionTimeoutRef.current) clearTimeout(detectionTimeoutRef.current);
    };
  }, [loadScripts]);

  // start listening
  const startListening = useCallback(async () => {
    if (!recognizerRef.current) {
      setError('model not loaded yet - please wait');
      return;
    }

    try {
      setError(null);

      await recognizerRef.current.listen(
        (result) => {
          const scores = result.scores;
          const wordLabels = recognizerRef.current!.wordLabels();

          const preds: TmPrediction[] = wordLabels.map((label, index) => ({
            className: label,
            probability: scores[index],
          }));
          preds.sort((a, b) => b.probability - a.probability);

          // filter out background predictions
          const filteredPreds = preds.filter(p => {
            const cat = categorizeSound(p.className);
            return cat !== 'background';
          });

          setPredictions(filteredPreds.slice(0, 6));

          const topPred = preds[0];
          if (topPred && topPred.probability >= confidenceThreshold) {
            const category = categorizeSound(topPred.className);

            if (category !== 'background') {
              const detectionKey = topPred.className;
              if (detectionKey !== lastDetectionRef.current) {
                lastDetectionRef.current = detectionKey;

                const detected: DetectedSound = {
                  label: topPred.className,
                  category,
                  confidence: topPred.probability,
                  timestamp: new Date(),
                };

                console.log('sound detected:', detected);
                setDetectedSound(detected);
                onSoundDetected?.(detected);

                if (detectionTimeoutRef.current) clearTimeout(detectionTimeoutRef.current);
                detectionTimeoutRef.current = setTimeout(() => {
                  lastDetectionRef.current = '';
                }, 2000);
              }
            }
          }
        },
        {
          includeSpectrogram: false,
          probabilityThreshold: 0.3,
          invokeCallbackOnNoiseAndUnknown: true,
          overlapFactor: 0.5,
        }
      );

      setIsListening(true);
      console.log('listening started');
    } catch (err) {
      console.error('error starting audio recognition:', err);
      setError(err instanceof Error ? err.message : 'failed to start listening - check microphone permissions');
    }
  }, [confidenceThreshold, onSoundDetected]);

  // stop listening
  const stopListening = useCallback(async () => {
    try {
      await recognizerRef.current?.stopListening();
      setIsListening(false);
      setPredictions([]);
      setDetectedSound(null);
      lastDetectionRef.current = '';
    } catch (err) {
      console.error('error stopping audio recognition:', err);
    }
  }, []);

  return {
    isLoading,
    isListening,
    error,
    predictions,
    detectedSound,
    startListening,
    stopListening,
    labels,
  };
}
