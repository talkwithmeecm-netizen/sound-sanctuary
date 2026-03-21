// ============================================================================
// hook for loading and using teachable machine audio model
// this hook manages the entire lifecycle of the ml audio classification:
// - dynamically loads tensorflow.js and speech commands libraries
// - connects to the user's teachable machine model via url
// - captures microphone audio and runs real-time predictions
// - returns predictions sorted by confidence for ui display
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { TmPrediction, categorizeSound, DetectedSound } from '@/types/sound';

// teachable machine model url provided by user
// this model was trained on teachablemachine.withgoogle.com
// it classifies audio into different sound categories
const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/Kl09OwSI-/';

// speech command recognizer interface from tensorflow speech-commands library
// this is the core class that handles audio capture and ml inference
interface SpeechCommandRecognizer {
  // starts continuous listening to the microphone
  // callback is invoked with prediction scores on each inference frame
  listen: (
    callback: (result: { scores: Float32Array }) => void,
    options?: { 
      includeSpectrogram?: boolean; 
      probabilityThreshold?: number; 
      invokeCallbackOnNoiseAndUnknown?: boolean;
      overlapFactor?: number;
    }
  ) => Promise<void>;
  // stops the microphone listening and inference loop
  stopListening: () => Promise<void>;
  // returns array of class labels the model was trained on
  wordLabels: () => string[];
}

// return type for the hook - exposes all state and controls to components
interface UseTeachableMachineReturn {
  isLoading: boolean;           // true while loading libraries and model
  isListening: boolean;         // true when actively capturing microphone audio
  error: string | null;         // error message if something went wrong
  predictions: TmPrediction[];  // current predictions sorted by probability
  detectedSound: DetectedSound | null;  // most recent high-confidence detection
  startListening: () => Promise<void>;  // function to start microphone capture
  stopListening: () => Promise<void>;   // function to stop microphone capture
  labels: string[];             // list of sound classes the model can detect
}

