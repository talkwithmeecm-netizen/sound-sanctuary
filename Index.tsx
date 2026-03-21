// main monitoring page - shows sound detection interface
import React from 'react';
import { useAuth } from './AuthContext';
import { useUserSettings } from './useUserSettings';
import { SoundMonitor } from './SoundMonitor';
import { AlertTriangle, Volume2, Shield } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const { settings } = useUserSettings(user?.id ?? null);

  return (
    <div className="space-y-8">
      {/* sound category legend */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-alarming/10 border-2 border-alarming">
          <AlertTriangle className="w-8 h-8 text-alarming icon-scaled" strokeWidth={2.5} />
          <span className="text-scaled-sm font-bold text-center">alarming</span>
        </div>
        <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-noise/10 border-2 border-noise">
          <Volume2 className="w-8 h-8 text-noise icon-scaled" strokeWidth={2.5} />
          <span className="text-scaled-sm font-bold text-center">background</span>
        </div>
        <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-safe/10 border-2 border-safe">
          <Shield className="w-8 h-8 text-safe icon-scaled" strokeWidth={2.5} />
          <span className="text-scaled-sm font-bold text-center">safe</span>
        </div>
      </div>

      {/* main sound monitor */}
      <SoundMonitor hapticEnabled={settings?.haptic_enabled ?? true} />
    </div>
  );
};

export default Index;
