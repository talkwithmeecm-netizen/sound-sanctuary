// ============================================================================
// sound category types for classification results
// only two categories: alarming and safe (no background noise tracking)
// ============================================================================

export type SoundCategory = 'alarming' | 'safe';

// ============================================================================
// detected sound interface
// ============================================================================
export interface DetectedSound {
  label: string;
  category: SoundCategory;
  confidence: number;
  timestamp: Date;
}

// ============================================================================
// notification record interface
// ============================================================================
export interface NotificationRecord {
  id: string;
  user_id: string;
  sound_label: string;
  category: SoundCategory;
  confidence: number;
  detected_at: string;
}

// ============================================================================
// user settings interface
// ============================================================================
export interface UserSettings {
  id: string;
  user_id: string;
  text_size: number;
  button_size: number;
  icon_size: number;
  theme: 'dark' | 'light' | 'light-contrast';
  haptic_enabled: boolean;
}

// ============================================================================
// teachable machine prediction interface
// ============================================================================
export interface TmPrediction {
  className: string;
  probability: number;
}

// ============================================================================
// sound category mapping
// maps labels to alarming or safe; unknown labels treated as 'background'
// which gets filtered out (never shown to user)
// ============================================================================
export const soundCategoryMap: Record<string, SoundCategory | 'background'> = {
  // ========== alarming sounds ==========
  'firetruck': 'alarming',
  'police siren': 'alarming',
  'ambulance': 'alarming',
  'siren': 'alarming',
  'sirens': 'alarming',
  'fire alarm': 'alarming',
  'smoke alarm': 'alarming',
  'alarm': 'alarming',
  'yelling': 'alarming',
  'screaming': 'alarming',
  'scream': 'alarming',
  'car horn': 'alarming',
  'glass breaking': 'alarming',
  'baby cry': 'alarming',
  'door knock': 'alarming',
  'doorbell': 'alarming',
  'horn': 'alarming',
  'emergency': 'alarming',
  'dog bark': 'alarming',

  // ========== background noise (filtered out) ==========
  'background noise': 'background',
  '_background noise_': 'background',
  'background_noise': 'background',
  'noise': 'background',
  'ambient': 'background',
  'traffic': 'background',
  'crowd': 'background',
  'typing': 'background',
  'hvac': 'background',

  // ========== safe sounds ==========
  'clock ticking': 'safe',
  'clock': 'safe',
  'dishwasher': 'safe',
  'vacuum cleaner': 'safe',
  'vacuum': 'safe',
  'appliance': 'safe',
  'appliances': 'safe',
  'rainfall': 'safe',
  'rain': 'safe',
  'wind': 'safe',
  'weather': 'safe',
  'silence': 'safe',
  '_silence_': 'safe',
  'speech': 'safe',
  'music': 'safe',
  'birds': 'safe',
  'water': 'safe',
  'talking': 'safe',
  'voice': 'safe',
  'whisper': 'safe',
  'whispers': 'safe',
  'footsteps': 'safe',
};

// ============================================================================
// helper function to categorize a sound label
// returns 'background' for unknown labels (which gets filtered out)
// ============================================================================
export function categorizeSound(label: string): SoundCategory | 'background' {
  const normalizedLabel = label.toLowerCase().trim();
  return soundCategoryMap[normalizedLabel] || 'background';
}