// main hook function that encapsulates all teachable machine functionality
// parameters:
//   onSoundDetected - callback invoked when a sound exceeds confidence threshold
//   confidenceThreshold - minimum probability (0-1) to trigger detection (default 0.7)
export function useTeachableMachine(
  onSoundDetected?: (sound: DetectedSound) => void,
  confidenceThreshold: number = 0.7
): UseTeachableMachineReturn {
  // ========== state management ==========
  
  // tracks whether tensorflow and model are still loading
  const [isLoading, setIsLoading] = useState(true);
  
  // tracks whether microphone is actively being captured
  const [isListening, setIsListening] = useState(false);
  
  // stores any error message to display to user
  const [error, setError] = useState<string | null>(null);
  
  // current frame's predictions from the model
  const [predictions, setPredictions] = useState<TmPrediction[]>([]);
  
  // the most recent sound that exceeded confidence threshold
  const [detectedSound, setDetectedSound] = useState<DetectedSound | null>(null);
  
  // list of class labels from the trained model
  const [labels, setLabels] = useState<string[]>([]);
  
  // ========== refs for mutable values ==========
  
  // reference to the speech recognizer instance
  // using ref because we don't want re-renders when model loads
  const modelRef = useRef<SpeechCommandRecognizer | null>(null);
  
  // tracks the last detected sound to implement debouncing
  // prevents spam notifications for the same continuous sound
  const lastDetectionRef = useRef<string>('');
  
  // timeout handle for resetting the debounce after 2 seconds
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ========== library loading function ==========
  
  // dynamically loads all required external scripts in sequence:
  // 1. tensorflow.js - core ml library for running neural networks
  // 2. speech-commands - tensorflow model for audio spectrogram processing
  // this approach avoids bundling large ml libraries in our main bundle
  const loadScripts = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // check if tensorflow is already loaded from a previous mount
      // this prevents duplicate script tags on component remount
      if ((window as any).tf && (window as any).speechCommands) {
        console.log('tensorflow and speech commands already loaded');
        resolve();
        return;
      }

      // step 1: load tensorflow.js core library
      // using version 1.3.1 for compatibility with speech-commands 0.4.0
      const tfScript = document.createElement('script');
      tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js';
      tfScript.async = true;
      
      tfScript.onload = () => {
        console.log('tensorflow.js loaded successfully');
        
        // step 2: load speech commands library after tensorflow is ready
        // this library provides the audio spectrogram and recognition features
        const speechScript = document.createElement('script');
        speechScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/speech-commands@0.4.0/dist/speech-commands.min.js';
        speechScript.async = true;
        
        speechScript.onload = () => {
          console.log('speech commands library loaded successfully');
          resolve();
        };
        
        speechScript.onerror = () => {
          reject(new Error('failed to load speech commands library'));
        };
        
        document.body.appendChild(speechScript);
      };
      
      tfScript.onerror = () => {
        reject(new Error('failed to load tensorflow library'));
      };
      
      document.body.appendChild(tfScript);
    });
  }, []);

  // ========== model initialization effect ==========
  
  // runs once on component mount to load libraries and initialize model
  // also handles cleanup when component unmounts
  useEffect(() => {
    // flag to prevent state updates after unmount
    let isMounted = true;
    
    // main initialization function
    async function initModel() {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('starting teachable machine initialization...');
        
        // load tensorflow and speech commands scripts
        await loadScripts();
        
        // verify speechCommands is available on window after script load
        // wait up to 5 seconds for it to become available
        let attempts = 0;
        while (!(window as any).speechCommands && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        // check if speech commands library loaded successfully
        const speechCommands = (window as any).speechCommands;
        if (!speechCommands) {
          throw new Error('speech commands library not available after loading');
        }
        
        console.log('creating speech commands recognizer with model url:', MODEL_URL);
        
        // create the recognizer using speech commands library
        // baseModelUrl points to the teachable machine model files
        // the model consists of model.json (architecture) and weight files
        const recognizer = speechCommands.create(
          'BROWSER_FFT',  // use browser's fft for audio processing
          undefined,      // no custom vocabulary
          MODEL_URL + 'model.json',      // model architecture file
          MODEL_URL + 'metadata.json'    // model metadata with class labels
        );
        
        // ensure the model weights are loaded into memory
        // this downloads and initializes the neural network
        console.log('ensuring model is loaded...');
        await recognizer.ensureModelLoaded();
        
        console.log('model loaded successfully!');
        console.log('available labels:', recognizer.wordLabels());
        
        // only update state if component is still mounted
        if (isMounted) {
          modelRef.current = recognizer;
          setLabels(recognizer.wordLabels());
          setIsLoading(false);
        }
      } catch (err) {
        console.error('error loading teachable machine model:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'failed to load model');
          setIsLoading(false);
        }
      }
    }
    
    // start initialization
    initModel();
    
    // cleanup function runs when component unmounts
    return () => {
      isMounted = false;
      
      // stop listening if active to release microphone
      if (modelRef.current) {
        try {
          modelRef.current.stopListening();
        } catch (e) {
          // ignore errors during cleanup
        }
      }
      
      // clear any pending detection timeout
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, [loadScripts]);

  // ========== start listening function ==========
  
  // begins capturing microphone audio and running ml predictions
  // requests microphone permission if not already granted
  const startListening = useCallback(async () => {
    // check if model is ready
    if (!modelRef.current) {
      setError('model not loaded yet - please wait');
      return;
    }
    
    try {
      setError(null);
      console.log('starting microphone listening...');
      
      // call listen() which:
      // 1. requests microphone permission
      // 2. starts audio capture
      // 3. runs inference on each audio frame
      // 4. calls our callback with prediction scores
      await modelRef.current.listen(
        (result) => {
          // get the raw probability scores from the model
          const scores = result.scores;
          
          // get class labels to pair with scores
          const wordLabels = modelRef.current!.wordLabels();
          
          // convert scores array to prediction objects
          // each prediction has className and probability
          const preds: TmPrediction[] = wordLabels.map((label, index) => ({
            className: label,
            probability: scores[index],
          }));
          
          // sort predictions by probability (highest first)
          // this makes it easy to show top predictions in ui
          preds.sort((a, b) => b.probability - a.probability);
          setPredictions(preds);
          
          // check if top prediction exceeds our confidence threshold
          // threshold is configurable (default 0.7 = 70% confidence)
          const topPrediction = preds[0];
          if (topPrediction && topPrediction.probability >= confidenceThreshold) {
            // debounce logic: don't repeat same detection within 2 seconds
            // this prevents notification spam for continuous sounds
            if (topPrediction.className !== lastDetectionRef.current) {
              // update last detection to current sound
              lastDetectionRef.current = topPrediction.className;
              
              // create a detected sound object with all metadata
              const detected: DetectedSound = {
                label: topPrediction.className,
                category: categorizeSound(topPrediction.className),
                confidence: topPrediction.probability,
                timestamp: new Date(),
              };
              
              console.log('sound detected:', detected);
              
              // update state and notify parent component
              setDetectedSound(detected);
              onSoundDetected?.(detected);
              
              // reset debounce after 2 seconds to allow same sound again
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
          includeSpectrogram: false,    // we don't need raw spectrogram data
          probabilityThreshold: 0.3,    // model-level threshold (lower than ours)
          invokeCallbackOnNoiseAndUnknown: true,  // include background/unknown
          overlapFactor: 0.5,           // overlap between audio windows
        }
      );
      
      console.log('microphone listening started successfully');
      setIsListening(true);
    } catch (err) {
      console.error('error starting audio recognition:', err);
      setError(err instanceof Error ? err.message : 'failed to start listening - check microphone permissions');
    }
  }, [confidenceThreshold, onSoundDetected]);

  // ========== stop listening function ==========
  
  // stops microphone capture and clears prediction state
  // releases microphone so other apps can use it
  const stopListening = useCallback(async () => {
    if (!modelRef.current) return;
    
    try {
      console.log('stopping microphone listening...');
      await modelRef.current.stopListening();
      
      // clear all prediction-related state
      setIsListening(false);
      setPredictions([]);
      setDetectedSound(null);
      lastDetectionRef.current = '';
      
      console.log('microphone listening stopped');
    } catch (err) {
      console.error('error stopping audio recognition:', err);
    }
  }, []);

  // ========== return hook values ==========
  
  // expose all state and functions to the consuming component
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
