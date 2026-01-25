// sound category types for classification results

export type SoundCategory = 'alarming' | 'background' | 'safe';

// represents a detected sound from the ml model
export interface DetectedSound {
  label: string;
  category: SoundCategory;
  confidence: number;
  timestamp: Date;
}

// notification record stored in database
export interface NotificationRecord {
  id: string;
  user_id: string;
  sound_label: string;
  category: SoundCategory;
  confidence: number;
  detected_at: string;
}

// user settings for accessibility preferences
export interface UserSettings {
  id: string;
  user_id: string;
  text_size: number;
  button_size: number;
  icon_size: number;
  theme: 'dark' | 'light' | 'light-contrast';
  haptic_enabled: boolean;
}

// teachable machine prediction result
export interface TmPrediction {
  className: string;
  probability: number;
}

// mapping sound labels to categories
// this maps the teachable machine class names to our category types
export const soundCategoryMap: Record<string, SoundCategory> = {
  // alarming sounds - urgent attention needed
  'fire alarm': 'alarming',
  'smoke alarm': 'alarming',
  'siren': 'alarming',
  'car horn': 'alarming',
  'glass breaking': 'alarming',
  'scream': 'alarming',
  'dog bark': 'alarming',
  'baby cry': 'alarming',
  'door knock': 'alarming',
  'doorbell': 'alarming',
  
  // background noise - ambient sounds
  'background noise': 'background',
  'traffic': 'background',
  'wind': 'background',
  'rain': 'background',
  'crowd': 'background',
  'typing': 'background',
  'hvac': 'background',
  
  // safe sounds - normal environment
  'silence': 'safe',
  'speech': 'safe',
  'music': 'safe',
  'birds': 'safe',
  'water': 'safe',
};

// helper function to categorize a sound label
export function categorizeSound(label: string): SoundCategory {
  const normalizedLabel = label.toLowerCase().trim();
  return soundCategoryMap[normalizedLabel] || 'background';
}
