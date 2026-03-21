// ============================================================================
// icons for different sound categories
// provides consistent icon components for alarming, background, and safe sounds
// includes both standalone icons and badge components with labels
// uses lucide-react icons with semantic color classes
// ============================================================================

import React from 'react';
import { AlertTriangle, Volume2, Shield, LucideIcon } from 'lucide-react';
import { SoundCategory } from './sound';
import { cn } from './utils';

// ============================================================================
// sound category icon props interface
// ============================================================================
interface SoundCategoryIconProps {
  // which category to show icon for
  category: SoundCategory;
  // additional css classes to apply
  className?: string;
  // icon size in pixels (default 24)
  size?: number;
}

// ============================================================================
// mapping of categories to their lucide icons
// alerttriangle for alarming - universal warning symbol
// volume2 for background - represents ambient noise
// shield for safe - represents security/safety
// ============================================================================
const categoryIcons: Record<SoundCategory, LucideIcon> = {
  alarming: AlertTriangle,
  background: Volume2,
  safe: Shield,
};

// ============================================================================
// mapping of categories to their semantic color classes
// these classes use css variables from our design system
// alarming = red, background/noise = cyan, safe = green
// ============================================================================
const categoryColors: Record<SoundCategory, string> = {
  alarming: 'text-alarming',
  background: 'text-noise',
  safe: 'text-safe',
};

// ============================================================================
// sound category icon component
// renders the appropriate icon with category-specific color
// ============================================================================
export function SoundCategoryIcon({ 
  category, 
  className,
  size = 24,
}: SoundCategoryIconProps) {
  // get the correct icon component for this category
  const Icon = categoryIcons[category];
  
  return (
    <Icon 
      className={cn(
        'icon-scaled',           // applies user's icon size preference
        categoryColors[category], // applies category-specific color
        className                // any additional classes passed in
      )}
      size={size}
      strokeWidth={2.5}          // thicker stroke for accessibility
      aria-label={`${category} sound icon`}
    />
  );
}

// ============================================================================
// sound category badge component
// displays icon + label + optional confidence percentage
// used for showing detected sounds in a visually distinct way
// ============================================================================
export function SoundCategoryBadge({
  category,
  label,
  confidence,
  className,
}: {
  category: SoundCategory;
  label: string;
  confidence?: number;
  className?: string;
}) {
  // background colors for each category (with transparency)
  // uses css variables for consistent theming
  const bgColors: Record<SoundCategory, string> = {
    alarming: 'bg-alarming/20 border-alarming',
    background: 'bg-noise/20 border-noise',
    safe: 'bg-safe/20 border-safe',
  };

  return (
    <div 
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 btn-scaled',
        bgColors[category],
        className
      )}
    >
      {/* category icon */}
      <SoundCategoryIcon category={category} size={20} />
      
      {/* sound label text */}
      <span className="font-bold text-scaled-base">{label}</span>
      
      {/* optional confidence percentage */}
      {confidence !== undefined && (
        <span className="text-scaled-sm text-muted-foreground ml-2">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </div>
  );
}
