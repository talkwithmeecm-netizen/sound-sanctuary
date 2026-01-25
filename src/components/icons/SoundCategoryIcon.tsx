// icons for different sound categories
import React from 'react';
import { AlertTriangle, Volume2, Shield, LucideIcon } from 'lucide-react';
import { SoundCategory } from '@/types/sound';
import { cn } from '@/lib/utils';

interface SoundCategoryIconProps {
  category: SoundCategory;
  className?: string;
  size?: number;
}

// map categories to their respective icons
const categoryIcons: Record<SoundCategory, LucideIcon> = {
  alarming: AlertTriangle,
  background: Volume2,
  safe: Shield,
};

// map categories to their color classes
const categoryColors: Record<SoundCategory, string> = {
  alarming: 'text-alarming',
  background: 'text-noise',
  safe: 'text-safe',
};

export function SoundCategoryIcon({ 
  category, 
  className,
  size = 24,
}: SoundCategoryIconProps) {
  const Icon = categoryIcons[category];
  
  return (
    <Icon 
      className={cn(
        'icon-scaled',
        categoryColors[category],
        className
      )}
      size={size}
      strokeWidth={2.5}
      aria-label={`${category} sound icon`}
    />
  );
}

// standalone category label with icon
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
      <SoundCategoryIcon category={category} size={20} />
      <span className="font-bold text-scaled-base">{label}</span>
      {confidence !== undefined && (
        <span className="text-scaled-sm text-muted-foreground ml-2">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </div>
  );
}
