// ============================================================================
// hook for loading and using multiple teachable machine audio models
// loads all models simultaneously and aggregates predictions across them
// each model is associated with a sound category (alarming or safe)
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { TmPrediction, categorizeSound, DetectedSound, SoundCategory } from './sound';

// ============================================================================
// model configuration - each teachable machine model with its category
// alarming models detect dangerous/urgent sounds
// safe models detect normal environmental sounds
// ============================================================================
interface ModelConfig {
  url: string;
  name: string;
  defaultCategory: SoundCategory;
}

const MODELS: ModelConfig[] = [
  // alarming sound models
  { url: 'https://teachablemachine.withgoogle.com/models/XPNCyVZt1/', name: 'sirens', defaultCategory: 'alarming' },
  { url: 'https://teachablemachine.withgoogle.com/models/oNK4vW-01/', name: 'alarm', defaultCategory: 'alarming' },
  { url: 'https://teachablemachine.withgoogle.com/models/9KSunvSVQ/', name: 'yelling', defaultCategory: 'alarming' },
  // safe sound models
  { url: 'https://teachablemachine.withgoogle.com/models/RGehTMAbc/', name: 'appliances', defaultCategory: 'safe' },
  { url: 'https://teachablemachine.withgoogle.com/models/pvXxRC7k7/', name: 'weather', defaultCategory: 'safe' },
];

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

// a loaded model instance paired with its config
interface LoadedModel {
  recognizer: SpeechCommandRecognizer;
  config: ModelConfig;
  labels: string[];
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
  loadedModelCount: number;
  totalModelCount: number;
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
  const [loadedModelCount, setLoadedModelCount] = useState(0);

  // refs for mutable values
  const modelsRef = useRef<LoadedModel[]>([]);
  const lastDetectionRef = useRef<string>('');
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // store latest predictions from each model for aggregation
  const modelPredictionsRef = useRef<Map<string, TmPrediction[]>>(new Map());

