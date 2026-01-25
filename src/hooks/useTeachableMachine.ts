// hook for loading and using teachable machine audio model
import { useState, useEffect, useRef, useCallback } from 'react';
import { TmPrediction, categorizeSound, DetectedSound } from '@/types/sound';

// teachable machine model url provided by user
const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/Kl09OwSI-/';

// extend window to include teachable machine types
declare global {
  interface Window {
    tmAudio: {
      create: (checkpointUrl: string, metadataUrl?: string) => Promise<SpeechCommandRecognizer>;
    };
  }
}

// speech command recognizer interface from teachable machine
interface SpeechCommandRecognizer {
  listen: (
    callback: (result: { scores: Float32Array }) => void,
    options?: { includeSpectrogram?: boolean; probabilityThreshold?: number; invokeCallbackOnNoiseAndUnknown?: boolean }
  ) => Promise<void>;
  stopListening: () => Promise<void>;
  wordLabels: () => string[];
}

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
  // state for model loading and predictions
  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<TmPrediction[]>([]);
  const [detectedSound, setDetectedSound] = useState<DetectedSound | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  
  // refs for model and audio context
  const modelRef = useRef<SpeechCommandRecognizer | null>(null);
  const lastDetectionRef = useRef<string>('');
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // load the teachable machine library script
  const loadScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // check if already loaded
      if (window.tmAudio) {
        resolve();
        return;
      }

      // first load tensorflow.js
      const tfScript = document.createElement('script');
      tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js';
      tfScript.async = true;
      
      tfScript.onload = () => {
        // then load speech commands
        const speechScript = document.createElement('script');
        speechScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/speech-commands@0.4.0/dist/speech-commands.min.js';
        speechScript.async = true;
        
        speechScript.onload = () => {
          // finally load teachable machine audio
          const tmScript = document.createElement('script');
          tmScript.src = 'https://cdn.jsdelivr.net/npm/@parity-asia/teachablemachine-audio@0.1.1/dist/teachablemachine-audio.min.js';
          tmScript.async = true;
          
          tmScript.onload = () => resolve();
          tmScript.onerror = () => reject(new Error('failed to load teachable machine library'));
          document.body.appendChild(tmScript);
        };
        
        speechScript.onerror = () => reject(new Error('failed to load speech commands library'));
        document.body.appendChild(speechScript);
      };
      
      tfScript.onerror = () => reject(new Error('failed to load tensorflow library'));
      document.body.appendChild(tfScript);
    });
  }, []);

  // initialize the model
  useEffect(() => {
    async function initModel() {
      try {
        setIsLoading(true);
        setError(null);
        
        // load required scripts
        await loadScript();
        
        // wait for tmAudio to be available
        let attempts = 0;
        while (!window.tmAudio && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!window.tmAudio) {
          throw new Error('teachable machine library not loaded');
        }
        
        // create the model
        const model = await window.tmAudio.create(
          MODEL_URL + 'model.json',
          MODEL_URL + 'metadata.json'
        );
        
        modelRef.current = model;
        setLabels(model.wordLabels());
        setIsLoading(false);
      } catch (err) {
        console.error('error loading teachable machine model:', err);
        setError(err instanceof Error ? err.message : 'failed to load model');
        setIsLoading(false);
      }
    }
    
    initModel();
    
    // cleanup
    return () => {
      if (modelRef.current && isListening) {
        modelRef.current.stopListening();
      }
    };
  }, [loadScript]);

  // start listening to microphone
  const startListening = useCallback(async () => {
    if (!modelRef.current) {
      setError('model not loaded');
      return;
    }
    
    try {
      setError(null);
      
      await modelRef.current.listen(
        (result) => {
          const scores = result.scores;
          const wordLabels = modelRef.current!.wordLabels();
          
          // convert scores to predictions
          const preds: TmPrediction[] = wordLabels.map((label, index) => ({
            className: label,
            probability: scores[index],
          }));
          
          // sort by probability
          preds.sort((a, b) => b.probability - a.probability);
          setPredictions(preds);
          
          // check if top prediction exceeds threshold
          const topPrediction = preds[0];
          if (topPrediction && topPrediction.probability >= confidenceThreshold) {
            // debounce to avoid spam (don't repeat same detection within 2 seconds)
            if (topPrediction.className !== lastDetectionRef.current) {
              lastDetectionRef.current = topPrediction.className;
              
              const detected: DetectedSound = {
                label: topPrediction.className,
                category: categorizeSound(topPrediction.className),
                confidence: topPrediction.probability,
                timestamp: new Date(),
              };
              
              setDetectedSound(detected);
              onSoundDetected?.(detected);
              
              // reset last detection after 2 seconds
              if (detectionTimeoutRef.current) {
                clearTimeout(detectionTimeoutRef.current);
              }
              detectionTimeoutRef.current = setTimeout(() => {
                lastDetectionRef.current = '';
              }, 2000);
            }
          }
        },
        {
          includeSpectrogram: false,
          probabilityThreshold: 0.5,
          invokeCallbackOnNoiseAndUnknown: true,
        }
      );
      
      setIsListening(true);
    } catch (err) {
      console.error('error starting audio recognition:', err);
      setError(err instanceof Error ? err.message : 'failed to start listening');
    }
  }, [confidenceThreshold, onSoundDetected]);

  // stop listening
  const stopListening = useCallback(async () => {
    if (!modelRef.current) return;
    
    try {
      await modelRef.current.stopListening();
      setIsListening(false);
      setPredictions([]);
      setDetectedSound(null);
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