  // load tensorflow and speech-commands scripts
  const loadScripts = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as any).tf && (window as any).speechCommands) {
        console.log('tensorflow and speech commands already loaded');
        resolve();
        return;
      }

      const tfScript = document.createElement('script');
      tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js';
      tfScript.async = true;

      tfScript.onload = () => {
        console.log('tensorflow.js loaded successfully');
        const speechScript = document.createElement('script');
        speechScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/speech-commands@0.4.0/dist/speech-commands.min.js';
        speechScript.async = true;

        speechScript.onload = () => {
          console.log('speech commands library loaded successfully');
          resolve();
        };
        speechScript.onerror = () => reject(new Error('failed to load speech commands library'));
        document.body.appendChild(speechScript);
      };
      tfScript.onerror = () => reject(new Error('failed to load tensorflow library'));
      document.body.appendChild(tfScript);
    });
  }, []);

  // initialize all models
  useEffect(() => {
    let isMounted = true;

    async function initModels() {
      try {
        setIsLoading(true);
        setError(null);
        console.log(`starting multi-model initialization (${MODELS.length} models)...`);

        await loadScripts();

        // wait for speechCommands to be available
        let attempts = 0;
        while (!(window as any).speechCommands && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        const speechCommands = (window as any).speechCommands;
        if (!speechCommands) {
          throw new Error('speech commands library not available after loading');
        }

        // load each model - do them sequentially to avoid overwhelming the browser
        const loaded: LoadedModel[] = [];
        for (const config of MODELS) {
          try {
            console.log(`loading model: ${config.name} (${config.url})`);
            const recognizer = speechCommands.create(
              'BROWSER_FFT',
              undefined,
              config.url + 'model.json',
              config.url + 'metadata.json'
            );
            await recognizer.ensureModelLoaded();

            const modelLabels = recognizer.wordLabels();
            console.log(`model ${config.name} loaded - labels:`, modelLabels);

            loaded.push({ recognizer, config, labels: modelLabels });

            if (isMounted) {
              setLoadedModelCount(loaded.length);
            }
          } catch (err) {
            console.error(`failed to load model ${config.name}:`, err);
            // continue loading other models even if one fails
          }
        }

        if (isMounted) {
          if (loaded.length === 0) {
            throw new Error('no models could be loaded');
          }

          modelsRef.current = loaded;

          // collect all unique labels across models
          const allLabels = new Set<string>();
          loaded.forEach(m => m.labels.forEach(l => allLabels.add(l)));
          setLabels(Array.from(allLabels));

          console.log(`${loaded.length}/${MODELS.length} models loaded successfully`);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('error loading models:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'failed to load models');
          setIsLoading(false);
        }
      }
    }

    initModels();

    return () => {
      isMounted = false;
      modelsRef.current.forEach(m => {
        try { m.recognizer.stopListening(); } catch (e) { /* ignore */ }
      });
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, [loadScripts]);

  // start listening on all models
  const startListening = useCallback(async () => {
    if (modelsRef.current.length === 0) {
      setError('models not loaded yet - please wait');
      return;
    }

    try {
      setError(null);
      console.log(`starting listening on ${modelsRef.current.length} models...`);

      for (const model of modelsRef.current) {
        await model.recognizer.listen(
          (result) => {
            const scores = result.scores;
            const wordLabels = model.recognizer.wordLabels();

            // create predictions with model context
            const preds: TmPrediction[] = wordLabels.map((label, index) => ({
              className: label,
              probability: scores[index],
            }));

            preds.sort((a, b) => b.probability - a.probability);

            // store this model's predictions
            modelPredictionsRef.current.set(model.config.name, preds);

            // aggregate all model predictions and pick the best ones
            const allPreds: TmPrediction[] = [];
            modelPredictionsRef.current.forEach((modelPreds) => {
              allPreds.push(...modelPreds);
            });
            allPreds.sort((a, b) => b.probability - a.probability);

            // deduplicate by label, keeping highest probability
            const seen = new Set<string>();
            const uniquePreds = allPreds.filter(p => {
              if (seen.has(p.className)) return false;
              seen.add(p.className);
              return true;
            });

            setPredictions(uniquePreds.slice(0, 6));

            // check top prediction from this model for detection
            const topPred = preds[0];
            if (topPred && topPred.probability >= confidenceThreshold) {
              const category = categorizeSound(topPred.className);
              // only trigger detection for non-background sounds,
              // or if the model's default category matches
              const isBackgroundLabel = category === 'background';

              if (!isBackgroundLabel) {
                const detectionKey = `${model.config.name}:${topPred.className}`;
                if (detectionKey !== lastDetectionRef.current) {
                  lastDetectionRef.current = detectionKey;

                  const detected: DetectedSound = {
                    label: topPred.className,
                    category,
                    confidence: topPred.probability,
                    timestamp: new Date(),
                  };

                  console.log(`sound detected by ${model.config.name}:`, detected);
                  setDetectedSound(detected);
                  onSoundDetected?.(detected);

                  if (detectionTimeoutRef.current) {
                    clearTimeout(detectionTimeoutRef.current);
                  }
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
        console.log(`model ${model.config.name} listening started`);
      }

      setIsListening(true);
      console.log('all models listening');
    } catch (err) {
      console.error('error starting audio recognition:', err);
      setError(err instanceof Error ? err.message : 'failed to start listening - check microphone permissions');
    }
  }, [confidenceThreshold, onSoundDetected]);

  // stop listening on all models
  const stopListening = useCallback(async () => {
    try {
      console.log('stopping all model listeners...');
      for (const model of modelsRef.current) {
        try {
          await model.recognizer.stopListening();
        } catch (e) {
          console.error(`error stopping ${model.config.name}:`, e);
        }
      }

      setIsListening(false);
      setPredictions([]);
      setDetectedSound(null);
      lastDetectionRef.current = '';
      modelPredictionsRef.current.clear();
      console.log('all models stopped');
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
    loadedModelCount,
    totalModelCount: MODELS.length,
  };
}
